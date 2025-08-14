import React from 'react'
import { useNavigate } from 'react-router-dom'

const FeedCard = ({ type, title, buttonText, profileImage, artistId, songId, userId }) => {
  const navigate = useNavigate()
  const getCardLabel = (type) => {
    switch (type) {
      case 'respect-activity':
        return 'Respect Activity'
      case 'chat-reply':
        return 'Chat Reply'
      case 'new-release':
        return 'New Release'
      case 'followed-respect':
        return 'Followed Respect'
      case 'followed-new-song':
        return 'Followed New Song'
      case 'followed-chat':
        return 'Followed Chat'
      case 'trending-song':
        return 'Trending Song'
      case 'trending-artist':
        return 'Trending Artist'
      case 'respect-notification':
        return 'Respect Notification'
      default:
        return 'Activity Card'
    }
  }

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



  return (
    <div className="feed-card" data-type={type}>
      <div className="card-label">
        {getCardLabel(type)}
      </div>
      
      <div className="card-content">
        <div className="card-top">
          <div className="card-text">
            <h3 className="card-title">{title}</h3>
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