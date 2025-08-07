import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../config/supabase'
import FavoriteButton from './FavoriteButton'

const SongsList = ({ artistId: propArtistId }) => {
  const navigate = useNavigate()
  const { artistId: paramArtistId } = useParams()
  const artistId = propArtistId || paramArtistId
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchArtistSongs = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('artist_id', artistId)
          .order('total_respect', { ascending: false })

        if (error) {
          throw error
        }

        setSongs(data || [])
      } catch (error) {
        console.error('Error fetching artist songs:', error)
        setError('Şarkılar yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (artistId) {
      fetchArtistSongs()
    }
  }, [artistId])

  const handleSongClick = (song) => {
    navigate(`/song/${song.id}`)
  }

  if (loading) {
    return (
      <div className="songs-list">
        <h3 className="section-title">Şarkılar</h3>
        <div className="loading-message">Şarkılar yükleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="songs-list">
        <h3 className="section-title">Şarkılar</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="songs-list">
      <h3 className="section-title">Şarkılar</h3>
      
      <div className="songs-container">
        {songs.map((song) => (
          <div 
            key={song.id} 
            className="song-item"
            onClick={() => handleSongClick(song)}
            style={{ cursor: 'pointer' }}
          >
            <div className="song-cover">
                              <img src={song.cover_url || '/assets/song/Image.png'} alt={`${song.title} kapağı`} />
            </div>
            
            <div className="song-info">
              <h4 className="song-title">{song.title}</h4>
              <p className="song-album">{song.album}</p>
              <p className="song-duration">{song.duration}</p>
              <div className="song-stats">
                <span className="song-respect">{song.total_respect || 0} Respect</span>
                <span className="song-favorites">{song.favorites_count || 0} Favori</span>
              </div>
            </div>
            
            <div className="song-actions">
              <FavoriteButton songId={song.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SongsList 