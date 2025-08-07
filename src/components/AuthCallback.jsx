import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../config/supabase.js'
import { useAppContext } from '../context/AppContext.jsx'
import { spotifyAuthService } from '../api/spotifyAuthService.js'
import LoadingSpinner from './LoadingSpinner.jsx'

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { actions } = useAppContext()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔧 AuthCallback mounted, pathname:', location.pathname);
        console.log('🔧 AuthCallback search:', location.search);
        console.log('🔧 AuthCallback full URL:', window.location.href);
        
        // Check if this is a Spotify callback
        const urlParams = new URLSearchParams(location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        
        console.log('🔧 Code:', code);
        console.log('🔧 Error:', error);
        
        // Note: Spotify callbacks are now handled by dedicated SpotifyCallback component
        // This callback handler is only for regular Supabase OAuth (Google, etc.)

        // Handle regular Supabase auth callback
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Auth callback error:', sessionError.message)
          navigate('/login?error=auth_failed')
          return
        }

        if (data.session) {
          // Store user data
          const user = data.session.user
          localStorage.setItem('authToken', data.session.access_token)
          localStorage.setItem('user', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            respectBalance: 1000
          }))

          // Update app context
          actions.setUser({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            respectBalance: 1000,
            token: data.session.access_token
          })

          // Complete onboarding if not done
          actions.completeOnboarding()

          // Navigate to feed after successful authentication
          navigate('/feed')
        } else {
          // No session, redirect to login
          navigate('/login')
        }
      } catch (error) {
        console.error('Auth callback processing error:', error)
        navigate('/login?error=processing_failed')
      }
    }

    handleAuthCallback()
  }, [navigate, actions, location])

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-container">
        <LoadingSpinner size="large" text="Giriş işleminiz tamamlanıyor..." />
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Lütfen bekleyin...
        </p>
      </div>
    </div>
  )
}

export default AuthCallback 