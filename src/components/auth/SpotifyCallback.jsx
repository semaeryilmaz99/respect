import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spotifyAuthService } from '../../api/spotifyAuthService';

const SpotifyCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Handling Spotify callback...');
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
          throw new Error(`Spotify authorization error: ${error}`);
        }
        
        if (!code) {
          throw new Error('Authorization code not found');
        }

        console.log('✅ Authorization code received');
        
        const result = await spotifyAuthService.handleSpotifyCallback(code);
        
        if (result.error) {
          throw new Error(result.error);
        }

        console.log('✅ Spotify authentication successful');
        setSuccess(true);
        
        // 3 saniye sonra feed sayfasına yönlendir
        setTimeout(() => {
          navigate('/feed');
        }, 3000);
        
      } catch (err) {
        console.error('❌ Spotify callback error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="spotify-callback-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <h2>Spotify Hesabınız Bağlanıyor...</h2>
        <p>Lütfen bekleyin, bu işlem birkaç saniye sürebilir.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spotify-callback-error">
        <div className="error-icon">❌</div>
        <h2>Bağlantı Hatası</h2>
        <p className="error-message">{error}</p>
        <div className="error-actions">
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Giriş Sayfasına Dön
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="spotify-callback-success">
        <div className="success-icon">✅</div>
        <h2>Bağlantı Başarılı!</h2>
        <p>Spotify hesabınız başarıyla bağlandı.</p>
        <p>Sanatçı paneline yönlendiriliyorsunuz...</p>
        <div className="redirect-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return null;
};

export default SpotifyCallback; 