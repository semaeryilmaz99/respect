import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../config/supabase'
import { syncUserSpotifyData, checkSpotifyConnection, getSyncStatus } from '../api/spotifyUserDataService'
import Header from './Header'
import FavoriteButton from './FavoriteButton'
import LoadingSpinner from './LoadingSpinner'
import BackButton from './common/BackButton'
import Toast from './Toast'

const SongsPage = () => {
  const navigate = useNavigate()
  const { state } = useAppContext()
  const { user } = state
  
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const [hasSpotifyConnection, setHasSpotifyConnection] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true)
        
        if (user) {
          // Check if user has Spotify connection
          const connectionCheck = await checkSpotifyConnection(user.id)
          setHasSpotifyConnection(connectionCheck.hasConnection)
          
          if (connectionCheck.hasConnection) {
            // Get sync status
            const status = await getSyncStatus(user.id)
            setSyncStatus(status)
            
            // If no recent sync, show sync option
            if (!status.hasSyncHistory || !status.isRecent) {
              console.log('No recent sync found, user can sync their Spotify data')
            }
          }
        }
        
        // Fetch songs (will show mock data if no Spotify sync)
        await fetchSongs()
      } catch (error) {
        console.error('Error initializing page:', error)
        setError('Sayfa yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [user, syncStatus]) // syncStatus'u dependency olarak ekledik

  const fetchSongs = async () => {
    try {
      let query = supabase
        .from('songs')
        .select(`
          *,
          artists(name, avatar_url)
        `)
        .order('total_respect', { ascending: false })

      // Eğer kullanıcının Spotify bağlantısı varsa ve sync yapılmışsa, 
      // sadece Spotify ID'li şarkıları getir (kullanıcının playlist verileri)
      if (user && hasSpotifyConnection && syncStatus?.hasSyncHistory && syncStatus?.isRecent) {
        console.log('🎵 Kullanıcının Spotify playlist şarkıları getiriliyor...')
        query = query.not('spotify_id', 'is', null)
      } else {
        console.log('📋 Tüm şarkılar getiriliyor (mock data)')
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setSongs(data || [])
      console.log(`📊 ${data?.length || 0} şarkı yüklendi`)
    } catch (error) {
      console.error('Error fetching songs:', error)
      setError('Şarkılar yüklenirken hata oluştu')
    }
  }

  const handleSongClick = (songId) => {
    navigate(`/song/${songId}`)
  }

  const handleArtistClick = (artistId) => {
    navigate(`/artist/${artistId}`)
  }

  const handleSyncSpotifyData = async () => {
    if (!user) return
    
    try {
      setSyncing(true)
      const result = await syncUserSpotifyData(user.id)
      
      if (result.success) {
        setToast({
          show: true,
          message: result.message,
          type: 'success'
        })
        // Refresh songs after sync
        await fetchSongs()
        // Update sync status
        const status = await getSyncStatus(user.id)
        setSyncStatus(status)
      } else {
        setToast({
          show: true,
          message: result.message,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error syncing Spotify data:', error)
      setToast({
        show: true,
        message: 'Spotify verilerini senkronize ederken hata oluştu',
        type: 'error'
      })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="songs-page">
        <Header />
        <div className="error-message">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="songs-page">
      <div className="page-header mobile-only">
        <BackButton />
      </div>
      <Header />
      
      <div className="songs-container">
        <div className="songs-header">
          <h1 className="songs-title">Şarkılar</h1>
          <p className="songs-subtitle">Tüm şarkıları keşfedin ve favorilerinize ekleyin</p>
          
          {/* Spotify Sync Section */}
          {user && hasSpotifyConnection && (
            <div className="spotify-sync-section">
              {!syncStatus?.hasSyncHistory || !syncStatus?.isRecent ? (
                <div className="sync-prompt">
                  <p>🎵 Spotify çalma listelerinizden şarkıları senkronize edin</p>
                  <button 
                    className="sync-button"
                    onClick={handleSyncSpotifyData}
                    disabled={syncing}
                  >
                    {syncing ? 'Senkronize ediliyor...' : 'Spotify Verilerini Senkronize Et'}
                  </button>
                </div>
              ) : (
                <div className="sync-status">
                  <p>✅ Spotify verileriniz güncel</p>
                  <small>Son senkronizasyon: {new Date(syncStatus.lastSync.created_at).toLocaleString('tr-TR')}</small>
                  <p className="data-source-info">
                    📋 Şu anda <strong>Spotify playlist'inizdeki şarkılar</strong> gösteriliyor
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Data Source Info */}
          {(!user || !hasSpotifyConnection || !syncStatus?.hasSyncHistory || !syncStatus?.isRecent) && (
            <div className="data-source-info">
              <p>📋 Şu anda <strong>tüm şarkılar</strong> gösteriliyor</p>
              {user && hasSpotifyConnection && (
                <p>💡 Spotify verilerinizi senkronize ederek kişiselleştirilmiş şarkı listesi alabilirsiniz</p>
              )}
            </div>
          )}
        </div>

        <div className="songs-grid">
          {songs && Array.isArray(songs) ? songs.map((song) => (
            <div key={song.id} className="song-card">
              <div className="song-image-container" onClick={() => handleSongClick(song.id)}>
                <img 
                  src={song.cover_url || '/assets/song/Image.png'} 
                  alt={song.title}
                  className="song-image"
                />
              </div>
              
              <div className="song-info">
                <h3 className="song-title" onClick={() => handleSongClick(song.id)}>
                  {song.title}
                </h3>
                <p className="song-artist" onClick={() => handleArtistClick(song.artist_id)}>
                  {song.artists?.name || 'Bilinmeyen Sanatçı'}
                </p>
                <p className="song-album">{song.album}</p>
                <p className="song-duration">{song.duration}</p>
                
                <div className="song-stats">
                  <span className="song-respect">
                    {song.total_respect?.toLocaleString() || 0} Respect
                  </span>
                  <span className="song-favorites">
                    {song.favorites_count?.toLocaleString() || 0} Favori
                  </span>
                </div>
                
                <div className="song-actions">
                  <FavoriteButton songId={song.id} />
                </div>
              </div>
            </div>
          )) : (
            <div className="no-songs">
              <p>Henüz şarkı bulunamadı</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ show: false, message: '', type: 'info' })}
        />
      )}
    </div>
  )
}

export default SongsPage 