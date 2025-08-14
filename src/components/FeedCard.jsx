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



  return (
    <div className="feed-card" data-type={type}>
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