import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../config/supabase.js'
import { useAppContext } from '../context/AppContext.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import { spotifyAuthService } from '../api/spotifyAuthService.js'

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
        
        // Supabase OAuth (Spotify dahil) sonrası buraya dönüyor
        const urlParams = new URLSearchParams(location.search)
        const error = urlParams.get('error')
        const errorCode = urlParams.get('error_code')
        const errorDescription = urlParams.get('error_description')
        console.log('🔧 OAuth error param:', error)
        if (error) {
          // Handle known errors explicitly, then return early
          if (errorCode === 'provider_email_needs_verification') {
            console.warn('🔐 Spotify email unverified. Description:', errorDescription)
            navigate('/login?error=spotify_email_unverified')
            return
          }
          navigate('/login?error=auth_failed')
          return
        }

        // Handle regular Supabase auth callback
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Auth callback error:', sessionError.message)
          navigate('/login?error=auth_failed')
          return
        }

        if (data.session) {
          // Store user data - Supabase session kullan, localStorage kullanma
          const user = data.session.user
          const providerToken = data.session.provider_token
          const providerRefreshToken = data.session.provider_refresh_token
          
          // ✅ App context'i güncelle (user ID ve email ile)
          actions.setUser({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            respectBalance: 1000,
          })

          // Complete onboarding if not done
          actions.completeOnboarding()

          // Spotify provider ise bağlantıyı kur (background'da)
          const provider = user.app_metadata?.provider
          if (provider === 'spotify' && providerToken) {
            // Spotify bağlantısını arka planda kur (async)
            spotifyAuthService.setupSpotifyConnection(user, providerToken, providerRefreshToken)
              .then(result => {
                if (result.success) {
                  console.log('✅ Spotify connection setup completed');
                } else {
                  console.warn('⚠️ Spotify connection setup failed:', result.error);
                }
              })
              .catch(error => {
                console.error('❌ Spotify connection setup error:', error);
              });
          }

          // Navigate to feed for all providers
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