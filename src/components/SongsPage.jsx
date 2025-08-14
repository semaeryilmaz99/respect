import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../config/supabase'
import { syncUserSpotifyData, checkSpotifyConnection, getSyncStatus } from '../api/spotifyUserDataService'
import Header from './Header'
import FavoriteButton from './FavoriteButton'
import LoadingSpinner from './LoadingSpinner'

import Toast from './Toast'

const SongsPage = () => {
  const navigate = useNavigate()
  const { state, dispatch } = useAppContext()
  const { user } = state
  
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const [sessionSyncKey, setSessionSyncKey] = useState(null) // Oturum bazlı sync kontrolü
  
  // Global state'den Spotify sync durumunu al
  const { spotifySync } = state
  const hasSpotifyConnection = spotifySync.hasConnection
  const syncStatus = spotifySync.syncStatus

  // syncStatus'u useMemo ile optimize et - sadece gerekli alanlar değiştiğinde yeniden hesapla
  const memoizedSyncStatus = useMemo(() => {
    if (!syncStatus) return null
    return {
      hasSyncHistory: syncStatus.hasSyncHistory,
      isRecent: syncStatus.isRecent,
      lastSync: syncStatus.lastSync
    }
  }, [syncStatus?.hasSyncHistory, syncStatus?.isRecent, syncStatus?.lastSync?.created_at])

  // Oturum bazlı sync kontrolü - kullanıcı her giriş yaptığında yeniden sync yapabilir
  const canSyncInThisSession = useMemo(() => {
    if (!user || !hasSpotifyConnection) return false
    
    // Eğer bu oturumda henüz sync yapılmamışsa, her zaman sync yapabilir
    if (!sessionSyncKey) return true
    
    // Eğer bu oturumda zaten sync yapılmışsa, sync status'a göre karar ver
    return !memoizedSyncStatus?.hasSyncHistory || !memoizedSyncStatus?.isRecent
  }, [user, hasSpotifyConnection, sessionSyncKey, memoizedSyncStatus])

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true)
        
        // Kullanıcı değiştiğinde session sync key'i sıfırla
        setSessionSyncKey(null)
        
        if (user) {
          // Global state'de zaten sync durumu varsa tekrar kontrol etme
          if (!spotifySync.hasConnection || !spotifySync.syncStatus) {
            // Check if user has Spotify connection
            const connectionCheck = await checkSpotifyConnection(user.id)
            dispatch({ type: 'SET_SPOTIFY_CONNECTION', payload: connectionCheck.hasConnection })
            
            if (connectionCheck.hasConnection) {
              // Get sync status
              const status = await getSyncStatus(user.id)
              dispatch({ type: 'SET_SPOTIFY_SYNC_STATUS', payload: status })
              
              // If no recent sync, show sync option
              if (!status.hasSyncHistory || !status.isRecent) {
                console.log('No recent sync found, user can sync their Spotify data')
              }
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
  }, [user]) // Sadece user dependency'si

  // Ayrı bir useEffect ile memoizedSyncStatus değişikliklerini izle
  useEffect(() => {
    if (user && hasSpotifyConnection && memoizedSyncStatus) {
      // Sync status değiştiğinde sadece verileri yenile
      fetchSongs()
    }
  }, [memoizedSyncStatus]) // memoizedSyncStatus'u kullan

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
      if (user && hasSpotifyConnection && memoizedSyncStatus?.hasSyncHistory && memoizedSyncStatus?.isRecent) {
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
        // Bu oturumda sync yapıldığını işaretle
        setSessionSyncKey(Date.now())
        
        setToast({
          show: true,
          message: result.message,
          type: 'success'
        })
        // Refresh songs after sync
        await fetchSongs()
        // Update sync status
        const status = await getSyncStatus(user.id)
        dispatch({ type: 'SET_SPOTIFY_SYNC_STATUS', payload: status })
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
      <Header />
      
      <div className="songs-container">
        <div className="songs-header">
          <h1 className="songs-title">Şarkılar</h1>
          <p className="songs-subtitle">Tüm şarkıları keşfedin ve favorilerinize ekleyin</p>
          
          {/* Spotify Sync Section */}
          {user && hasSpotifyConnection && (
            <div className="spotify-sync-section">
              {canSyncInThisSession ? (
                <div className="sync-prompt">
                  <p>Spotify çalma listelerinizden şarkıları senkronize edin</p>
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
                  <p>Spotify verileriniz güncel</p>
                  <small>Son senkronizasyon: {new Date(memoizedSyncStatus.lastSync.created_at).toLocaleString('tr-TR')}</small>
                  {memoizedSyncStatus.daysSinceSync !== undefined && (
                    <small className="sync-age-info">
                      {memoizedSyncStatus.daysSinceSync === 0 ? 'Bugün' : 
                          memoizedSyncStatus.daysSinceSync === 1 ? '1 gün önce' : 
                          `${memoizedSyncStatus.daysSinceSync} gün önce`} senkronize edildi
                    </small>
                  )}
                  <p className="data-source-info">
                    Şu anda <strong>Spotify playlist'inizdeki şarkılar</strong> gösteriliyor
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Data Source Info */}
          {(!user || !hasSpotifyConnection || !memoizedSyncStatus?.hasSyncHistory || !memoizedSyncStatus?.isRecent) && (
            <div className="data-source-info">
              <p>Şu anda <strong>tüm şarkılar</strong> gösteriliyor</p>
              {user && hasSpotifyConnection && (
                <p>Spotify verilerinizi senkronize ederek kişiselleştirilmiş şarkı listesi alabilirsiniz</p>
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