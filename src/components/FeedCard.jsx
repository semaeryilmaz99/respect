import React from 'react'
import { useNavigate } from 'react-router-dom'

const FeedCard = ({ type, title, profileImage, artistId, userId, songId, songTitle, artistName }) => {
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

  // Respect butonuna tıklama fonksiyonu
  const handleRespectClick = (event) => {
    event.stopPropagation() // Card tıklamasını engelle
    
    // Feed item tipine göre yönlendirme
    if (type === 'respect_sent' && songId) {
      // Şarkıya respect gönderilmişse şarkı sayfasına git
      navigate(`/song/${songId}`)
    } else if (type === 'artist_followed' && artistId) {
      // Sanatçı takip edilmişse sanatçı sayfasına git
      navigate(`/artist/${artistId}`)
    } else if (type === 'song_favorited' && songId) {
      // Şarkı favorilere eklenmişse şarkı sayfasına git
      navigate(`/song/${songId}`)
    } else if (artistId) {
      // Fallback - sanatçı sayfasına git
      navigate(`/artist/${artistId}`)
    }
  }

  // Respect butonunun görünür olup olmadığını belirle
  const shouldShowRespectButton = () => {
    return (type === 'respect_sent' && songId) || 
        (type === 'artist_followed' && artistId) || 
        (type === 'song_favorited' && songId)
  }



  // Sanatçı ismini vurgulayarak title'ı formatla
  const formatTitleWithArtistHighlight = () => {
    if (!artistName) return title;
    
    // Sanatçı ismini bul ve vurgula
    const artistNameRegex = new RegExp(`(${artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = title.split(artistNameRegex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === artistName.toLowerCase()) {
        return <span key={index} className="artist-name-highlight">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="feed-card" data-type={type}>
      <div className="card-content">
        <div className="card-top">
          <div className="card-text">
            <h3 className="card-title">{formatTitleWithArtistHighlight()}</h3>
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
        
        {/* Respect Button - Sadece uygun feed item'lar için göster */}
        {shouldShowRespectButton() && (
          <div className="card-bottom">
            <button 
              className="feed-respect-button"
              onClick={handleRespectClick}
              title={type === 'respect_sent' && songId ? `${songTitle} şarkısını görüntüle` : 
                type === 'artist_followed' && artistId ? `${artistName} sanatçısını görüntüle` :
                type === 'song_favorited' && songId ? `${songTitle} şarkısını görüntüle` : 
                "Detayları görüntüle"}
            >
              Görüntüle
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default FeedCard;