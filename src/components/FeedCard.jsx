import React from 'react'
import { useNavigate } from 'react-router-dom'

const FeedCard = ({ type, title, profileImage, artistId, userId }) => {
  const navigate = useNavigate()

  // Profil fotoğrafına tıklama fonksiyonu
  const handleProfileImageClick = (event) => {
    event.stopPropagation() // Card tıklamasını engelle
    
    if (userId) {
      navigate(`/user/${userId}`)
    } else if (artistId) {
      navigate(`/artist/${artistId}`)
    } else {
      // Fallback - kullanıcı profiline git
      navigate('/profile')
    }
  }

  // Title'ı parse ederek artist ve song isimlerini highlight et
  const renderHighlightedTitle = (title) => {
    if (!title) return '';

    // Respect gönderilen şarkı formatı: "Kullanıcı Song Title - Artist Name şarkısına X respect gönderdi"
    if (title.includes(' şarkısına ') && title.includes(' respect gönderdi')) {
      const parts = title.split(' şarkısına ');
      if (parts.length === 2) {
        const beforeSong = parts[0];
        const afterSong = parts[1];
        
        // Song title ve artist name'i bul - daha esnek regex
        const songArtistMatch = beforeSong.match(/(.+?)\s+(.+?)\s*-\s*(.+?)\s*$/);
        if (songArtistMatch) {
          const [, userName, songTitle, artistName] = songArtistMatch;
          return (
            <>
              <span>{userName} </span>
              <span className="highlighted-song">{songTitle.trim()}</span>
              <span> - </span>
              <span className="highlighted-artist">{artistName.trim()}</span>
              <span> şarkısına {afterSong}</span>
            </>
          );
        }
      }
    }
    
    // Favorilere eklenen şarkı formatı: "Kullanıcı Song Title - Artist Name şarkısını favorilere ekledi"
    if (title.includes(' şarkısını favorilere ekledi')) {
      const parts = title.split(' şarkısını favorilere ekledi');
      if (parts.length === 2) {
        const beforeSong = parts[0];
        const songArtistMatch = beforeSong.match(/(.+?)\s+(.+?)\s*-\s*(.+?)\s*$/);
        if (songArtistMatch) {
          const [, userName, songTitle, artistName] = songArtistMatch;
          return (
            <>
              <span>{userName} </span>
              <span className="highlighted-song">{songTitle.trim()}</span>
              <span> - </span>
              <span className="highlighted-artist">{artistName.trim()}</span>
              <span> şarkısını favorilere ekledi</span>
            </>
          );
        }
      }
    }
    
    // Sanatçı takip formatı: "Kullanıcı Artist Name sanatçısını takip etmeye başladı"
    if (title.includes(' sanatçısını takip etmeye başladı')) {
      const parts = title.split(' sanatçısını takip etmeye başladı');
      if (parts.length === 2) {
        const beforeArtist = parts[0];
        // Kullanıcı adından sonraki tüm metni sanatçı adı olarak al
        const artistMatch = beforeArtist.match(/(.+?)\s+(.+?)\s*$/);
        if (artistMatch) {
          const [, userName, artistName] = artistMatch;
          return (
            <>
              <span>{userName} </span>
              <span className="highlighted-artist">{artistName.trim()}</span>
              <span> sanatçısını takip etmeye başladı</span>
            </>
          );
        }
      }
    }
    
    // Personal feed formatları için de aynı mantık
    if (title.includes(' favori şarkınıza ') && title.includes(' respect gönderdi:')) {
      const parts = title.split(' favori şarkınıza ');
      if (parts.length === 2) {
        const userName = parts[0];
        const afterRespect = parts[1];
        const songArtistMatch = afterRespect.match(/(\d+)\s+respect\s+gönderdi:\s+(.+?)\s*-\s*(.+?)(?:\s*:\s*"([^"]+)")?\s*$/);
        if (songArtistMatch) {
          const [, amount, songTitle, artistName, message] = songArtistMatch;
          return (
            <>
              <span>{userName} favori şarkınıza {amount} respect gönderdi: </span>
              <span className="highlighted-song">{songTitle.trim()}</span>
              <span> - </span>
              <span className="highlighted-artist">{artistName.trim()}</span>
              {message && <span>: "{message}"</span>}
            </>
          );
        }
      }
    }
    
    if (title.includes(' favori şarkınızı favorilere ekledi:')) {
      const parts = title.split(' favori şarkınızı favorilere ekledi: ');
      if (parts.length === 2) {
        const userName = parts[0];
        const songArtist = parts[1];
        const songArtistMatch = songArtist.match(/(.+?)\s*-\s*(.+?)\s*$/);
        if (songArtistMatch) {
          const [, songTitle, artistName] = songArtistMatch;
          return (
            <>
              <span>{userName} favori şarkınızı favorilere ekledi: </span>
              <span className="highlighted-song">{songTitle.trim()}</span>
              <span> - </span>
              <span className="highlighted-artist">{artistName.trim()}</span>
            </>
          );
        }
      }
    }
    
    if (title.includes(' takip ettiğiniz sanatçıyı takip etmeye başladı:')) {
      const parts = title.split(' takip ettiğiniz sanatçıyı takip etmeye başladı: ');
      if (parts.length === 2) {
        const userName = parts[0];
        const artistName = parts[1];
        return (
          <>
            <span>{userName} takip ettiğiniz sanatçıyı takip etmeye başladı: </span>
            <span className="highlighted-artist">{artistName.trim()}</span>
          </>
        );
      }
    }
    
    // Eğer hiçbir pattern eşleşmezse, orijinal title'ı döndür
    return title;
  }

  return (
    <div className="feed-card" data-type={type}>
      <div className="card-content">
        <div className="card-top">
          <div className="card-text">
            <h3 className="card-title">
              {renderHighlightedTitle(title)}
            </h3>
          </div>
          
          <div 
            className="profile-image-container clickable"
            onClick={handleProfileImageClick}
            title={userId ? "Kullanıcı profilini görüntüle" : artistId ? "Sanatçı profilini görüntüle" : "Profili görüntüle"}
          >
            <img 
              src={profileImage} 
              alt="Profile" 
              className="profile-image"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedCard;