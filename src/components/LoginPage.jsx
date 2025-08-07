import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import authService from '../api/authService'

const LoginPage = () => {
  const navigate = useNavigate()
  const { actions } = useAppContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError('')
      
      console.log('🔐 Attempting login with Supabase...')
      
      const result = await authService.login({ email, password })
      
      console.log('✅ Login successful:', result)
      
      // Set user in context
      actions.setUser({
        id: result.user.id,
        email: result.user.email,
        name: result.user.user_metadata?.full_name || result.user.email,
        respectBalance: 1000,
        token: result.token
      })
      
      // Complete onboarding
              actions.completeOnboarding()
        
        // Navigate to feed after successful login
        navigate('/feed')
      
    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err.message || 'Giriş yapılırken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSpotifyLogin = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🎵 Attempting Spotify OAuth login...')
      
      // Use modern spotify auth service
      const { spotifyAuthService } = await import('../api/spotifyAuthService')
      spotifyAuthService.initiateSpotifyLogin()
      
    } catch (err) {
      console.error('❌ Spotify login error:', err)
      setError(err.message || 'Spotify ile giriş yapılırken bir hata oluştu')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔍 Attempting Google OAuth login...')
      
      const result = await authService.googleLogin()
      
      console.log('✅ Google OAuth login initiated:', result)
      
      // OAuth redirect will happen automatically
      // User will be redirected back to /auth/callback
      
    } catch (err) {
      console.error('❌ Google login error:', err)
      setError(err.message || 'Google ile giriş yapılırken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Respect Müzik</h1>
          <p className="login-subtitle">
            Sanatçılarını destekle, müziğe respect gönder
          </p>
        </div>

        <button onClick={handleSpotifyLogin} className="spotify-login-button" disabled={loading}>
                          <img src="/assets/spotify.jpg" alt="Spotify" className="spotify-icon" />
          {loading ? 'Giriş yapılıyor...' : 'Spotify ile Giriş Yap'}
        </button>

        <button onClick={handleGoogleLogin} className="google-login-button" disabled={loading}>
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="google-icon" />
          {loading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}
        </button>

        <div className="divider">
          <span className="divider-text">veya</span>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="email" className="input-label">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="login-input"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Şifre</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              className="login-input"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/forgot-password" className="forgot-link">
            Şifremi Unuttum
          </Link>
          
          <p className="signup-text">
            Hesabınız yok mu? 
            <Link to="/signup" className="signup-link"> Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 