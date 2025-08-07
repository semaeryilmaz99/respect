import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import authService from '../api/authService'

const SignupPage = () => {
  const navigate = useNavigate()
  const { actions } = useAppContext()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    
    if (!firstName || !lastName || !email || !password) {
      setError('Tüm alanlar gereklidir')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      console.log('🔐 Attempting signup with Supabase...')
      
      const fullName = `${firstName} ${lastName}`
      const username = email.split('@')[0] // Simple username generation
      
      const result = await authService.signup({
        email,
        password,
        fullName,
        username
      })
      
      console.log('✅ Signup successful:', result)
      
      if (result.needsConfirmation) {
        // Email confirmation required
        setError('Email adresinizi onaylayın. Onay linki gönderildi.')
        setLoading(false)
        return
      }
      
      // Set user in context
      actions.setUser({
        id: result.user.id,
        email: result.user.email,
        name: fullName,
        respectBalance: 1000,
        token: result.token
      })
      
      // Complete onboarding
      actions.completeOnboarding()
      
      // Navigate to feed
      navigate('/feed')
      
    } catch (err) {
      console.error('❌ Signup error:', err)
      setError(err.message || 'Kayıt olurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSpotifySignup = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🎵 Attempting Spotify OAuth signup...')
      
      // Use modern spotify auth service
      const { spotifyAuthService } = await import('../api/spotifyAuthService')
      spotifyAuthService.initiateSpotifyLogin()
      
    } catch (err) {
      console.error('❌ Spotify signup error:', err)
      setError(err.message || 'Spotify ile kayıt olurken bir hata oluştu')
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

        <button onClick={handleSpotifySignup} className="spotify-login-button" disabled={loading}>
                          <img src="/assets/spotify.jpg" alt="Spotify" className="spotify-icon" />
          {loading ? 'Kayıt olunuyor...' : 'Spotify ile Kayıt Ol'}
        </button>

        <div className="divider">
          <span className="divider-text">veya</span>
        </div>

        <form className="login-form" onSubmit={handleSignup}>
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="firstName" className="input-label">Ad</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Adınız"
              className="login-input"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="lastName" className="input-label">Soyad</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyadınız"
              className="login-input"
              required
              disabled={loading}
            />
          </div>

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

          <div className="input-group">
            <label htmlFor="confirmPassword" className="input-label">Şifre Tekrar</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Şifrenizi tekrar girin"
              className="login-input"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="login-footer">
          <p className="signup-text">
            Zaten hesabınız var mı? 
            <Link to="/login" className="signup-link"> Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage 