import React, { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Link } from 'react-router-dom'

const UserTopArtists = ({ userId }) => {
  const [topArtists, setTopArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchTopArtists()
    }
  }, [userId])

  const fetchTopArtists = async () => {
    try {
      setLoading(true)
      
      // Respect transactions'dan en çok respect alan sanatçıları getir
      const { data: respectData, error: respectError } = await supabase
        .from('respect_transactions')
        .select(`
          to_artist_id,
          amount
        `)
        .not('to_artist_id', 'is', null)
        .eq('from_user_id', userId)

      if (respectError) throw respectError

      // Artist ID'leri grupla ve toplam respect'leri hesapla
      const artistRespects = {}
      respectData?.forEach(transaction => {
        const artistId = transaction.to_artist_id
        artistRespects[artistId] = (artistRespects[artistId] || 0) + transaction.amount
      })

      // En çok respect alan sanatçıları sırala
      const sortedArtistIds = Object.entries(artistRespects)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([artistId]) => artistId)

      if (sortedArtistIds.length === 0) {
        setTopArtists([])
        setLoading(false)
        return
      }

      // Sanatçı detaylarını getir
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          COALESCE(image_url, '') as image_url,
          COALESCE(total_respect, 0) as total_respect
        `)
        .in('id', sortedArtistIds)

      if (artistsError) throw artistsError

      // Respect miktarlarını ekle ve sırala
      const artistsWithRespects = artistsData.map(artist => ({
        ...artist,
        totalRespectReceived: artistRespects[artist.id] || 0
      })).sort((a, b) => b.totalRespectReceived - a.totalRespectReceived)

      setTopArtists(artistsWithRespects)
    } catch (error) {
      console.error('Error fetching top artists:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="user-section">
        <h3>En Çok Respect Gönderilen Sanatçılar</h3>
        <div className="loading-placeholder">Yükleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="user-section">
        <h3>En Çok Respect Gönderilen Sanatçılar</h3>
        <div className="error-message">Hata: {error}</div>
      </div>
    )
  }

  if (topArtists.length === 0) {
    return (
      <div className="user-section">
        <h3>En Çok Respect Gönderilen Sanatçılar</h3>
        <div className="no-data-message">Henüz hiçbir sanatçıya respect gönderilmemiş.</div>
      </div>
    )
  }

  return (
    <div className="user-section">
      <h3>En Çok Respect Gönderilen Sanatçılar</h3>
      
      {/* Desktop View - Normal Grid */}
      <div className="desktop-view">
        <div className="artists-grid">
          {topArtists.map((artist) => (
            <Link 
              key={artist.id} 
              to={`/artist/${artist.id}`}
              className="artist-card"
            >
              <div className="artist-image">
                <img 
                  src={artist.image_url || '/src/assets/artist/Image.png'} 
                  alt={artist.name}
                  onError={(e) => {
                    e.target.src = '/src/assets/artist/Image.png'
                  }}
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div className="artist-info">
                <h4>{artist.name}</h4>
                <p className="respect-amount">{artist.totalRespectReceived} Respect</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile View - Slider */}
      <div className="mobile-view user-top-respects-slider">
        <div className="slider-container">
          {/* Slider items'ları iki kez ekle (sonsuz döngü için) */}
          {[...topArtists, ...topArtists].map((artist, index) => (
            <div key={`${artist.id}-${index}`} className="slider-item">
              <div className="artist-info">
                <h4>{artist.name}</h4>
                <p>Toplam Respect: {artist.totalRespectReceived}</p>
                <div className="respect-amount">{artist.totalRespectReceived} Respect</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Slider Navigation Dots */}
        <div className="slider-dots">
          {topArtists.map((_, index) => (
            <div 
              key={index} 
              className={`slider-dot ${index === 0 ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserTopArtists 