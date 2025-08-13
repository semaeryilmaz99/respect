import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../config/supabase'
import { syncUserSpotifyData, checkSpotifyConnection, getSyncStatus } from '../api/spotifyUserDataService'
import Header from './Header'
import FollowButton from './FollowButton'
import LoadingSpinner from './LoadingSpinner'

import Toast from './Toast'

const ArtistsPage = () => {
  const navigate = useNavigate()
  const { state, dispatch } = useAppContext()
  const { user } = state
  
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const [sessionSyncKey, setSessionSyncKey] = useState(null) // Oturum bazlı sync kontrolü
  
  // Global state'den Spotify sync durumunu al
  const { spotifySync } = state
  const hasSpotifyConnection = spotifySync.hasConnection
  const syncStatus = spotifySync.syncStatus
  const [followedArtists, setFollowedArtists] = useState(new Set()) // Takip edilen sanatçılar set'i



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
        
        // Fetch artists (will show mock data if no Spotify sync)
        await fetchArtists()
        
        // Sayfa yüklendiğinde mevcut takip durumlarını kontrol et
        // Bu kısım fetchArtists içinde zaten yapılıyor, burada tekrar yapmaya gerek yok
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
      fetchArtists()
    }
  }, [memoizedSyncStatus]) // memoizedSyncStatus'u kullan

  // Toplu takip durumu kontrolü - tüm sanatçılar için tek seferde
  const fetchFollowedArtists = async (artistIds = null) => {
    if (!user) return
    
    try {
      // Eğer artistIds parametresi verilmişse onu kullan, yoksa artists state'inden al
      const idsToCheck = artistIds || artists.map(artist => artist.id)
      
      if (!idsToCheck.length) return
      
      // Tek seferde tüm takip durumlarını kontrol et
      const { data, error } = await supabase
        .from('artist_follows')
        .select('artist_id')
        .eq('user_id', user.id)
        .in('artist_id', idsToCheck)

      if (error) {
        console.error('❌ Toplu takip durumu kontrol hatası:', error)
        return
      }

      // Takip edilen sanatçı ID'lerini Set'e ekle
      const followedIds = new Set(data?.map(item => item.artist_id) || [])
      setFollowedArtists(followedIds)
    } catch (error) {
      console.error('❌ Toplu takip durumu kontrol hatası:', error)
    }
  }

  const fetchArtists = async () => {
    try {
      let query = supabase
        .from('artists')
        .select('*')
        .order('total_respect', { ascending: false })

      // Eğer kullanıcının Spotify bağlantısı varsa ve sync yapılmışsa, 
      // sadece Spotify ID'li sanatçıları getir (kullanıcının playlist verileri)
      if (user && hasSpotifyConnection && memoizedSyncStatus?.hasSyncHistory && memoizedSyncStatus?.isRecent) {
        query = query.not('spotify_id', 'is', null)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setArtists(data || [])
      
      // Sanatçılar yüklendikten sonra takip durumlarını kontrol et
      if (user && data?.length > 0) {
        await fetchFollowedArtists(data.map(artist => artist.id))
      }
    } catch (error) {
      console.error('Error fetching artists:', error)
      setError('Sanatçılar yüklenirken hata oluştu')
    }
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
        // Refresh artists after sync
        await fetchArtists()
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
      <div className="artists-page">
        <Header />
        <div className="error-message">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="artists-page">
      <Header />
      
      <div className="artists-container">
        <div className="artists-header">
          <h1 className="artists-title">Sanatçılar</h1>
          <p className="artists-subtitle">Favori sanatçılarınızı keşfedin ve takip edin</p>
          
          {/* Spotify Sync Section */}
          {user && hasSpotifyConnection && (
            <div className="spotify-sync-section">
              {canSyncInThisSession ? (
                <div className="sync-prompt">
                  <p>Spotify çalma listelerinizden sanatçıları senkronize edin</p>
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
                    Şu anda <strong>Spotify playlist'inizdeki sanatçılar</strong> gösteriliyor
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Data Source Info */}
          {(!user || !hasSpotifyConnection || !memoizedSyncStatus?.hasSyncHistory || !memoizedSyncStatus?.isRecent) && (
            <div className="data-source-info">
              <p>Şu anda <strong>tüm sanatçılar</strong> gösteriliyor</p>
              {user && hasSpotifyConnection && (
                <p>Spotify verilerinizi senkronize ederek kişiselleştirilmiş sanatçı listesi alabilirsiniz</p>
              )}
            </div>
          )}
        </div>

        <div className="artists-grid">
          {artists && Array.isArray(artists) ? artists.map((artist) => (
            <div key={artist.id} className="artist-card">
              <div className="artist-image-container" onClick={() => handleArtistClick(artist.id)}>
                <img 
                  src={artist.avatar_url || '/assets/artist/Image.png'} 
                  alt={artist.name}
                  className="artist-image"
                />
              </div>
              
              <div className="artist-info">
                <h3 className="artist-name" onClick={() => handleArtistClick(artist.id)}>
                  {artist.name}
                </h3>
                <p className="artist-genre">{artist.genre}</p>
                <p className="artist-bio">{artist.bio}</p>
                
                <div className="artist-stats">
                  <span className="artist-respect">
                    {artist.total_respect?.toLocaleString() || 0} Respect
                  </span>
                  <span className="artist-followers">
                    {artist.followers_count?.toLocaleString() || 0} Takipçi
                  </span>
                </div>
                
                <div className="artist-actions">
                  <FollowButton 
                    artistId={artist.id} 
                    artistName={artist.name}
                    initialFollowersCount={artist.followers_count || 0}
                    isFollowing={followedArtists.has(artist.id)}
                    onFollowChange={(artistId, isFollowing) => {
                      setFollowedArtists(prev => {
                        const newSet = new Set(prev)
                        if (isFollowing) {
                          newSet.add(artistId)
                        } else {
                          newSet.delete(artistId)
                        }
                        return newSet
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          )) : (
            <div className="no-artists">
              <p>Henüz sanatçı bulunamadı</p>
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

export default ArtistsPage 