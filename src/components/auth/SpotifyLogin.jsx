import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import spotifyAuthService from '../../api/spotifyAuthService';
import spotifyService from '../../api/spotifyService';
import LoadingSpinner from '../LoadingSpinner';

const SpotifyLogin = ({ onSuccess, className = '' }) => {
  const { actions } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleSpotifyLogin = async () => {
    try {
      setLoading(true);
      console.log('🎵 Spotify login başlatılıyor...');
      
      // Spotify OAuth URL'ini al
      const authUrl = spotifyService.getAuthUrl();
      
      // Yeni pencerede Spotify OAuth'u aç
      const popup = window.open(
        authUrl,
        'spotify-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Popup'tan gelen mesajları dinle
      window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
          const { code } = event.data;
          console.log('✅ Spotify auth code alındı:', code);
          
          try {
            // Spotify ile kayıt ol/giriş yap
            const result = await spotifyAuthService.signUpWithSpotify(code);
            
            if (result.success) {
              console.log('✅ Spotify ile başarıyla giriş yapıldı');
              actions.showToast(
                result.isNewUser ? 'Spotify ile kayıt olundu!' : 'Spotify ile giriş yapıldı!',
                'success'
              );
              
              // Kullanıcı bilgilerini güncelle
              actions.setUser(result.user);
              actions.setSession(result.session);
              
              // Popup'ı kapat
              if (popup) popup.close();
              
              // onSuccess callback'i çağır
              if (onSuccess) onSuccess(result);
            }
          } catch (error) {
            console.error('❌ Spotify auth hatası:', error);
            actions.showToast('Spotify ile giriş yapılamadı', 'error');
          }
        }
        
        if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
          console.error('❌ Spotify auth hatası:', event.data.error);
          actions.showToast('Spotify ile giriş yapılamadı', 'error');
          if (popup) popup.close();
        }
      });
      
    } catch (error) {
      console.error('❌ Spotify login hatası:', error);
      actions.showToast('Spotify girişi başlatılamadı', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`spotify-login-container ${className}`}>
      <button 
        onClick={handleSpotifyLogin}
        disabled={loading}
        className="spotify-login-btn"
        type="button"
      >
        {loading ? (
          <LoadingSpinner size="small" />
        ) : (
          <svg 
            className="spotify-icon" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            width="24" 
            height="24"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        )}
        <span>{loading ? 'Giriş yapılıyor...' : 'Spotify ile Giriş Yap'}</span>
      </button>
      
      <p className="spotify-login-description">
        Spotify hesabınızla bağlanarak şarkılarınızı otomatik olarak sisteme ekleyin
      </p>
    </div>
  );
};

export default SpotifyLogin; 