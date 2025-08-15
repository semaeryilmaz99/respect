import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../config/supabase'
import Header from './Header'
import SongInfo from './SongInfo'
import SongTopSupporters from './SongTopSupporters'
import SongRecentSupporters from './SongRecentSupporters'
import SongRealTimeChat from './SongRealTimeChat'
import MoreByArtist from './MoreByArtist'
import FavoriteButton from './FavoriteButton'
import respectService from '../api/respectService'
import SuccessPopup from './SuccessPopup'

import LoadingSpinner from './LoadingSpinner'

const SongPage = () => {
  const navigate = useNavigate()
  const { id: songId } = useParams()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [sendingRespect, setSendingRespect] = useState(false)
  const [respectMessage, setRespectMessage] = useState('')
  const [showRespectModal, setShowRespectModal] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Şarkı verilerini Supabase'den fetch et
  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) {
        console.log('❌ No song ID provided')
        setLoading(false)
        return
      }

      console.log('🔄 Fetching song data for ID:', songId)

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('songs')
          .select(`
            *,
            artists (
              id,
              name,
              avatar_url
            )
          `)
          .eq('id', songId)
          .single()

        if (error) {
          console.error('❌ Error fetching song:', error)
          throw error
        }

        console.log('✅ Song data fetched:', data)
        setSong(data)
      } catch (error) {
        console.error('❌ Error fetching song:', error)
        // Fallback to mock data
        setSong({
          id: songId,
          title: 'Bilinmeyen Şarkı',
          artist_name: 'Bilinmeyen Sanatçı',
          cover_url: '/assets/song/Image.png',
          total_respect: 0,
          artist: {
            id: 'unknown',
            name: 'Bilinmeyen Sanatçı',
            avatar_url: '/assets/artist/Image.png'
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSong()
  }, [songId])

  const handleQuickRespect = (amount) => {
    if (!song) return
    setSelectedAmount(amount)
    setShowRespectModal(true)
  }

  const handleFullRespect = () => {
    if (!song) return
    setShowRespectModal(true)
  }

  const handleSendRespect = async () => {
    if (!song || !selectedAmount) return
    
    try {
      setSendingRespect(true)
      
      const { data, error } = await respectService.sendRespectToSong(
        song.id, 
        selectedAmount, 
        respectMessage || null
      )

      if (error) {
        console.error('❌ Respect gönderme hatası:', error)
        alert('Respect gönderilirken hata oluştu: ' + error.message)
        return
      }

      console.log('✅ Respect başarıyla gönderildi:', data)
      
      // Şarkı verilerini yenile
      const { data: updatedSong, error: songError } = await supabase
        .from('songs')
        .select(`
          *,
          artists (
            id,
            name,
            avatar_url
          )
        `)
        .eq('id', song.id)
        .single()

      if (!songError && updatedSong) {
        setSong(updatedSong)
      }

      // Modal'ı kapat ve state'leri temizle
      setShowRespectModal(false)
      setSelectedAmount(null)
      setRespectMessage('')
      
      // Success popup göster
      setSuccessMessage(`${selectedAmount} Respect başarıyla gönderildi! 🎉`)
      setShowSuccessPopup(true)
      
    } catch (error) {
      console.error('❌ Respect gönderme hatası:', error)
      setSuccessMessage('Respect gönderilirken hata oluştu: ' + error.message)
      setShowSuccessPopup(true)
    } finally {
      setSendingRespect(false)
    }
  }

  const handleCloseModal = () => {
    setShowRespectModal(false)
    setSelectedAmount(null)
    setRespectMessage('')
  }

  const handleSpotifyClick = () => {
    if (!song) return
    
    // Spotify bağlantısı varsa onu kullan, yoksa Spotify'da arama yap
    if (song.spotify_url) {
      window.open(song.spotify_url, '_blank')
    } else {
      // Spotify'da arama yapmak için URL oluştur
      const searchQuery = encodeURIComponent(`${song.title} ${song.artist?.name || song.artist_name}`)
      const spotifySearchUrl = `https://open.spotify.com/search/${searchQuery}`
      window.open(spotifySearchUrl, '_blank')
    }
  }

  return (
    <div className="song-page">
      <Header />
      
      {/* Mobile Layout - Orijinal sıra */}
      <div className="song-content mobile-only">
        <SongInfo />
        <SongTopSupporters />
        <SongRecentSupporters />
        <SongRealTimeChat />
        <MoreByArtist />
      </div>

      {/* Desktop Layout - Header'ın Altında */}
      <div className="song-content desktop-only">
        {/* Desktop Song Info - Header'ın Altında */}
        <div className="desktop-song-info">
          <div className="song-album-cover">
            <img src={song?.cover_url || '/assets/song/Image.png'} alt="Şarkı Kapağı" />
          </div>
          
          <div className="song-details">
            <div className="song-title-section">
              <h2 className="song-title">{song?.title || 'Bilinmeyen Şarkı'}</h2>
              <h3 className="song-subtitle">{song?.artist?.name || song?.artist_name || 'Bilinmeyen Sanatçı'}</h3>
              <p className="song-respect">{song?.total_respect?.toLocaleString() || '0'} Respect</p>
            </div>
            
            <div className="song-buttons">
              <button className="play-spotify-button" onClick={handleSpotifyClick}>
                Spotify'da Dinle
              </button>
              <button className="send-respect-button" onClick={handleFullRespect}>
                Respect Gönder
              </button>
            </div>
          </div>
        </div>

        {/* Son Destekleyenler - Üst Bölüm */}
        <div className="song-recent-supporters-section">
          <SongRecentSupporters />
        </div>

        {/* 2 Bölümlü Layout */}
        <div className="song-desktop-layout">
          {/* Sol: En Çok Respect Gönderelenler */}
          <div className="song-left-panel">
            <SongTopSupporters />
          </div>

          {/* Sağ: Sanatçıdan Diğer Şarkılar */}
          <div className="song-right-content">
            {/* Sanatçıdan Diğer Şarkılar */}
            <MoreByArtist />
          </div>
        </div>

        {/* Chat (Fixed Positioned - diğerlerinin üstünde) */}
        <SongRealTimeChat />

        {/* Desktop Fixed Respect Gönder - Sol Alt */}
        <div className="desktop-fixed-respect-send">
          <h3 className="respect-section-title">Respect Gönder</h3>
          <p className="respect-subtitle">Bu harika şarkıya desteğini göster</p>
          
          <div className="quick-respect-buttons">
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(50)}
            >
              50 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(100)}
            >
              100 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(250)}
            >
              250 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(500)}
            >
              500 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(1000)}
            >
              1000 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(2000)}
            >
              2000 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(3000)}
            >
              3000 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(4000)}
            >
              4000 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(5000)}
            >
              5000 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(10000)}
            >
              10000 Respect
            </button>
          </div>
          
          <button className="full-respect-button" onClick={handleFullRespect}>
            Respect Gönder
          </button>
        </div>

        {/* Respect Modal */}
        {showRespectModal && (
          <div className="respect-modal-overlay" onClick={handleCloseModal}>
            <div className="respect-modal" onClick={(e) => e.stopPropagation()}>
              <div className="respect-modal-header">
                <h3>Respect Gönder</h3>
                <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
              </div>
              
              <div className="respect-modal-content">
                <div className="song-info-modal">
                  <img src={song?.cover_url || '/assets/song/Image.png'} alt="Şarkı Kapağı" />
                  <div>
                    <h4>{song?.title || 'Bilinmeyen Şarkı'}</h4>
                    <p>{song?.artist?.name || song?.artist_name || 'Bilinmeyen Sanatçı'}</p>
                  </div>
                </div>
                
                {!selectedAmount && (
                  <div className="amount-selection">
                    <h4>Tutar Seçin</h4>
                    <div className="amount-buttons">
                      <button onClick={() => setSelectedAmount(50)}>50 Respect</button>
                      <button onClick={() => setSelectedAmount(100)}>100 Respect</button>
                      <button onClick={() => setSelectedAmount(250)}>250 Respect</button>
                      <button onClick={() => setSelectedAmount(500)}>500 Respect</button>
                      <button onClick={() => setSelectedAmount(1000)}>1000 Respect</button>
                      <button onClick={() => setSelectedAmount(2000)}>2000 Respect</button>
                      <button onClick={() => setSelectedAmount(3000)}>3000 Respect</button>
                      <button onClick={() => setSelectedAmount(4000)}>4000 Respect</button>
                      <button onClick={() => setSelectedAmount(5000)}>5000 Respect</button>
                      <button onClick={() => setSelectedAmount(10000)}>10000 Respect</button>
                    </div>
                  </div>
                )}
                
                {selectedAmount && (
                  <div className="respect-confirmation">
                    <h4>Seçilen Tutar: {selectedAmount} Respect</h4>
                    <textarea
                      placeholder="Mesajınızı yazın (opsiyonel)"
                      value={respectMessage}
                      onChange={(e) => setRespectMessage(e.target.value)}
                      maxLength={200}
                    />
                    <div className="modal-buttons">
                      <button 
                        className="send-respect-btn" 
                        onClick={handleSendRespect}
                        disabled={sendingRespect}
                      >
                        {sendingRespect ? 'Gönderiliyor...' : 'Respect Gönder'}
                      </button>
                      <button 
                        className="change-amount-btn" 
                        onClick={() => setSelectedAmount(null)}
                      >
                        Tutarı Değiştir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Popup */}
        <SuccessPopup
          isVisible={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          title="Respect Gönderildi!"
          message={successMessage}
          icon=""
          autoClose={true}
          autoCloseDelay={3000}
        />
      </div>
    </div>
  )
}

export default SongPage 