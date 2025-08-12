// Debug Utilities

/**
 * Debug mode kontrolü
 */
export const isDebugMode = () => {
  return import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true';
};

/**
 * Güvenli console.log (sadece debug mode'da)
 */
export const debugLog = (message, ...args) => {
  if (isDebugMode()) {
    console.log(`🔍 [DEBUG] ${message}`, ...args);
  }
};

/**
 * Güvenli console.warn (sadece debug mode'da)
 */
export const debugWarn = (message, ...args) => {
  if (isDebugMode()) {
    console.warn(`⚠️ [DEBUG] ${message}`, ...args);
  }
};

/**
 * Güvenli console.error (her zaman)
 */
export const debugError = (message, error, ...args) => {
  console.error(`❌ [ERROR] ${message}`, error, ...args);
  
  // Debug mode'da ek bilgiler
  if (isDebugMode() && error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...args
    });
  }
};

/**
 * Array debug fonksiyonu
 */
export const debugArray = (arrayName, array) => {
  if (isDebugMode()) {
    if (!array) {
      console.warn(`⚠️ [DEBUG] ${arrayName} is null/undefined`);
    } else if (!Array.isArray(array)) {
      console.warn(`⚠️ [DEBUG] ${arrayName} is not an array:`, typeof array, array);
    } else {
      console.log(`✅ [DEBUG] ${arrayName} is safe array with ${array.length} items:`, array);
    }
  }
};

/**
 * Component render debug
 */
export const debugRender = (componentName, props) => {
  if (isDebugMode()) {
    console.log(`🎨 [RENDER] ${componentName} rendering with props:`, props);
  }
};

/**
 * API call debug
 */
export const debugApiCall = (apiName, params) => {
  if (isDebugMode()) {
    console.log(`🌐 [API] ${apiName} called with:`, params);
  }
};

/**
 * Performance debug
 */
export const debugPerformance = (operationName, startTime) => {
  if (isDebugMode()) {
    const duration = Date.now() - startTime;
    console.log(`⚡ [PERF] ${operationName} took ${duration}ms`);
  }
};
