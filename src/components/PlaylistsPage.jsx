import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { playlistService } from '../api'
import Header from './Header'
import LoadingSpinner from './LoadingSpinner'
import { Heart, Eye, EyeOff, RefreshCw, Music, Users, Clock } from 'lucide-react'

const PlaylistsPage = () => {
  const navigate = useNavigate()
  const { state } = useAppContext()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (state.user?.id) {
      loadPlaylists()
      loadStats()
    }
  }, [state.user?.id])

  const loadPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await playlistService.getUserPlaylists(state.user.id)
      setPlaylists(data)
    } catch (err) {
      console.error('Error loading playlists:', err)
      setError('Çalma listeleri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await playlistService.getPlaylistStats(state.user.id)
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleSyncPlaylists = async () => {
    try {
      setSyncing(true)
      setError(null)
      
      await playlistService.syncUserPlaylists(state.user.id)
      await loadPlaylists()
      await loadStats()
    } catch (err) {
      console.error('Error syncing playlists:', err)
      setError('Çalma listeleri senkronize edilirken hata oluştu')
    } finally {
      setSyncing(false)
    }
  }

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`)
  }

  const handleToggleFavorite = async (playlistId, e) => {
    e.stopPropagation()
    try {
      await playlistService.togglePlaylistFavorite(state.user.id, playlistId)
      await loadPlaylists()
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handleToggleVisibility = async (playlistId, e) => {
    e.stopPropagation()
    try {
      await playlistService.togglePlaylistVisibility(state.user.id, playlistId)
      await loadPlaylists()
    } catch (err) {
      console.error('Error toggling visibility:', err)
    }
  }

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="playlists-page">
      <Header />
      
      <div className="playlists-container">
        <div className="playlists-header">
          <div className="header-content">
            <h1 className="page-title">Çalma Listelerim</h1>
            <p className="page-subtitle">Spotify çalma listelerinizi yönetin ve keşfedin</p>
          </div>
          
          <div className="header-actions">
            <button 
              className="sync-button"
              onClick={handleSyncPlaylists}
              disabled={syncing}
            >
              <RefreshCw className={`sync-icon ${syncing ? 'spinning' : ''}`} />
              {syncing ? 'Senkronize Ediliyor...' : 'Senkronize Et'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Music />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stats.total_playlists}</h3>
                <p className="stat-label">Toplam Liste</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Clock />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stats.total_tracks}</h3>
                <p className="stat-label">Toplam Şarkı</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Heart />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stats.favorite_playlists}</h3>
                <p className="stat-label">Favori Liste</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Users />
              </div>
              <div className="stat-content">
                <h3 className="stat-number">{stats.public_playlists}</h3>
                <p className="stat-label">Herkese Açık</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadPlaylists}>Tekrar Dene</button>
          </div>
        )}

        {/* Playlists Grid */}
        <div className="playlists-grid">
          {playlists && playlists.length > 0 ? (
            playlists.map((playlist) => (
              <div 
                key={playlist.id} 
                className="playlist-card"
                onClick={() => handlePlaylistClick(playlist.id)}
              >
                <div className="playlist-image">
                  <img 
                    src={playlist.cover_url || '/assets/playlist/default.png'} 
                    alt={playlist.name}
                    onError={(e) => {
                      e.target.src = '/assets/playlist/default.png'
                    }}
                  />
                  <div className="playlist-overlay">
                    <div className="playlist-actions">
                      <button
                        className="action-button favorite-button"
                        onClick={(e) => handleToggleFavorite(playlist.id, e)}
                        title={playlist.user_playlist_preferences?.is_favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      >
                        <Heart 
                          className={playlist.user_playlist_preferences?.is_favorite ? 'filled' : ''} 
                        />
                      </button>
                      
                      <button
                        className="action-button visibility-button"
                        onClick={(e) => handleToggleVisibility(playlist.id, e)}
                        title={playlist.user_playlist_preferences?.is_visible ? 'Gizle' : 'Göster'}
                      >
                        {playlist.user_playlist_preferences?.is_visible ? <Eye /> : <EyeOff />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="playlist-info">
                  <h3 className="playlist-name">{playlist.name}</h3>
                  <p className="playlist-description">
                    {playlist.description || 'Açıklama yok'}
                  </p>
                  
                  <div className="playlist-meta">
                    <span className="track-count">
                      {playlist.total_tracks} şarkı
                    </span>
                    <span className="playlist-owner">
                      {playlist.spotify_owner_name}
                    </span>
                  </div>
                  
                  <div className="playlist-badges">
                    {playlist.is_public && (
                      <span className="badge public">Herkese Açık</span>
                    )}
                    {playlist.is_collaborative && (
                      <span className="badge collaborative">İşbirlikçi</span>
                    )}
                    {playlist.user_playlist_preferences?.is_favorite && (
                      <span className="badge favorite">Favori</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Music />
              </div>
              <h3>Henüz çalma listeniz yok</h3>
              <p>Spotify hesabınızdan çalma listelerinizi senkronize edin</p>
              <button 
                className="sync-button"
                onClick={handleSyncPlaylists}
                disabled={syncing}
              >
                <RefreshCw className={`sync-icon ${syncing ? 'spinning' : ''}`} />
                {syncing ? 'Senkronize Ediliyor...' : 'Çalma Listelerini Senkronize Et'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .playlists-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .playlists-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .playlists-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .header-content h1 {
          color: white;
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .header-content p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-size: 16px;
        }

        .sync-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f9dc38;
          color: #1b262e;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sync-button:hover:not(:disabled) {
          background: #f5d428;
          transform: translateY(-1px);
        }

        .sync-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sync-icon {
          width: 16px;
          height: 16px;
        }

        .sync-icon.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .stat-icon {
          color: #f9dc38;
          width: 32px;
          height: 32px;
        }

        .stat-number {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-size: 14px;
        }

        .error-message {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          color: #dc3545;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }

        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .playlist-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .playlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .playlist-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .playlist-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .playlist-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .playlist-card:hover .playlist-overlay {
          opacity: 1;
        }

        .playlist-actions {
          display: flex;
          gap: 10px;
        }

        .action-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .action-button svg {
          width: 18px;
          height: 18px;
        }

        .action-button .filled {
          fill: #ff6b6b;
          color: #ff6b6b;
        }

        .playlist-info {
          padding: 20px;
        }

        .playlist-name {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .playlist-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin: 0 0 15px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .playlist-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .track-count {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
        }

        .playlist-owner {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        .playlist-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.public {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
        }

        .badge.collaborative {
          background: rgba(0, 123, 255, 0.2);
          color: #007bff;
        }

        .badge.favorite {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .empty-icon {
          color: rgba(255, 255, 255, 0.5);
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
        }

        .empty-state h3 {
          color: white;
          font-size: 24px;
          margin: 0 0 12px 0;
        }

        .empty-state p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0 0 30px 0;
        }

        @media (max-width: 768px) {
          .playlists-page {
            padding: 15px;
          }

          .playlists-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .playlists-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default PlaylistsPage
