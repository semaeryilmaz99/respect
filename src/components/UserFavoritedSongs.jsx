import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import LoadingSpinner from './LoadingSpinner'

const UserFavoritedSongs = ({ userId }) => {
  const { state } = useAppContext()
  const { user: currentUser } = state
  
  // userId prop'u verilmişse onu kullan, yoksa mevcut kullanıcının ID'sini kullan
  const targetUserId = userId || currentUser?.id
  
  const [favoritedSongs, setFavoritedSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFavoritedSongs = async () => {
      if (!targetUserId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const songs = await userService.getFavoritedSongs(targetUserId)
        setFavoritedSongs(songs)
      } catch (error) {
        console.error('Error fetching favorited songs:', error)
        setError('Favori şarkılar yüklenirken hata oluştu')
        
        // Fallback to mock data
        setFavoritedSongs([
              { id: 1, title: "Do I Wanna Know?", artist_name: "Arctic Monkeys", cover_url: "/assets/song/Image.png" },
    { id: 2, title: "The Less I Know The Better", artist_name: "Tame Impala", cover_url: "/assets/song/Image (1).png" },
    { id: 3, title: "Last Nite", artist_name: "The Strokes", cover_url: "/assets/song/Image (2).png" },
    { id: 4, title: "Chamber of Reflection", artist_name: "Mac DeMarco", cover_url: "/assets/song/Image (3).png" },
    { id: 5, title: "Easy Easy", artist_name: "King Krule", cover_url: "/assets/song/Image (4).png" }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchFavoritedSongs()
  }, [targetUserId])

  if (loading) {
    return (
      <div className="user-favorited-songs">
        <h3 className="section-title">Favori Şarkıları</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error && favoritedSongs.length === 0) {
    return (
      <div className="user-favorited-songs">
        <h3 className="section-title">Favori Şarkıları</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="user-favorited-songs">
      <h3 className="section-title">Favori Şarkıları</h3>
      
      {favoritedSongs.length === 0 ? (
        <div className="empty-state">
          <p>Henüz hiç şarkı favoriye eklememiş</p>
        </div>
      ) : (
        <div className="favorited-songs-grid">
          {favoritedSongs.map((song, index) => (
            <div key={song.id} className="favorited-song-card">
              <div className="favorited-song-cover">
                <img 
                  src={song.cover_url || `/assets/song/Image (${(index % 5) + 1}).png`} 
                  alt={`${song.title} kapağı`} 
                />
              </div>
              <h4 className="favorited-song-title">{song.title}</h4>
              <p className="favorited-song-artist">{song.artist_name}</p>
              <div className="favorited-song-status">
                <span className="favorited-badge">❤️ Favori</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserFavoritedSongs 