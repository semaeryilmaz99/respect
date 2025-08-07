import React from 'react'
import { useNavigate } from 'react-router-dom'
import FollowButton from './FollowButton'
import FavoriteButton from './FavoriteButton'

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

  const handleButtonClick = () => {
    switch (type) {
      case 'trending-song':
      case 'new-release':
      case 'followed-respect':
      case 'followed-new-song':
        // If button text suggests respect sending, go to send respect page
        if (buttonText?.toLowerCase().includes('respect') || buttonText?.toLowerCase().includes('gönder')) {
          navigate('/send-respect', {
            state: {
              songId: songId || '1',
              songTitle: title.split(':')[1]?.split('-')[0]?.trim() || 'Bilinmeyen Şarkı',
              artistName: title.split('-')[1]?.trim() || 'Bilinmeyen Sanatçı',
              songCover: profileImage,
              currentRespect: '0'
            }
          })
        } else if (buttonText?.toLowerCase().includes('görüntüle') || buttonText?.toLowerCase().includes('view')) {
          // Görüntüle butonu için işlem yapılan şeye göre yönlendir
          if (songId) {
            // Şarkı ile ilgili işlem ise şarkı sayfasına git
            navigate(`/song/${songId}`)
          } else if (artistId) {
            // Sanatçı ile ilgili işlem ise sanatçı sayfasına git
            navigate(`/artist/${artistId}`)
          } else {
            // Fallback - title'dan şarkı/sanatçı bilgisini çıkar
            const titleParts = title.split('-')
            if (titleParts.length > 1) {
              const itemName = titleParts[0]?.trim()
              
              // Title'da şarkı belirtisi varsa şarkı sayfasına git
              if (itemName && (itemName.includes('şarkı') || itemName.includes('song') || itemName.includes('track'))) {
                // Gerçek şarkı ID'si yoksa, title'dan çıkarılan bilgiyi kullan
                const extractedSongId = songId || '1'
                navigate(`/song/${extractedSongId}`)
              } else {
                // Sanatçı sayfasına git
                const extractedArtistId = artistId || '1'
                navigate(`/artist/${extractedArtistId}`)
              }
            } else {
              // Varsayılan olarak şarkı sayfasına git
              const defaultSongId = songId || '1'
              navigate(`/song/${defaultSongId}`)
            }
          }
        } else {
          navigate(songId ? `/song/${songId}` : '/song/1')
        }
        break
      case 'trending-artist':
        navigate(artistId ? `/artist/${artistId}` : '/artist/1')
        break
      case 'chat-reply':
      case 'followed-chat':
        navigate(songId ? `/song/${songId}` : '/song/1') // Navigate to song for chat
        break
      case 'respect-notification':
        navigate(userId ? `/user/${userId}` : '/profile')
        break
      default:
        // Default case için de akıllı yönlendirme
        if (buttonText?.toLowerCase().includes('görüntüle') || buttonText?.toLowerCase().includes('view')) {
          if (songId) {
            navigate(`/song/${songId}`)
          } else if (artistId) {
            navigate(`/artist/${artistId}`)
          } else {
            // Title analizi yap
            const titleParts = title.split('-')
            if (titleParts.length > 1) {
              const itemName = titleParts[0]?.trim()
              if (itemName && (itemName.includes('şarkı') || itemName.includes('song') || itemName.includes('track'))) {
                const extractedSongId = songId || '1'
                navigate(`/song/${extractedSongId}`)
              } else {
                const extractedArtistId = artistId || '1'
                navigate(`/artist/${extractedArtistId}`)
              }
            } else {
              const defaultSongId = songId || '1'
              navigate(`/song/${defaultSongId}`)
            }
          }
        } else {
          console.log('Button clicked for:', type)
        }
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
        
        <div className="card-actions">
          <button className="card-button" onClick={handleButtonClick}>
            {buttonText}
          </button>
          
                      {/* Show follow button for trending artist cards */}
            {type === 'trending-artist' && (
              <FollowButton 
                artistId={artistId || '550e8400-e29b-41d4-a716-446655440001'} 
                artistName={title.split('-')[1]?.trim() || 'Sanatçı'}
                size="small"
              />
            )}
            
            {/* Show favorite button for trending song cards */}
            {type === 'trending-song' && (
              <FavoriteButton 
                songId={songId || '550e8400-e29b-41d4-a716-446655440002'} 
                initialFavoritesCount={156}
                size="small"
              />
            )}
        </div>
      </div>
    </div>
  )
}

export default FeedCard;