import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { playlistService } from '../api'
import Header from './Header'
import LoadingSpinner from './LoadingSpinner'
import { Heart, Eye, EyeOff, RefreshCw, Music, Users, Clock, Play, Star } from 'lucide-react'

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
        {/* Header Section */}
        <div className="playlists-header">
          <div className="header-content">
            <h1 className="page-title">🎵 Çalma Listelerim</h1>
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
          <div className="user-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Music className="w-6 h-6 text-orange-500" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total_playlists || 0}</div>
                <div className="stat-label">Toplam Liste</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total_tracks || 0}</div>
                <div className="stat-label">Toplam Şarkı</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.favorite_playlists || 0}</div>
                <div className="stat-label">Favori Liste</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.public_playlists || 0}</div>
                <div className="stat-label">Herkese Açık</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadPlaylists} className="retry-button">Tekrar Dene</button>
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
                <div className="playlist-image-container">
                  <img 
                    src={playlist.cover_url || '/assets/playlist/default.png'} 
                    alt={playlist.name}
                    className="playlist-image"
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
                          className={`w-5 h-5 ${playlist.user_playlist_preferences?.is_favorite ? 'text-red-500 fill-current' : 'text-white'}`}
                        />
                      </button>
                      
                      <button
                        className="action-button visibility-button"
                        onClick={(e) => handleToggleVisibility(playlist.id, e)}
                        title={playlist.user_playlist_preferences?.is_visible ? 'Gizle' : 'Göster'}
                      >
                        {playlist.user_playlist_preferences?.is_visible ? 
                          <Eye className="w-5 h-5 text-white" /> : 
                          <EyeOff className="w-5 h-5 text-white" />
                        }
                      </button>
                      
                      <button className="action-button play-button">
                        <Play className="w-5 h-5 text-white" />
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
                      <Music className="w-4 h-4 inline mr-1" />
                      {playlist.total_tracks} şarkı
                    </span>
                    <span className="playlist-owner">
                      {playlist.spotify_owner_name}
                    </span>
                  </div>
                  
                  <div className="playlist-badges">
                    {playlist.is_public && (
                      <span className="badge public">🌍 Herkese Açık</span>
                    )}
                    {playlist.is_collaborative && (
                      <span className="badge collaborative">👥 İşbirlikçi</span>
                    )}
                    {playlist.user_playlist_preferences?.is_favorite && (
                      <span className="badge favorite">⭐ Favori</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Music className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="empty-title">Henüz çalma listeniz yok</h3>
              <p className="empty-description">Spotify hesabınızdan çalma listelerinizi senkronize edin</p>
              <button 
                className="sync-button empty-sync-button"
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
          background: linear-gradient(135deg, #fef5e7 0%, #ffe8a0 100%);
          padding: 16px;
        }

        .playlists-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .playlists-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #f69f17 0%, #f9dc38 100%);
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(246, 159, 23, 0.25);
          border: 2px solid #f69f17;
        }

        .header-content h1 {
          color: #1b262e;
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .header-content p {
          color: #1b262e;
          margin: 0;
          font-size: 16px;
          opacity: 0.8;
        }

        .sync-button {
          background: linear-gradient(135deg, #1b262e 0%, #2d3748 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(27, 38, 46, 0.2);
        }

        .sync-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(27, 38, 46, 0.3);
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

        .error-message {
          background: linear-gradient(135deg, #fef5e7 0%, #ffebee 100%);
          border: 2px solid #ff6b6b;
          border-radius: 16px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
          color: #1b262e;
        }

        .retry-button {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
        }

        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        .playlist-card {
          background: linear-gradient(135deg, #fef5e7 0%, #ffe8a0 100%);
          border: 2px solid #f69f17;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(246, 159, 23, 0.15);
        }

        .playlist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(246, 159, 23, 0.25);
          border-color: #f9dc38;
        }

        .playlist-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .playlist-image {
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
          background: rgba(27, 38, 46, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .playlist-card:hover .playlist-overlay {
          opacity: 1;
        }

        .playlist-actions {
          display: flex;
          gap: 12px;
        }

        .action-button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
        }

        .play-button {
          background: linear-gradient(135deg, #f69f17 0%, #f9dc38 100%);
          border-color: #f69f17;
        }

        .playlist-info {
          padding: 20px;
        }

        .playlist-name {
          font-size: 18px;
          font-weight: 700;
          color: #1b262e;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .playlist-description {
          font-size: 14px;
          color: #666;
          margin: 0 0 16px 0;
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
          font-size: 12px;
          color: #666;
        }

        .track-count {
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .playlist-owner {
          font-weight: 500;
        }

        .playlist-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .badge {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge.public {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .badge.collaborative {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .badge.favorite {
          background: linear-gradient(135deg, #f69f17 0%, #f9dc38 100%);
          color: #1b262e;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #fef5e7 0%, #ffe8a0 100%);
          border: 2px solid #f69f17;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(246, 159, 23, 0.15);
        }

        .empty-icon {
          margin-bottom: 20px;
        }

        .empty-title {
          font-size: 24px;
          font-weight: 700;
          color: #1b262e;
          margin: 0 0 12px 0;
        }

        .empty-description {
          font-size: 16px;
          color: #666;
          margin: 0 0 24px 0;
        }

        .empty-sync-button {
          background: linear-gradient(135deg, #f69f17 0%, #f9dc38 100%);
          color: #1b262e;
          font-weight: 700;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .playlists-page {
            padding: 12px;
          }

          .playlists-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .header-content h1 {
            font-size: 24px;
          }

          .playlists-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .playlist-card {
            border-radius: 16px;
          }

          .playlist-image-container {
            height: 160px;
          }

          .playlist-info {
            padding: 16px;
          }

          .playlist-name {
            font-size: 16px;
          }

          .playlist-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }

        /* Desktop Enhancements */
        @media (min-width: 1024px) {
          .playlists-grid {
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
          }

          .playlist-card {
            border-radius: 24px;
          }

          .playlist-image-container {
            height: 220px;
          }
        }
      `}</style>
    </div>
  )
}

export default PlaylistsPage
