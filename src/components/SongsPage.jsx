import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../config/supabase'
import Header from './Header'
import FavoriteButton from './FavoriteButton'
import LoadingSpinner from './LoadingSpinner'
import BackButton from './common/BackButton'

const SongsPage = () => {
  const navigate = useNavigate()
  const { state } = useAppContext()
  const { user: _user } = state
  
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('songs')
          .select(`
            *,
            artists(name, avatar_url)
          `)
          .order('total_respect', { ascending: false })

        if (error) {
          throw error
        }

        setSongs(data || [])
      } catch (error) {
        console.error('Error fetching songs:', error)
        setError('Şarkılar yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [])

  const handleSongClick = (songId) => {
    navigate(`/song/${songId}`)
  }

  const handleArtistClick = (artistId) => {
    navigate(`/artist/${artistId}`)
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
    </div>
  )
}

export default SongsPage 