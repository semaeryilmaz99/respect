import React from 'react'
import { useNavigate } from 'react-router-dom'

const FeedCard = ({ type, title, profileImage, artistId, userId, songId, respectAmount, message }) => {
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
  const handleRespectButtonClick = (event) => {
    event.stopPropagation() // Card tıklamasını engelle
    
    if (type === 'respect_sent' && songId) {
      navigate(`/song/${songId}`)
    } else if (type === 'respect_sent' && artistId) {
      navigate(`/artist/${artistId}`)
    } else if (type === 'song_favorited' && songId) {
      navigate(`/song/${songId}`)
    } else if (type === 'artist_followed' && artistId) {
      navigate(`/artist/${artistId}`)
    }
  }

  // Respect buton metni
  const getRespectButtonText = () => {
    if (type === 'respect_sent') {
      return 'Respect Detayı'
    } else if (type === 'song_favorited') {
      return 'Şarkıyı Gör'
    } else if (type === 'artist_followed') {
      return 'Sanatçıyı Gör'
    }
    return 'Detayı Gör'
  }

  // Artist/song isimlerini vurgula
  const highlightNames = (text) => {
    if (!text) return text
    
    // Daha kapsamlı pattern'ler ile artist/song isimlerini bul
    const patterns = [
      // "Şarkı Adı - Sanatçı Adı" formatı
      /([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+)\s*-\s*([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+)/g,
      // "Sanatçı Adı" formatı (tek başına)
      /([A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]{2,})/g
    ]
    
    let result = text
    
    // İlk pattern: "Şarkı - Sanatçı" formatı
    result = result.replace(patterns[0], (match, songName, artistName) => {
      return `<highlight>${songName.trim()} - ${artistName.trim()}</highlight>`
    })
    
    // İkinci pattern: Tek sanatçı isimleri (eğer zaten highlight edilmemişse)
    result = result.replace(patterns[1], (match, artistName) => {
      // Eğer zaten highlight edilmişse veya çok kısa ise atla
      if (match.includes('<highlight>') || artistName.trim().length < 3) {
        return match
      }
      return `<highlight>${artistName.trim()}</highlight>`
    })
    
    // HTML tag'lerini React elementlerine çevir
    const parts = result.split(/(<highlight>.*?<\/highlight>)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('<highlight>') && part.endsWith('</highlight>')) {
        const content = part.replace(/<\/?highlight>/g, '')
        return (
          <span key={index} className="highlighted-name">
            {content}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="feed-card" data-type={type}>
      <div className="card-content">
        <div className="card-top">
          <div className="card-text">
            <h3 className="card-title">
              {highlightNames(title)}
            </h3>
            
            {/* Respect sayısı gösterimi */}
            {type === 'respect_sent' && respectAmount && (
              <div className="respect-amount-display">
                <span className="respect-icon">💰</span>
                <span className="respect-count">+{respectAmount} Respect</span>
                {message && (
                  <div className="respect-message">
                    "{message}"
                  </div>
                )}
              </div>
            )}
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
        
        {/* Respect butonu */}
        <div className="card-actions">
          <button 
            className="respect-navigation-button"
            onClick={handleRespectButtonClick}
            title={getRespectButtonText()}
          >
            <span className="button-icon">🎵</span>
            <span className="button-text">{getRespectButtonText()}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeedCard;