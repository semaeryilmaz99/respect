import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import LoadingSpinner from './LoadingSpinner'
import MobileSlider from './common/MobileSlider'

const UserTopArtists = ({ userId }) => {
  const { state } = useAppContext()
  const { user: currentUser } = state
  
  // userId prop'u verilmişse onu kullan, yoksa mevcut kullanıcının ID'sini kullan
  const targetUserId = userId || currentUser?.id
  
  const [topArtists, setTopArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTopArtists = async () => {
      if (!targetUserId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const artists = await userService.getTopRespectedArtists(targetUserId, 6)
        setTopArtists(artists)
      } catch (error) {
        console.error('Error fetching top artists:', error)
        setError('Sanatçı bilgileri yüklenirken hata oluştu')
        setTopArtists([])
      } finally {
        setLoading(false)
      }
    }

    fetchTopArtists()
  }, [targetUserId])

  if (loading) {
    return (
      <div className="user-top-artists">
        <h3 className="section-title">En Çok Desteklediği Sanatçılar</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error && topArtists.length === 0) {
    return (
      <div className="user-top-artists">
        <h3 className="section-title">En Çok Desteklediği Sanatçılar</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  // Desktop için normal grid layout
  const desktopLayout = (
    <div className="top-artists-grid">
      {topArtists.map((artist, index) => (
        <div key={artist.id} className={`top-artist-card ${index === 0 ? 'top-respecter' : ''}`}>
          {index === 0 && (
            <div className="top-respecter-badge">TOP RESPECTER</div>
          )}
          <div className="top-artist-image">
            <img 
              src={artist.avatar_url || "/assets/artist/Image.png"} 
              alt={artist.name} 
            />
          </div>
          <h4 className="top-artist-name">{artist.name}</h4>
          <p className="top-artist-respect">{artist.total_respect?.toLocaleString()} Respect</p>
        </div>
      ))}
    </div>
  )

  // Mobile için slider layout
  const mobileLayout = (
    <MobileSlider 
      autoPlay={true} 
      interval={4000} 
      showDots={true}
      showArrows={false}
      className="mobile-top-artists-slider"
    >
      {topArtists.map((artist, index) => (
        <div key={artist.id} className={`mobile-top-artist-slide ${index === 0 ? 'top-respecter' : ''}`}>
          {index === 0 && (
            <div className="mobile-top-respecter-badge">TOP RESPECTER</div>
          )}
          <div className="mobile-top-artist-content">
            <div className="mobile-top-artist-image">
              <img 
                src={artist.avatar_url || "/assets/artist/Image.png"} 
                alt={artist.name} 
              />
            </div>
            <h4 className="mobile-top-artist-name">{artist.name}</h4>
            <p className="mobile-top-artist-respect">{artist.total_respect?.toLocaleString()} Respect</p>
          </div>
        </div>
      ))}
    </MobileSlider>
  )

  return (
    <div className="user-top-artists">
      <h3 className="section-title">En Çok Desteklediği Sanatçılar</h3>
      
      {topArtists.length === 0 ? (
        <div className="empty-state">
          <p>Henüz hiç sanatçıya respect göndermemiş</p>
        </div>
      ) : (
        <>
          {/* Desktop Layout - Sadece desktop'ta görünür */}
          <div className="desktop-only">
            {desktopLayout}
          </div>
          
          {/* Mobile Layout - Sadece mobile'da görünür */}
          <div className="mobile-only">
            {mobileLayout}
          </div>
        </>
      )}
    </div>
  )
}

export default UserTopArtists 