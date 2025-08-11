import React, { useState, useEffect } from 'react';
import { spotifyAuthService } from '../../api/spotifyAuthService';
import { supabase } from '../../config/supabase';

const ArtistDashboard = () => {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [spotifyProfile, setSpotifyProfile] = useState(null);

  useEffect(() => {
    checkUserAndConnection();
  }, []);

  const checkUserAndConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // If the user logged in via Spotify OAuth, consider them connected for UI purposes
        const provider = user.app_metadata?.provider;
        let isConnected = false;
        if (provider === 'spotify') {
          isConnected = true;
        } else {
          const { connected } = await spotifyAuthService.checkSpotifyConnection(user.id);
          isConnected = connected;
        }
        setSpotifyConnected(isConnected);

        if (isConnected) {
          // Spotify bağlantı bilgilerini getir
          const { data: connection } = await supabase
            .from('spotify_connections')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (connection) {
            setSpotifyProfile({
              display_name: user.user_metadata?.display_name || 'Spotify Artist',
              images: user.user_metadata?.avatar_url ? [{ url: user.user_metadata.avatar_url }] : []
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking user and connection:', error);
    }
  };

  const handleSpotifyConnect = () => {
    spotifyAuthService.initiateSpotifyLogin();
  };

  const handleSpotifyDisconnect = async () => {
    if (!user) return;
    
    try {
      const { success } = await spotifyAuthService.disconnectSpotify(user.id);
      if (success) {
        setSpotifyConnected(false);
        setSpotifyProfile(null);
        setSyncStatus({
          success: true,
          message: 'Spotify bağlantısı kaldırıldı'
        });
      }
    } catch (error) {
      setSyncStatus({
        success: false,
        message: `Hata: ${error.message}`
      });
    }
  };

  const syncSpotifyData = async (syncType) => {
    if (!user) return;
    
    setSyncLoading(true);
    setSyncStatus(null);

    try {
      const { data, error } = await spotifyAuthService.syncSpotifyData(user.id, syncType);

      if (error) throw error;

      setSyncStatus({
        success: data.success,
        message: `Senkronizasyon tamamlandı. ${data.processed} öğe işlendi, ${data.failed} başarısız.`
      });
    } catch (error) {
      setSyncStatus({
        success: false,
        message: `Hata: ${error.message}`
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="artist-dashboard">
      <div className="dashboard-header">
        <h1>Sanatçı Paneli</h1>
        {user && (
          <div className="user-info">
            <span>Hoş geldin, {user.user_metadata?.display_name || user.email}</span>
          </div>
        )}
      </div>
      
      {!spotifyConnected ? (
        <div className="spotify-connection-prompt">
          <div className="prompt-content">
            <div className="spotify-icon-large">
              <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <h2>Spotify Bağlantısı Gerekli</h2>
            <p>Şarkılarınızı senkronize etmek ve sanatçı profilinizi yönetmek için Spotify hesabınızı bağlayın.</p>
            <button 
              onClick={handleSpotifyConnect}
              className="btn-spotify-connect"
            >
              Spotify'a Bağlan
            </button>
          </div>
        </div>
      ) : (
        <div className="spotify-connected-dashboard">
          {spotifyProfile && (
            <div className="spotify-profile-card">
              <div className="profile-header">
                <img 
                  src={spotifyProfile.images?.[0]?.url || '/default-avatar.png'} 
                  alt={spotifyProfile.display_name}
                  className="profile-avatar"
                />
                <div className="profile-info">
                  <h3>{spotifyProfile.display_name}</h3>
                  <p>Spotify Sanatçısı</p>
                  <span className="connection-status connected">
                    ✓ Spotify Bağlı
                  </span>
                </div>
                <button 
                  onClick={handleSpotifyDisconnect}
                  className="btn-disconnect"
                  title="Spotify bağlantısını kaldır"
                >
                  Bağlantıyı Kes
                </button>
              </div>
            </div>
          )}

          <div className="sync-panel">
            <h2>Spotify Verilerini Senkronize Et</h2>
            <p>Şarkılarınızı ve albümlerinizi sisteme aktarın</p>
            
            <div className="sync-buttons">
              <button 
                onClick={() => syncSpotifyData('artist_profile')}
                disabled={syncLoading}
                className="sync-btn"
              >
                {syncLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Senkronize Ediliyor...
                  </>
                ) : (
                  <>
                    <span className="icon">👤</span>
                    Profil Bilgilerini Senkronize Et
                  </>
                )}
              </button>
              
              <button 
                onClick={() => syncSpotifyData('artist_songs')}
                disabled={syncLoading}
                className="sync-btn"
              >
                {syncLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Senkronize Ediliyor...
                  </>
                ) : (
                  <>
                    <span className="icon">🎵</span>
                    Şarkıları Senkronize Et
                  </>
                )}
              </button>
              
              <button 
                onClick={() => syncSpotifyData('artist_albums')}
                disabled={syncLoading}
                className="sync-btn"
              >
                {syncLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Senkronize Ediliyor...
                  </>
                ) : (
                  <>
                    <span className="icon">💿</span>
                    Albümleri Senkronize Et
                  </>
                )}
              </button>
            </div>

            {syncStatus && (
              <div className={`sync-status ${syncStatus.success ? 'success' : 'error'}`}>
                <span className="status-icon">
                  {syncStatus.success ? '✅' : '❌'}
                </span>
                <span className="status-message">{syncStatus.message}</span>
              </div>
            )}
          </div>

          <div className="dashboard-stats">
            <h3>İstatistikler</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Toplam Şarkı</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Toplam Albüm</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Toplam Respect</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Takipçi</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard; 