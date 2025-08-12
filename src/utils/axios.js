import axios from 'axios'
import config from '../config/environment'
import { supabase } from '../config/supabase'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor - Add auth token from Supabase session
api.interceptors.request.use(
  async (requestConfig) => {
    try {
      // ✅ Supabase session'dan token al
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        requestConfig.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.warn('⚠️ Could not get Supabase session for API request:', error)
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
        // ✅ Supabase ile token yenile
        const { data, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          throw refreshError
        }
        
        if (data.session) {
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        
        // Refresh failed, sign out user
        await supabase.auth.signOut()
        
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