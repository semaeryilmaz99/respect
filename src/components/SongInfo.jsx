import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../config/supabase'
import FavoriteButton from './FavoriteButton'
import LoadingSpinner from './LoadingSpinner'

const SongInfo = () => {
  const navigate = useNavigate()
  const { id: songId } = useParams()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Şarkı verilerini Supabase'den fetch et
  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) {
        console.log('❌ No song ID provided')
        setLoading(false)
        return
      }

      console.log('🔄 Fetching song data for ID:', songId)

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('songs')
          .select(`
            *,
            artists (
              id,
              name,
              avatar_url
            )
          `)
          .eq('id', songId)
          .single()

        if (error) {
          console.error('❌ Error fetching song:', error)
          throw error
        }

        console.log('✅ Song data fetched:', data)
        setSong(data)
      } catch (error) {
        console.error('❌ Error fetching song:', error)
        setError('Şarkı bilgileri yüklenirken hata oluştu')
        
        // Fallback to mock data
        setSong({
          id: songId,
          title: 'Bilinmeyen Şarkı',
          artist_name: 'Bilinmeyen Sanatçı',
          cover_url: '/assets/song/Image.png',
          total_respect: 0,
          artist: {
            id: 'unknown',
            name: 'Bilinmeyen Sanatçı',
            avatar_url: '/assets/artist/Image.png'
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSong()
  }, [songId])

  const handleSendRespect = () => {
    if (!song) return
    
    // Navigate to send respect page with song information as state
    navigate('/send-respect', {
      state: {
        songId: song.id,
        songTitle: song.title,
        artistName: song.artist?.name || song.artist_name,
        songCover: song.cover_url,
        currentRespect: song.total_respect?.toString() || '0',
        artistId: song.artist?.id,
        isArtist: false // Şarkıya respect gönderildiğini belirtmek için
      }
    })
  }

  if (loading) {
    return (
      <div className="song-info">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !song) {
    return (
      <div className="song-info">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="song-info">
      <div className="song-album-cover">
        <img src={song?.cover_url || '/assets/song/Image.png'} alt="Şarkı Kapağı" />
      </div>
      
      <div className="song-details">
        <div className="song-title-section">
          <h2 className="song-title">{song?.title || 'Bilinmeyen Şarkı'}</h2>
          <h3 className="song-subtitle">{song?.artist?.name || song?.artist_name || 'Bilinmeyen Sanatçı'}</h3>
          <p className="song-respect">{song?.total_respect?.toLocaleString() || '0'} Respect</p>
        </div>
        
        <div className="song-buttons">
          <button className="play-spotify-button">
            Spotify'da Dinle
          </button>
          <button className="send-respect-button" onClick={handleSendRespect}>
            Respect Gönder
          </button>
          
          <FavoriteButton 
            songId={song?.id || songId} 
            initialFavoritesCount={song?.favorites_count || 0}
            size="medium"
          />
        </div>
      </div>
    </div>
  )
}

export default SongInfo 