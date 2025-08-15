import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import songService from '../api/songService'
import LoadingSpinner from './LoadingSpinner'

const MoreByArtist = () => {
  const navigate = useNavigate()
  const { id: songId } = useParams()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sanatçının diğer şarkılarını getir
  useEffect(() => {
    const fetchArtistSongs = async () => {
      if (!songId) {
        console.log('❌ No song ID provided')
        setLoading(false)
        return
      }

      console.log('🔄 Fetching artist songs for song ID:', songId)

      try {
        setLoading(true)
        
        // Önce mevcut şarkının bilgilerini al
        const { data: currentSong, error: songError } = await songService.getSongById(songId)
        
        if (songError) {
          console.error('❌ Error fetching current song:', songError)
          throw songError
        }

        if (!currentSong || !currentSong.artist_id) {
          console.log('❌ No artist ID found for current song')
          setLoading(false)
          return
        }

        // Sanatçının diğer şarkılarını getir
        const { data: artistSongs, error: artistError } = await songService.getSongsByArtist(
          currentSong.artist_id, 
          songId, 
          10
        )

        if (artistError) {
          console.error('❌ Error fetching artist songs:', artistError)
          throw artistError
        }

        console.log('✅ Artist songs fetched:', artistSongs)
        setSongs(artistSongs || [])
      } catch (error) {
        console.error('❌ Error fetching artist songs:', error)
        setError('Sanatçının diğer şarkıları yüklenirken hata oluştu')
        
        // Fallback to mock data
        setSongs([
          {
            id: 1,
            title: "Şarkı Söyleyemem",
            cover_url: "/assets/song/Image (1).png",
            artist: { name: "Sezen Aksu" }
          },
          {
            id: 2,
            title: "Kaybolan Yıllar",
            cover_url: "/assets/song/Image (2).png",
            artist: { name: "Sezen Aksu" }
          },
          {
            id: 3,
            title: "Hadi Bakalım",
            cover_url: "/assets/song/Image (3).png",
            artist: { name: "Sezen Aksu" }
          },
          {
            id: 4,
            title: "Vazgeçtim",
            cover_url: "/assets/song/Image (4).png",
            artist: { name: "Sezen Aksu" }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchArtistSongs()
  }, [songId])

  const handleSongClick = (song) => {
    // Şarkıya tıklandığında o şarkının song sayfasına yönlendir
    navigate(`/song/${song.id}`, {
      state: {
        songId: song.id,
        songTitle: song.title,
        artistName: song.artist?.name || song.artist_name,
        songCover: song.cover_url,
        currentRespect: song.total_respect?.toString() || '0'
      }
    })
  }

  if (loading) {
    return (
      <div className="more-by-artist">
        <h3 className="section-title">Sanatçının Diğer Şarkıları</h3>
        <div className="artist-songs-container">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="more-by-artist">
        <h3 className="section-title">Sanatçının Diğer Şarkıları</h3>
        <div className="artist-songs-container">
          <p className="error-message">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="more-by-artist">
      <h3 className="section-title">Sanatçının Diğer Şarkıları</h3>
      
      <div className="artist-songs-container">
        {songs.length > 0 ? (
          songs.map((song) => (
            <div 
              key={song.id} 
              className="artist-song-item"
              onClick={() => handleSongClick(song)}
              style={{ cursor: 'pointer' }}
            >
              <div className="artist-song-cover">
                <img src={song.cover_url || '/assets/song/Image.png'} alt={`${song.title} kapağı`} />
              </div>
              
              <div className="artist-song-info">
                <h4 className="artist-song-title">{song.title}</h4>
                <p className="artist-song-artist">{song.artist?.name || song.artist_name}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-songs-message">Bu sanatçının başka şarkısı bulunamadı.</p>
        )}
      </div>
    </div>
  )
}

export default MoreByArtist 