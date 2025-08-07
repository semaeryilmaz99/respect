import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { authService } from '../api'
import config from '../config/environment'

export const useAuthHook = () => {
  const navigate = useNavigate()
  const { state, actions } = useAppContext()
  const { user, isAuthenticated, loading, error } = state

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      actions.setLoading(true)
      actions.clearError()

      const response = await authService.login(credentials)
      
      // Store user data in context and localStorage
      actions.setUser(response.user)
      localStorage.setItem(config.STORAGE_KEYS.AUTH_TOKEN, response.token)
      localStorage.setItem(config.STORAGE_KEYS.USER, JSON.stringify(response.user))
      
      // Navigate to feed
      navigate('/feed')
      return response
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Giriş yapılırken bir hata oluştu'
      actions.setError(errorMessage)
      throw err
    } finally {
      actions.setLoading(false)
    }
  }, [actions, navigate])

  // Signup function
  const signup = useCallback(async (userData) => {
    try {
      actions.setLoading(true)
      actions.clearError()

      const response = await authService.signup(userData)
      
      // Store user data in context and localStorage
      actions.setUser(response.user)
      localStorage.setItem(config.STORAGE_KEYS.AUTH_TOKEN, response.token)
      localStorage.setItem(config.STORAGE_KEYS.USER, JSON.stringify(response.user))
      
      // Navigate to feed
      navigate('/feed')
      return response
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Kayıt olurken bir hata oluştu'
      actions.setError(errorMessage)
      throw err
    } finally {
      actions.setLoading(false)
    }
  }, [actions, navigate])

  // Note: Spotify login moved to spotifyAuthService.js
  const spotifyLogin = useCallback(async () => {
    console.warn('Legacy spotifyLogin called. Use spotifyAuthService.initiateSpotifyLogin() instead.')
    // Redirect to new implementation
    const { spotifyAuthService } = await import('../api/spotifyAuthService')
    spotifyAuthService.initiateSpotifyLogin()
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      actions.setLoading(true)
      
      // Call API logout
      await authService.logout()
      
      // Clear context state and localStorage
      actions.logout()
      
      // Navigate to login
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
      // Clear state even if API call fails
      actions.logout()
      navigate('/login')
    } finally {
      actions.setLoading(false)
    }
  }, [actions, navigate])

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN)
      
      if (!token) {
        return false
      }

      // Verify token with server
      const response = await authService.getCurrentUser()
      
      if (response.user) {
        actions.setUser(response.user)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Auth check error:', err)
      // Clear invalid token
      localStorage.removeItem(config.STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(config.STORAGE_KEYS.USER)
      actions.logout()
      return false
    }
  }, [actions])

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await authService.refreshToken()
      
      if (response.token) {
        localStorage.setItem(config.STORAGE_KEYS.AUTH_TOKEN, response.token)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Token refresh error:', err)
      logout()
      return false
    }
  }, [logout])

  // Forgot password
  const forgotPassword = useCallback(async (email) => {
    try {
      actions.setLoading(true)
      actions.clearError()

      const response = await authService.forgotPassword(email)
      return response
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Şifre sıfırlama isteği gönderilemedi'
      actions.setError(errorMessage)
      throw err
    } finally {
      actions.setLoading(false)
    }
  }, [actions])

  // Reset password
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      actions.setLoading(true)
      actions.clearError()

      const response = await authService.resetPassword(token, newPassword)
      return response
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Şifre sıfırlanamadı'
      actions.setError(errorMessage)
      throw err
    } finally {
      actions.setLoading(false)
    }
  }, [actions])

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    
    // Actions
    login,
    signup,
    spotifyLogin,
    logout,
    checkAuth,
    refreshToken,
    forgotPassword,
    resetPassword,
    
    // Utilities
    clearError: actions.clearError
  }
} 