import axios from 'axios'
import config from '../config/environment'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (requestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID for debugging
    if (config.DEBUG_MODE) {
      requestConfig.headers['X-Request-ID'] = Date.now().toString()
      console.log(`🚀 API Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`, requestConfig)
    }
    
    return requestConfig
  },
  (error) => {
    if (config.DEBUG_MODE) {
      console.error('❌ Request Error:', error)
    }
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    if (config.DEBUG_MODE) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }
    
    // Return data directly
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    
    if (config.DEBUG_MODE) {
      console.error('❌ Response Error:', error.response?.data || error.message)
    }
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${config.API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          })
          
          const { access_token } = response.data
          localStorage.setItem(config.STORAGE_KEYS.AUTH_TOKEN, access_token)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
              } catch {
          // Refresh failed, redirect to login
          localStorage.removeItem(config.STORAGE_KEYS.AUTH_TOKEN)
          localStorage.removeItem('refreshToken')
          localStorage.removeItem(config.STORAGE_KEYS.USER)
          
          if (window.location.pathname !== '/login') {
          window.location.href = '/login'
          }
        }
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.'
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      error.message = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      error.message = 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.'
    }
    
    return Promise.reject(error)
  }
)

export default api 