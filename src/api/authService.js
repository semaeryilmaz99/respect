import { supabase } from '../config/supabase.js'

// Supabase Authentication service
const authService = {
  // Email & Password Login
  login: async ({ email, password }) => {
    try {
      console.log('🔐 Attempting login with Supabase...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      console.log('✅ Login successful:', data)

      // User profile bilgilerini al
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
        }

        // localStorage'a kaydet
        localStorage.setItem('authToken', data.session.access_token)
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: profile?.full_name || data.user.email,
          username: profile?.username,
          respectBalance: profile?.respect_balance || 1000
        }))
      }

      return {
        user: data.user,
        session: data.session,
        token: data.session.access_token
      }

    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    }
  },

  // Signup with profile creation
  signup: async ({ email, password, fullName, username }) => {
    try {
      console.log('🔐 Attempting signup with Supabase...')
      // Sadece Supabase Auth ile user oluştur (trigger otomatik profile oluşturacak)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      console.log('✅ Auth signup successful:', data)

      // Trigger otomatik olarak profile oluşturacak, manuel oluşturmaya gerek yok
      return {
        user: data.user,
        session: data.session,
        token: data.session?.access_token,
        needsConfirmation: !data.session
      }

    } catch (error) {
      console.error('❌ Signup error:', error)
      throw error
    }
  },

  // Note: Spotify authentication moved to spotifyAuthService.js

  // Google OAuth login
  googleLogin: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Google OAuth error:', error)
      throw error
    }
  },

  // Logout
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      // Clear localStorage
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      localStorage.removeItem('onboardingCompleted')

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Clear localStorage even if API call fails
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      throw error
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        throw new Error(error.message)
      }

      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken')
    return !!token
  },

  // Get stored user data
  getStoredUser: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true, message: 'Password reset email sent' }
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('authToken', session.access_token)
        localStorage.setItem('user', JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email,
          respectBalance: 1000
        }))
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
      callback(event, session)
    })
  }
}

export default authService;