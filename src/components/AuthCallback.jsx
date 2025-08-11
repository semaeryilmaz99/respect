import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../config/supabase.js'
import { useAppContext } from '../context/AppContext.jsx'
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
          
          // ❌ localStorage kullanma - Supabase session yeterli
          // localStorage.setItem('authToken', data.session.access_token)
          // localStorage.setItem('user', JSON.stringify({...}))
          
          // ✅ App context'i güncelle (user ID ve email ile)
          actions.setUser({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            respectBalance: 1000,
            // Token'ı context'te saklama, Supabase session kullan
          })

          // Complete onboarding if not done
          actions.completeOnboarding()

          // Navigate to dashboard if spotify, otherwise feed
          const provider = user.app_metadata?.provider
          if (provider === 'spotify') {
            // Ensure spotify_connections row exists
            try {
              if (providerToken) {
                // Get Spotify profile to retrieve spotify_user_id
                const resp = await fetch('https://api.spotify.com/v1/me', {
                  headers: { Authorization: `Bearer ${providerToken}` }
                })
                if (resp.ok) {
                  const profile = await resp.json()
                  const { error: upsertError } = await supabase
                    .from('spotify_connections')
                    .upsert({
                      user_id: user.id,
                      spotify_user_id: profile.id,
                      access_token: providerToken,
                      refresh_token: providerRefreshToken || '',
                      token_expires_at: new Date(Date.now() + 55 * 60 * 1000) // ~55 minutes
                    }, { onConflict: 'user_id' })
                  
                  if (upsertError) {
                    console.error('❌ Spotify connections upsert failed:', upsertError);
                    // Hata olsa bile kullanıcıyı feed'e yönlendir
                  } else {
                    console.log('✅ Spotify connections updated successfully');
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Spotify connections upsert failed:', e);
              // Hata olsa bile kullanıcıyı feed'e yönlendir
            }
            navigate('/feed')
          } else {
            navigate('/feed')
          }
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