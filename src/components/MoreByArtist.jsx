import React from 'react'
import { useNavigate } from 'react-router-dom'

const MoreByArtist = () => {
  const navigate = useNavigate()
  
  const songs = [
    {
      id: 1,
      title: "Şarkı Söyleyemem",
      artist: "Sezen Aksu",
      cover: "/assets/song/Image (1).png"
    },
    {
      id: 2,
      title: "Kaybolan Yıllar",
      artist: "Sezen Aksu",
      cover: "/assets/song/Image (2).png"
    },
    {
      id: 3,
      title: "Hadi Bakalım",
      artist: "Sezen Aksu",
      cover: "/assets/song/Image (3).png"
    },
    {
      id: 4,
      title: "Vazgeçtim",
      artist: "Sezen Aksu",
      cover: "/assets/song/Image (4).png"
    }
  ]

  const handleSongClick = (song) => {
    // Şarkıya tıklandığında o şarkının song sayfasına yönlendir
    navigate(`/song/${song.id}`, {
      state: {
        songId: song.id,
        songTitle: song.title,
        artistName: song.artist,
        songCover: song.cover,
        currentRespect: '1,247' // Örnek respect sayısı
      }
    })
  }

  return (
    <div className="more-by-artist">
      <h3 className="section-title">Sanatçının Diğer Şarkıları</h3>
      
      <div className="artist-songs-container">
        {songs.map((song) => (
          <div 
            key={song.id} 
            className="artist-song-item"
            onClick={() => handleSongClick(song)}
            style={{ cursor: 'pointer' }}
          >
            <div className="artist-song-cover">
              <img src={song.cover} alt={`${song.title} kapağı`} />
            </div>
            
            <div className="artist-song-info">
              <h4 className="artist-song-title">{song.title}</h4>
              <p className="artist-song-artist">{song.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MoreByArtist 