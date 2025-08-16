import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import LoadingSpinner from './LoadingSpinner'

const UserArtistSongs = ({ userId }) => {
  const { state } = useAppContext()
  const { user: currentUser } = state
  
  // userId prop'u verilmişse onu kullan, yoksa mevcut kullanıcının ID'sini kullan
  const targetUserId = userId || currentUser?.id
  
  const [artistSongs, setArtistSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isArtist, setIsArtist] = useState(false)

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!targetUserId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Önce kullanıcının sanatçı olup olmadığını kontrol et
        const artistStatus = await userService.isUserArtist(targetUserId)
        setIsArtist(artistStatus)
        
        if (artistStatus) {
          // Sanatçı ise kendi şarkılarını getir
          const songs = await userService.getUserArtistSongs(targetUserId, 10)
          setArtistSongs(songs)
        } else {
          // Sanatçı değilse playlist şarkılarını getir
          const songs = await userService.getUserPlaylistSongs(targetUserId, 10)
          setArtistSongs(songs)
        }
      } catch (error) {
        console.error('Error fetching artist songs:', error)
        setError('Şarkı bilgileri yüklenirken hata oluştu')
        setArtistSongs([])
      } finally {
        setLoading(false)
      }
    }

    fetchArtistData()
  }, [targetUserId])

  if (loading) {
    return (
      <div className="user-artist-songs">
        <h3 className="section-title">
          {isArtist ? 'Kendi Şarkılarım' : 'Playlist Şarkılarım'}
        </h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error && artistSongs.length === 0) {
    return (
      <div className="user-artist-songs">
        <h3 className="section-title">
          {isArtist ? 'Kendi Şarkılarım' : 'Playlist Şarkılarım'}
        </h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="user-artist-songs">
      <h3 className="section-title">
        {isArtist ? 'Kendi Şarkılarım' : 'Playlist Şarkılarım'}
      </h3>
      
      {artistSongs.length === 0 ? (
        <div className="empty-state">
          <p>
            {isArtist 
              ? 'Henüz hiç şarkı yayınlamamışsın' 
              : 'Henüz hiç playlist şarkısı eklenmemiş'
            }
          </p>
        </div>
      ) : (
        <div className="artist-songs-grid">
          {artistSongs.map((song, index) => (
            <div key={song.song_id} className="artist-song-card">
              <div className="artist-song-cover">
                <img 
                  src={song.cover_url || "/assets/song/Image.png"} 
                  alt={`${song.title} kapağı`} 
                />
                {isArtist && (
                  <div className="artist-badge">
                    <span>🎵</span>
                  </div>
                )}
              </div>
              <div className="artist-song-info">
                <h4 className="artist-song-title">{song.title}</h4>
                <p className="artist-song-artist">
                  {isArtist ? 'Kendi şarkım' : song.artist_name}
                </p>
                {song.total_respect > 0 && (
                  <p className="artist-song-respect">
                    {song.total_respect?.toLocaleString()} Respect
                  </p>
                )}
                {song.release_date && (
                  <p className="artist-song-release">
                    {new Date(song.release_date).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserArtistSongs
