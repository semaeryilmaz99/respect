import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import FeedCard from './FeedCard'
import RealTimeChat from './RealTimeChat'
import { useApi } from '../hooks/useApi'
import { feedService } from '../api'

const FeedPage = () => {
  const [activeTab, setActiveTab] = useState('community')
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

  // Sadece gerekli olan API çağrılarını yap
  const { 
    data: respectFlowData, 
    loading: respectFlowLoading 
  } = useApi(
    () => feedService.getRespectFlow(),
    [],
    false // Otomatik çalışmasın, sadece gerektiğinde çağır
  )
  
  const handleRespectSend = () => {
    navigate('/send-respect')
  }

  // Loading durumlarını birleştir
  const isLoading = feedLoading || respectFlowLoading

  // Database'den gelen verileri formatla
  const formatFeedData = (data) => {
    return data.map(item => {
      const formattedItem = {
        type: item.type,
        title: activeTab === 'personal' ? getPersonalFeedItemTitle(item) : getFeedItemTitle(item),
        buttonText: getFeedItemButtonText(item),
        profileImage: getFeedItemImage(item),
        artistId: item.artist_id,
        songId: item.song_id,
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
      return `💰 ${userName} ${songTitle} - ${artistName} şarkısına ${amount} respect gönderdi${message ? `: "${message}"` : ''}`
    } else if (item.type === 'song_favorited') {
      const songTitle = item.songs?.title || 'Bilinmeyen Şarkı'
      const artistName = item.songs?.artists?.name || 'Bilinmeyen Sanatçı'
      return `❤️ ${userName} ${songTitle} - ${artistName} şarkısını favorilere ekledi`
    } else if (item.type === 'artist_followed') {
      const artistName = item.artists?.name || 'Bilinmeyen Sanatçı'
      return `👥 ${userName} ${artistName} sanatçısını takip etmeye başladı`
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
      return `🎵 ${userName} favori şarkınıza ${amount} respect gönderdi: ${songTitle} - ${artistName}${message ? `: "${message}"` : ''}`
    } else if (item.type === 'song_favorited') {
      const songTitle = item.songs?.title || 'Bilinmeyen Şarkı'
      const artistName = item.songs?.artists?.name || 'Bilinmeyen Sanatçı'
      return `🎵 ${userName} favori şarkınızı favorilere ekledi: ${songTitle} - ${artistName}`
    } else if (item.type === 'artist_followed') {
      const artistName = item.artists?.name || 'Bilinmeyen Sanatçı'
      return `🎨 ${userName} takip ettiğiniz sanatçıyı takip etmeye başladı: ${artistName}`
    }
    return `${userName} aktivite gerçekleştirdi`
  }

  const getFeedItemButtonText = (item) => {
    if (item.type === 'respect_sent') {
      return 'Detayları Gör'
    }
    return 'Görüntüle'
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
          <button onClick={refreshFeed}>Tekrar Dene</button>
        </div>
      </div>
    )
  }

  // Database'den gelen verileri kullan
  console.log('📊 Raw feed data:', feedData)
  console.log('📊 Active tab:', activeTab)
  console.log('📊 Feed data type:', activeTab === 'community' ? 'Community' : 'Personal')
  const currentData = formatFeedData(feedData)
  console.log('📊 Formatted feed data:', currentData)

  return (
    <div className="feed-page">
      <Header />
      
      {/* Desktop Respect Gönder Button */}
      <div className="desktop-respect-button-container">
        <button className="desktop-respect-button" onClick={handleRespectSend}>
          Respect Gönder
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="feed-tabs">
        <button 
          className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          Topluluk
        </button>
        <button 
          className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
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
        <div className="respect-flow-panel desktop-only">
          <h2 className="respect-flow-title">Respect Akışı</h2>
          <div className="respect-flow-items">
            {respectFlowData.map((item) => (
              <div key={item.id} className="respect-flow-item">
                <div className="respect-flow-header">
                  <img src={item.user.avatar} alt={item.user.name} className="user-avatar-small" />
                  <div className="respect-flow-info">
                    <span className="user-name">{item.user.name}</span>
                    <span className="respect-time">{item.time}</span>
                  </div>
                  <span className="respect-amount">+{item.amount}</span>
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
            ))}
          </div>
        </div>
        
                {/* Orta Panel - Ana Feed */}
        <div className="main-feed-panel">
          {/* Feed Header - Desktop Only */}
          <div className="feed-header">
            <h2 className="feed-header-title">Respect topluluğunda neler oluyor?</h2>
          </div>
          
          <div className="feed">
            {currentData.map((item, index) => (
              <FeedCard
                key={index}
                type={item.type}
                title={item.title}
                buttonText={item.buttonText}
                profileImage={item.profileImage}
                artistId={item.artistId}
                songId={item.songId}
                userId={item.userId}
              />
            ))}
          </div>
        </div>
        

      </div>
    </div>
  )
}

export default FeedPage 