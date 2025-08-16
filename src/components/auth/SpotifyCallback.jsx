import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const SpotifyCallback = () => {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = () => {
      try {
        // URL'den authorization code'u al
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        
        if (error) {
          console.error('❌ Spotify auth hatası:', error)
          // Parent window'a hata mesajı gönder
          if (window.opener) {
            window.opener.postMessage({
              type: 'SPOTIFY_AUTH_ERROR',
              error: error
            }, window.location.origin)
          }
          window.close()
          return
        }
        
        if (code) {
          console.log('✅ Spotify auth code alındı:', code)
          // Parent window'a başarı mesajı gönder
          if (window.opener) {
            window.opener.postMessage({
              type: 'SPOTIFY_AUTH_SUCCESS',
              code: code
            }, window.location.origin)
          }
          window.close()
        } else {
          console.error('❌ Authorization code bulunamadı')
          if (window.opener) {
            window.opener.postMessage({
              type: 'SPOTIFY_AUTH_ERROR',
              error: 'Authorization code bulunamadı'
            }, window.location.origin)
          }
          window.close()
        }
      } catch (error) {
        console.error('❌ Callback işleme hatası:', error)
        if (window.opener) {
          window.opener.postMessage({
            type: 'SPOTIFY_AUTH_ERROR',
            error: error.message
          }, window.location.origin)
        }
        window.close()
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="spotify-callback">
      <div className="callback-content">
        <h2>Spotify Bağlantısı Kuruluyor...</h2>
        <p>Lütfen bekleyin, otomatik olarak kapatılacak.</p>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  )
}

export default SpotifyCallback 