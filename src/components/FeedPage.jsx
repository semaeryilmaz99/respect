import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import FeedCard from './FeedCard'
import RealTimeChat from './RealTimeChat'
import { useApi } from '../hooks/useApi'
import { feedService } from '../api'
import { debugArray, debugRender, debugWarn } from '../utils/debug.js'

const FeedPage = () => {
  const [activeTab, setActiveTab] = useState('community')
  const [showRespectFlowPopup, setShowRespectFlowPopup] = useState(false)
  const [isClosingRespectFlow, setIsClosingRespectFlow] = useState(false)
  const navigate = useNavigate()
  
  // Rate limiting uyarısı
  React.useEffect(() => {
    console.log('🎵 FeedPage loaded - Spotify API rate limiting is active');
    console.log('⏳ API calls are rate limited to prevent 429 errors');
  }, []);
  
  // API hook'ları kullanarak veri yükleme (optimized)
  const { 
    data: feedData, 
    loading: feedLoading, 
    error: feedError, 
    execute: refreshFeed 
  } = useApi(
    () => activeTab === 'community' 
      ? feedService.getFeed() 
      : feedService.getPersonalFeed(),
    [activeTab], // activeTab değiştiğinde yeniden yükle
    true // component mount olduğunda otomatik çalışsın
  )

  // Respect flow verilerini getir
  const { 
    data: respectFlowData, 
    loading: respectFlowLoading 
  } = useApi(
    () => feedService.getRespectFlow(10), // Son 10 respect işlemini getir
    [],
    true // Component mount olduğunda otomatik çalışsın
  )
  
  const handleRespectSend = () => {
    navigate('/send-respect')
  }

  const handleOpenRespectFlow = () => {
    setShowRespectFlowPopup(true)
  }

  const handleCloseRespectFlow = () => {
    setIsClosingRespectFlow(true)
    setTimeout(() => {
      setShowRespectFlowPopup(false)
      setIsClosingRespectFlow(false)
    }, 300) // Animasyon süresi kadar bekle
  }

  // Respect flow verilerini formatla
  const formatRespectFlowData = (data) => {
    if (!data || !Array.isArray(data)) {
      return []
    }

    return data.map(item => {
      // Zaman formatını hesapla
      const createdAt = new Date(item.created_at)
      const now = new Date()
      const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60))
      
      let timeText = ''
      if (diffInMinutes < 1) {
        timeText = 'Az önce'
      } else if (diffInMinutes < 60) {
        timeText = `${diffInMinutes} dakika önce`
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        timeText = `${hours} saat önce`
      } else {
        const days = Math.floor(diffInMinutes / 1440)
        timeText = `${days} gün önce`
      }

      return {
        id: item.id,
        user: {
          name: item.profiles?.full_name || item.profiles?.username || 'Bilinmeyen Kullanıcı',
          avatar: item.profiles?.avatar_url || '/assets/user/Image.png'
        },
        amount: item.amount || 0,
        message: item.message || null,
        time: timeText,
        song: {
          title: item.songs?.title || 'Bilinmeyen Şarkı',
          cover: item.songs?.cover_url || '/assets/song/Image.png'
        },
        artist: {
          name: item.artists?.name || item.songs?.artists?.name || 'Bilinmeyen Sanatçı',
          avatar: item.artists?.avatar_url || '/assets/artist/Image.png'
        }
      }
    })
  }



  // Loading durumlarını birleştir
  const isLoading = feedLoading || respectFlowLoading

  // Database'den gelen verileri formatla
  const formatFeedData = (data) => {
    // Debug array
    debugArray('feedData', data);
    
    // Null check ekle
    if (!data || !Array.isArray(data)) {
      debugWarn('Feed data is null or not an array:', data);
      return [];
    }
    
    return data.map(item => {
      const formattedItem = {
        type: item.type,
        title: activeTab === 'personal' ? getPersonalFeedItemTitle(item) : getFeedItemTitle(item),
        profileImage: getFeedItemImage(item),
        artistId: item.artist_id,
        userId: item.user_id
      }
      
      // Debug: Feed item detayları
      console.log(`${activeTab === 'personal' ? '👤 Personal' : '🌍 Community'} feed item details:`, {
        type: item.type,
        userName: item.profiles?.full_name || item.profiles?.username,
        artistName: item.artists?.name,
        songTitle: item.songs?.title,
        title: formattedItem.title
      })
      
      return formattedItem
    })
  }

  const getFeedItemTitle = (item) => {
    const userName = item.profiles?.full_name || item.profiles?.username || 'Bilinmeyen Kullanıcı'
    
    if (item.type === 'respect_sent') {
      const amount = item.content?.amount || 0
      const message = item.content?.message || ''
      const songTitle = item.songs?.title || 'Bilinmeyen Şarkı'
      const artistName = item.songs?.artists?.name || 'Bilinmeyen Sanatçı'
      return `${userName} ${songTitle} - ${artistName} şarkısına ${amount} respect gönderdi${message ? `: "${message}"` : ''}`
    } else if (item.type === 'song_favorited') {
      const songTitle = item.songs?.title || 'Bilinmeyen Şarkı'
      const artistName = item.songs?.artists?.name || 'Bilinmeyen Sanatçı'
      return `${userName} ${songTitle} - ${artistName} şarkısını favorilere ekledi`
    } else if (item.type === 'artist_followed') {
      const artistName = item.artists?.name || 'Bilinmeyen Sanatçı'
      return `${userName} ${artistName} sanatçısını takip etmeye başladı`
    }
    return `${userName} aktivite gerçekleştirdi`
  }

  // Personal feed için özel başlık formatı
  const getPersonalFeedItemTitle = (item) => {
    const userName = item.profiles?.full_name || item.profiles?.username || 'Bilinmeyen Kullanıcı'
    
    if (item.type === 'respect_sent') {
      const amount = item.content?.amount || 0
      const message = item.content?.message || ''
      const songTitle = item.songs?.title || 'Bilinmeyen Şarkı'
      const artistName = item.songs?.artists?.name || 'Bilinmeyen Sanatçı'
      return `${userName} favori şarkınıza ${amount} respect gönderdi: ${songTitle} - ${artistName}${message ? `: "${message}"` : ''}`
    } else if (item.type === 'song_favorited') {
      const songTitle = item.songs?.title || 'Bilinmeyen Şarkı'
      const artistName = item.songs?.artists?.name || 'Bilinmeyen Sanatçı'
      return `${userName} favori şarkınızı favorilere ekledi: ${songTitle} - ${artistName}`
    } else if (item.type === 'artist_followed') {
      const artistName = item.artists?.name || 'Bilinmeyen Sanatçı'
      return `${userName} takip ettiğiniz sanatçıyı takip etmeye başladı: ${artistName}`
    }
    return `${userName} aktivite gerçekleştirdi`
  }



  const getFeedItemImage = (item) => {
    // Her iki feed'de de kullanıcının profil resmini göster
    if (item.profiles?.avatar_url) {
      return item.profiles.avatar_url
    }
    
    // Fallback: Sanatçı/şarkı resmi
    if (item.type === 'artist_followed' && item.artists?.avatar_url) {
      return item.artists.avatar_url
    } else if (item.type === 'song_favorited' && item.songs?.cover_url) {
      return item.songs.cover_url
    } else if (item.type === 'respect_sent' && item.songs?.cover_url) {
      return item.songs.cover_url
    }
    // Fallback image
    return '/assets/artist/Image.png'
  }

  // Loading durumu
  if (isLoading) {
    return (
      <div className="feed-page">
        <Header />
        <div className="loading-container">
          <p>Veriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Error durumu
  if (feedError) {
    return (
      <div className="feed-page">
        <Header />
        <div className="error-container">
          <h3>Bir hata oluştu</h3>
          <p>{feedError.message}</p>
          <button type="button" onClick={refreshFeed}>Tekrar Dene</button>
        </div>
      </div>
    )
  }

  // Database'den gelen verileri kullan
  debugRender('FeedPage', { activeTab, feedDataLength: feedData?.length });
  const currentData = formatFeedData(feedData)
  const formattedRespectFlowData = formatRespectFlowData(respectFlowData)

  return (
    <div className="feed-page">
      <Header />
      
      {/* Desktop Respect Gönder Button */}
      <div className="desktop-respect-button-container">
        <button type="button" className="desktop-respect-button" onClick={handleRespectSend}>
          Respect Gönder
        </button>
      </div>
      
      {/* Mobile Respect Flow Button - Header ile Feed Tabs arasında */}
      <div className="mobile-respect-flow-section">
        <button type="button" className="mobile-respect-flow-btn" onClick={handleOpenRespectFlow}>
          Respect Akışı
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="feed-tabs">
        <button 
          type="button"
          className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('community');
          }}
        >
          Topluluk
        </button>
        <button 
          type="button"
          className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('personal');
          }}
        >
          Sana Özel
        </button>
      </div>
      
      {/* Fixed Chat Panel - sadece desktop'ta görünür */}
      <div className="chat-panel">
        <RealTimeChat />
      </div>
      
      {/* Mobile Chat Panel - sadece mobile'da görünür */}
      <div className="mobile-chat-panel">
        <RealTimeChat />
      </div>
      

      
      {/* Desktop Layout: Sol respect akışı + Sağ ana feed */}
      <div className="feed-layout">
        {/* Sol Panel - Respect Akışı (sadece desktop'ta görünür) */}
        <h2 className="respect-flow-title desktop-only">Respect Akışı</h2>
        <div className="respect-flow-panel desktop-only">
          <div className="respect-flow-items">
            {formattedRespectFlowData && Array.isArray(formattedRespectFlowData) ? formattedRespectFlowData.map((item) => (
              <div key={item.id} className="respect-flow-item">
                <div className="respect-flow-header">
                  <img src={item.user.avatar} alt={item.user.name} className="user-avatar-small" />
                  <div className="respect-flow-info">
                    <span className="user-name">{item.user.name}</span>
                    <span className="respect-time">{item.time}</span>
                  </div>
                  <div className="respect-amount">
                    <span>+{item.amount}</span>
                    <span className="respect-arrow">→</span>
                  </div>
                </div>
                
                <div className="respect-flow-content">
                  <img src={item.song.cover} alt={item.song.title} className="song-cover-small" />
                  <div className="song-info">
                    <p className="song-title">{item.song.title}</p>
                    <p className="artist-name">{item.artist.name}</p>
                  </div>
                </div>
                
                {item.message && (
                  <p className="respect-message">"{item.message}"</p>
                )}
              </div>
            )) : (
              <div className="no-respect-flow">
                <p>Henüz respect akışı yok</p>
              </div>
            )}
          </div>
        </div>
        
                {/* Orta Panel - Ana Feed */}
        <div className="main-feed-panel">
          {/* Feed Header - Desktop Only */}
          <div className="feed-header">
            <h2 className="feed-header-title">Respect topluluğunda neler oluyor?</h2>
          </div>
          
          <div className="feed">
            {currentData && Array.isArray(currentData) ? currentData.map((item, index) => (
              <FeedCard
                key={index}
                type={item.type}
                title={item.title}
                profileImage={item.profileImage}
                artistId={item.artistId}
                userId={item.userId}
              />
            )) : (
              <div className="no-feed-data">
                <p>Henüz feed verisi yok</p>
              </div>
            )}
          </div>
        </div>
        

      </div>

      {/* Mobile Respect Flow Popup */}
      {showRespectFlowPopup && (
        <div 
          className={`mobile-respect-flow-popup-overlay ${isClosingRespectFlow ? 'closing' : ''}`} 
          onClick={handleCloseRespectFlow}
        >
          <div 
            className={`mobile-respect-flow-popup ${isClosingRespectFlow ? 'closing' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-popup-header">
              <h2>Respect Akışı</h2>
              <button type="button" className="mobile-popup-close-btn" onClick={handleCloseRespectFlow}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="mobile-popup-content">
              <div className="mobile-respect-flow-items">
                {formattedRespectFlowData && Array.isArray(formattedRespectFlowData) ? formattedRespectFlowData.map((item) => (
                  <div key={item.id} className="mobile-respect-flow-item">
                    <div className="mobile-respect-flow-header">
                      <img src={item.user.avatar} alt={item.user.name} className="mobile-user-avatar-small" />
                      <div className="mobile-respect-flow-info">
                        <span className="mobile-user-name">{item.user.name}</span>
                        <span className="mobile-respect-time">{item.time}</span>
                      </div>
                      <div className="mobile-respect-amount">
                        <span>+{item.amount}</span>
                        <span className="mobile-respect-arrow">→</span>
                      </div>
                    </div>
                    
                    <div className="mobile-respect-flow-content">
                      <img src={item.song.cover} alt={item.song.title} className="mobile-song-cover-small" />
                      <div className="mobile-song-info">
                        <p className="mobile-song-title">{item.song.title}</p>
                        <p className="mobile-artist-name">{item.artist.name}</p>
                      </div>
                    </div>
                    
                    {item.message && (
                      <p className="mobile-respect-message">"{item.message}"</p>
                    )}
                  </div>
                )) : (
                  <div className="mobile-no-respect-flow">
                    <p>Henüz respect akışı yok</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedPage 