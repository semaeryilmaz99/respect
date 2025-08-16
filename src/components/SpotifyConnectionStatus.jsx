import React, { useState, useEffect } from 'react';
import spotifyAuthService from '../api/spotifyAuthService';
import spotifyService from '../api/spotifyService';
import { useAuth } from '../hooks/useAuth';

const SpotifyConnectionStatus = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const connection = await spotifyAuthService.checkSpotifyConnection();
      setConnectionStatus({
        connected: connection.connected,
        data: connection.profile,
        error: connection.connected ? null : 'Bağlantı bulunamadı'
      });
    } catch (error) {
      console.error('Connection check error:', error);
      setConnectionStatus({ connected: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSpotify = async () => {
    try {
      // Yeni Spotify OAuth flow'u kullan
      const authUrl = spotifyService.getAuthUrl();
      
      // Yeni pencerede Spotify OAuth'u aç
      window.open(
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
              // Bağlantı durumunu yenile
              await checkConnection();
            }
          } catch (error) {
            console.error('❌ Spotify auth hatası:', error);
          }
        }
        
        if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
          console.error('❌ Spotify auth hatası:', event.data.error);
        }
      });
      
    } catch (error) {
      console.error('Spotify login error:', error);
    }
  };

  const handleSyncPlaylists = async () => {
    try {
      setSyncing(true);
      // Yeni servis yapısında playlist sync henüz implement edilmedi
      // Bu özellik gelecekte eklenebilir
      console.log('🔄 Playlist sync özelliği henüz mevcut değil');
      await checkConnection(); // Refresh status
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-600">Spotify bağlantısı kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  if (!connectionStatus) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <h3 className="font-medium">Spotify Bağlantısı</h3>
            <p className="text-sm text-gray-600">
              {connectionStatus.connected 
                ? 'Spotify hesabınız bağlı' 
                : connectionStatus.error || 'Bağlantı bulunamadı'
              }
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!connectionStatus.connected ? (
            <button
              onClick={handleConnectSpotify}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Spotify'a Bağlan
            </button>
          ) : (
            <button
              onClick={handleSyncPlaylists}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Senkronize Ediliyor...' : 'Çalma Listelerini Senkronize Et'}
            </button>
          )}
          
          <button
            onClick={checkConnection}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Yenile
          </button>
        </div>
      </div>
      
      {connectionStatus.connected && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Spotify hesabınız başarıyla bağlandı. Çalma listelerinizi senkronize edebilirsiniz.
          </p>
        </div>
      )}
      
      {!connectionStatus.connected && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ Spotify hesabınız bağlı değil. Çalma listelerinizi senkronize etmek için önce Spotify'a bağlanın.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpotifyConnectionStatus;
