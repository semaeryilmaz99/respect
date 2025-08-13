import React, { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Link } from 'react-router-dom'

const UserTopSongs = ({ userId }) => {
  const [topSongs, setTopSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchTopSongs()
    }
  }, [userId])

  const fetchTopSongs = async () => {
    try {
      setLoading(true)
      
      // Respect transactions'dan en çok respect alan şarkıları getir
      const { data: respectData, error: respectError } = await supabase
        .from('respect_transactions')
        .select(`
          song_id,
          amount
        `)
        .not('song_id', 'is', null)
        .eq('from_user_id', userId)

      if (respectError) throw respectError

      // Song ID'leri grupla ve toplam respect'leri hesapla
      const songRespects = {}
      respectData?.forEach(transaction => {
        const songId = transaction.song_id
        songRespects[songId] = (songRespects[songId] || 0) + transaction.amount
      })

      // En çok respect alan şarkıları sırala
      const sortedSongIds = Object.entries(songRespects)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([songId]) => songId)

      if (sortedSongIds.length === 0) {
        setTopSongs([])
        setLoading(false)
        return
      }

      // Şarkı detaylarını getir
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select(`
          id,
          title,
          artist_id,
          image_url,
          total_respect
        `)
        .in('id', sortedSongIds)

      if (songsError) throw songsError

      // Artist bilgilerini getir
      const artistIds = [...new Set(songsData.map(song => song.artist_id))]
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select(`
          id,
          name
        `)
        .in('id', artistIds)

      if (artistsError) throw artistsError

      // Artist isimlerini ekle ve respect miktarlarını ekle
      const artistsMap = {}
      artistsData.forEach(artist => {
        artistsMap[artist.id] = artist.name
      })

      const songsWithRespects = songsData.map(song => ({
        ...song,
        artistName: artistsMap[song.artist_id] || 'Bilinmeyen Sanatçı',
        totalRespectReceived: songRespects[song.id] || 0
      })).sort((a, b) => b.totalRespectReceived - a.totalRespectReceived)

      setTopSongs(songsWithRespects)
    } catch (error) {
      console.error('Error fetching top songs:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="user-section">
        <h3>En Çok Respect Gönderilen Şarkılar</h3>
        <div className="loading-placeholder">Yükleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="user-section">
        <h3>En Çok Respect Gönderilen Şarkılar</h3>
        <div className="error-message">Hata: {error}</div>
      </div>
    )
  }

  if (topSongs.length === 0) {
    return (
      <div className="user-section">
        <h3>En Çok Respect Gönderilen Şarkılar</h3>
        <div className="no-data-message">Henüz hiçbir şarkıya respect gönderilmemiş.</div>
      </div>
    )
  }

  return (
    <div className="user-section">
      <h3>En Çok Respect Gönderilen Şarkılar</h3>
      
      {/* Desktop View - Normal Grid */}
      <div className="desktop-view">
        <div className="songs-grid">
          {topSongs.map((song) => (
            <Link 
              key={song.id} 
              to={`/song/${song.id}`}
              className="song-card"
            >
              <div className="song-image">
                <img 
                  src={song.image_url || '/src/assets/song/Image.png'} 
                  alt={song.title}
                  onError={(e) => {
                    e.target.src = '/src/assets/song/Image.png'
                  }}
                />
              </div>
              <div className="song-info">
                <h4>{song.title}</h4>
                <p className="artist-name">{song.artistName}</p>
                <p className="respect-amount">{song.totalRespectReceived} Respect</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile View - Slider */}
      <div className="mobile-view user-top-songs-slider">
        <div className="slider-container">
          {/* Slider items'ları iki kez ekle (sonsuz döngü için) */}
          {[...topSongs, ...topSongs].map((song, index) => (
            <div key={`${song.id}-${index}`} className="slider-item">
              <div className="song-info">
                <h4>{song.title}</h4>
                <p>Sanatçı: {song.artistName}</p>
                <p>Toplam Respect: {song.totalRespectReceived}</p>
                <div className="song-respects">{song.totalRespectReceived} Respect</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Slider Navigation Dots */}
        <div className="slider-dots">
          {topSongs.map((_, index) => (
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

export default UserTopSongs 