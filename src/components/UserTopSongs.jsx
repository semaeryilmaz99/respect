import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import LoadingSpinner from './LoadingSpinner'

const UserTopSongs = ({ userId }) => {
  const { state } = useAppContext()
  const { user: currentUser } = state
  
  // userId prop'u verilmişse onu kullan, yoksa mevcut kullanıcının ID'sini kullan
  const targetUserId = userId || currentUser?.id
  
  const [topSongs, setTopSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTopSongs = async () => {
      if (!targetUserId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const songs = await userService.getTopRespectedSongs(targetUserId, 5)
        setTopSongs(songs)
      } catch (error) {
        console.error('Error fetching top songs:', error)
        setError('Şarkı bilgileri yüklenirken hata oluştu')
        setTopSongs([])
      } finally {
        setLoading(false)
      }
    }

    fetchTopSongs()
  }, [targetUserId])

  if (loading) {
    return (
      <div className="user-top-songs">
        <h3 className="section-title">En Çok Desteklediği Şarkılar</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error && topSongs.length === 0) {
    return (
      <div className="user-top-songs">
        <h3 className="section-title">En Çok Desteklediği Şarkılar</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="user-top-songs">
      <h3 className="section-title">En Çok Desteklediği Şarkılar</h3>
      
      {topSongs.length === 0 ? (
        <div className="empty-state">
          <p>Henüz hiç şarkıya respect göndermemiş</p>
        </div>
      ) : (
        <div className="top-songs-grid">
          {topSongs.map((song, index) => (
            <div key={song.id} className="top-song-card">
              <div className="top-song-cover">
                <img 
                  src={song.cover_url || "/assets/song/Image.png"} 
                  alt={`${song.title} kapağı`} 
                />
              </div>
              <h4 className="top-song-title">{song.title}</h4>
              <p className="top-song-artist">{song.artist_name}</p>
              <p className="top-song-respect">{song.total_respect?.toLocaleString()} Respect</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserTopSongs 