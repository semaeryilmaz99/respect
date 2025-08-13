import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../config/supabase'
import { syncUserSpotifyData, checkSpotifyConnection, getSyncStatus } from '../api/spotifyUserDataService'
import Header from './Header'
import FollowButton from './FollowButton'
import LoadingSpinner from './LoadingSpinner'
import BackButton from './common/BackButton'
import Toast from './Toast'

const ArtistsPage = () => {
  const navigate = useNavigate()
  const { state } = useAppContext()
  const { user } = state
  
  const [artists, setArtists] = useState([])
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
        
        // Fetch artists (will show mock data if no Spotify sync)
        await fetchArtists()
      } catch (error) {
        console.error('Error initializing page:', error)
        setError('Sayfa yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [user])

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('total_respect', { ascending: false })

      if (error) {
        throw error
      }

      setArtists(data || [])
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
        setToast({
          show: true,
          message: result.message,
          type: 'success'
        })
        // Refresh artists after sync
        await fetchArtists()
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
      <div className="page-header mobile-only">
        <BackButton />
      </div>
      <Header />
      
      <div className="artists-container">
        <div className="artists-header">
          <h1 className="artists-title">Sanatçılar</h1>
          <p className="artists-subtitle">Favori sanatçılarınızı keşfedin ve takip edin</p>
          
          {/* Spotify Sync Section */}
          {user && hasSpotifyConnection && (
            <div className="spotify-sync-section">
              {!syncStatus?.hasSyncHistory || !syncStatus?.isRecent ? (
                <div className="sync-prompt">
                  <p>🎵 Spotify çalma listelerinizden sanatçıları senkronize edin</p>
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
                </div>
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
                  <FollowButton artistId={artist.id} />
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