// Safe Array Utilities

/**
 * Güvenli array map fonksiyonu
 * @param {Array} array - Map edilecek array
 * @param {Function} callback - Map callback fonksiyonu
 * @param {React.ReactNode} fallback - Array null/undefined ise gösterilecek fallback
 * @returns {React.ReactNode} Mapped array veya fallback
 */
export const safeMap = (array, callback, fallback = null) => {
  if (!array || !Array.isArray(array)) {
    return fallback;
  }
  
  return array.map(callback);
};

/**
 * Güvenli array render fonksiyonu
 * @param {Array} array - Render edilecek array
 * @param {Function} renderCallback - Render callback fonksiyonu
 * @param {React.ReactNode} emptyFallback - Array boş ise gösterilecek fallback
 * @param {React.ReactNode} nullFallback - Array null/undefined ise gösterilecek fallback
 * @returns {React.ReactNode} Rendered array veya fallback
 */
export const safeRender = (array, renderCallback, emptyFallback = null, nullFallback = null) => {
  if (!array || !Array.isArray(array)) {
    return nullFallback;
  }
  
  if (array.length === 0) {
    return emptyFallback;
  }
  
  return array.map(renderCallback);
};

/**
 * Array'in güvenli olup olmadığını kontrol eder
 * @param {any} array - Kontrol edilecek değer
 * @returns {boolean} Array güvenli mi
 */
export const isSafeArray = (array) => {
  return array && Array.isArray(array);
};

/**
 * Array'i güvenli hale getirir
 * @param {any} array - Güvenli hale getirilecek değer
 * @returns {Array} Güvenli array
 */
export const ensureArray = (array) => {
  return isSafeArray(array) ? array : [];
};
