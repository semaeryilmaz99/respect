/**
 * Uygulama genelinde tutarlı loglama için yardımcı fonksiyonlar
 */

const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Geliştirme ortamında tüm logları göster, production'da sadece WARN ve üstü
const currentLogLevel = process.env.NODE_ENV === 'production' ? LOG_LEVEL.WARN : LOG_LEVEL.DEBUG;

/**
 * Zaman damgalı ve formatlı log oluşturur
 * @param {string} level - Log seviyesi
 * @param {string} module - Log kaynağı (bileşen/servis adı)
 * @param {string} message - Log mesajı
 * @param {object} data - İsteğe bağlı veri objesi
 */
const logWithLevel = (level, module, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${module}]`;
  
  // Log seviyesine göre konsol metodu seç
  let logMethod;
  switch (level) {
    case 'DEBUG':
      logMethod = console.debug;
      break;
    case 'INFO':
      logMethod = console.info;
      break;
    case 'WARN':
      logMethod = console.warn;
      break;
    case 'ERROR':
      logMethod = console.error;
      break;
    default:
      logMethod = console.log;
  }
  
  // Log mesajını yazdır
  if (data) {
    logMethod(`${prefix} ${message}`, data);
  } else {
    logMethod(`${prefix} ${message}`);
  }
  
  // Hata durumunda özel işlem (örneğin bir analitik servisine gönderme)
  if (level === 'ERROR' && process.env.NODE_ENV === 'production') {
    // TODO: Gerçek uygulamada hata izleme servisi entegrasyonu eklenebilir
    // Örnek: Sentry.captureException(data);
  }
  
  return { timestamp, level, module, message, data };
};

// Log seviyesine göre filtreleme yapan yardımcı fonksiyonlar
const logger = {
  debug: (module, message, data) => {
    if (currentLogLevel <= LOG_LEVEL.DEBUG) {
      return logWithLevel('DEBUG', module, message, data);
    }
  },
  
  info: (module, message, data) => {
    if (currentLogLevel <= LOG_LEVEL.INFO) {
      return logWithLevel('INFO', module, message, data);
    }
  },
  
  warn: (module, message, data) => {
    if (currentLogLevel <= LOG_LEVEL.WARN) {
      return logWithLevel('WARN', module, message, data);
    }
  },
  
  error: (module, message, data) => {
    if (currentLogLevel <= LOG_LEVEL.ERROR) {
      return logWithLevel('ERROR', module, message, data);
    }
  },
  
  // OAuth akışlarını takip etmek için özel fonksiyon
  authFlow: (module, step, data) => {
    return logger.info(module, `Auth Flow Step: ${step}`, data);
  }
};

export default logger;