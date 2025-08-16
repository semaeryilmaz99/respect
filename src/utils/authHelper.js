import { supabase } from '../config/supabase'
import { useState, useEffect } from 'react'

// Auth helper functions
export const authHelper = {
  // Mevcut kullanıcıyı al
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('❌ Get current user error:', error)
        return null
      }
      return user
    } catch (error) {
      console.error('❌ Get current user exception:', error)
      return null
    }
  },

  // Kullanıcı giriş yapmış mı kontrol et
  isAuthenticated: async () => {
    try {
      const user = await authHelper.getCurrentUser()
      return !!user
    } catch (error) {
      console.error('❌ Check authentication error:', error)
      return false
    }
  },

  // Kullanıcı ID'sini al
  getCurrentUserId: async () => {
    try {
      const user = await authHelper.getCurrentUser()
      return user?.id || null
    } catch (error) {
      console.error('❌ Get current user ID error:', error)
      return null
    }
  },

  // Session'ı yenile
  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('❌ Refresh session error:', error)
        return false
      }
      console.log('✅ Session refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ Refresh session exception:', error)
      return false
    }
  },

  // Auth state listener
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.email)
      callback(event, session)
    })
  },

  // Kullanıcı çıkış yap
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Sign out error:', error)
        return false
      }
      console.log('✅ User signed out successfully')
      return true
    } catch (error) {
      console.error('❌ Sign out exception:', error)
      return false
    }
  },

  // Token'ı kontrol et
  checkTokenValidity: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('❌ Get session error:', error)
        return false
      }
      
      if (!session) {
        console.log('⚠️ No active session')
        return false
      }
      
      // Token'ın süresi dolmuş mu kontrol et
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at
      
      if (expiresAt && now >= expiresAt) {
        console.log('⚠️ Token expired, refreshing...')
        return await authHelper.refreshSession()
      }
      
      console.log('✅ Token is valid')
      return true
    } catch (error) {
      console.error('❌ Check token validity error:', error)
      return false
    }
  }
}

// Auth state hook
export const useAuthState = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mevcut kullanıcıyı al
    const getInitialUser = async () => {
      const currentUser = await authHelper.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }

    getInitialUser()

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = authHelper.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  return { user, loading, isAuthenticated: !!user }
}

export default authHelper
