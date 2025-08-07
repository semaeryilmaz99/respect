import { useState, useEffect } from 'react'
import { authService } from '../api'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuthenticated = authService.isAuthenticated()
        
        if (isAuthenticated) {
          const storedUser = authService.getStoredUser()
          if (storedUser) {
            setUser(storedUser)
          } else {
            // Fetch current user from API
            const userData = await authService.getCurrentUser()
            setUser(userData)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials) => {
    try {
      setLoading(true)
      setError(null)
      const response = await authService.login(credentials)
      setUser(response.user)
      return response
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signup = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await authService.signup(userData)
      setUser(response.user)
      return response
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authService.logout()
      setUser(null)
    } catch (err) {
      console.error('Logout error:', err)
      // Clear user state even if API call fails
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
      return userData
    } catch (err) {
      setError(err)
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    refreshUser,
    isAuthenticated: !!user
  }
} 