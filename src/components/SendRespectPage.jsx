import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { respectService } from '../api'
import Header from './Header'
import BackButton from './common/BackButton'
import LoadingSpinner from './LoadingSpinner'
import SuccessPopup from './SuccessPopup'

const SendRespectPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userBalance, setUserBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Get data from navigation state
  const respectData = location.state || {
    songId: '1',
    songTitle: 'Gidiyorum',
    artistName: 'Sezen Aksu',
    songCover: '/assets/respect.png',
    currentRespect: '1,247',
    isArtist: false
  }

  const respectAmounts = [20, 50, 100, 200, 500, 1000]

  // Kullanıcı balance'ını al
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setBalanceLoading(true)
        const { data, error } = await respectService.getRespectBalance()
        if (!error && data) {
          setUserBalance(data.respect_balance || 0)
        }
      } catch (err) {
        console.error('Balance fetch error:', err)
      } finally {
        setBalanceLoading(false)
      }
    }

    fetchBalance()
  }, [])

  // Preselected amount support
  useEffect(() => {
    if (respectData.preselectedAmount) {
      setSelectedAmount(respectData.preselectedAmount)
      setCustomAmount('')
    }
  }, [respectData.preselectedAmount])

  // Balance güncelleme kontrolü
  useEffect(() => {
    if (location.state?.balanceUpdated) {
      const fetchBalance = async () => {
        try {
          const { data, error } = await respectService.getRespectBalance()
          if (!error && data) {
            setUserBalance(data.respect_balance || 0)
          }
        } catch (err) {
          console.error('Balance fetch error:', err)
        }
      }
      fetchBalance()
    }
  }, [location.state?.balanceUpdated])

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value)
    setSelectedAmount(null)
  }

  const handleSendRespect = async () => {
    const amount = selectedAmount || parseInt(customAmount)
    if (!amount || amount <= 0) {
      setError('Geçerli bir miktar seçin')
      return
    }

    // Balance kontrolü
    if (amount > userBalance) {
      setError('Yetersiz balance. Lütfen önce respect satın alın.')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Artist veya Song için ayrı işlem
      if (respectData.isArtist) {
        await respectService.sendRespectToArtist(respectData.artistId, amount)
        console.log(`${respectData.artistName} sanatçısına ${amount} respect başarıyla gönderildi`)
      } else {
        await respectService.sendRespectToSong(respectData.songId, amount)
        console.log(`${respectData.songTitle} şarkısına ${amount} respect başarıyla gönderildi`)
      }
      
      // Balance'ı güncelle
      setUserBalance(prev => prev - amount)
      
      // Başarı popup'ını göster
      const recipientName = respectData.isArtist ? respectData.artistName : respectData.songTitle
      setSuccessMessage(`${amount} Respect başarıyla ${recipientName}${respectData.isArtist ? ' sanatçısına' : ' şarkısına'} gönderildi!`)
      setShowSuccessPopup(true)
      
      // 3 saniye sonra yönlendir
      setTimeout(() => {
        setShowSuccessPopup(false)
        // Navigate back to the appropriate page
        if (respectData.isArtist) {
          navigate(`/artist/${respectData.artistId}`)
        } else {
          navigate(`/song/${respectData.songId}`)
        }
      }, 3000)
    } catch (err) {
      setError(err.message || 'Respect gönderilirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseRespect = () => {
    navigate('/purchase', {
      state: {
        returnTo: location.pathname,
        returnToState: location.state
      }
    })
  }

  return (
    <div className="send-respect-page">
      <div className="respect-header mobile-only" style={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        padding: '16px 20px',
        background: 'transparent'
      }}>
        <BackButton />
      </div>
      <Header />

      <div className="respect-main-container">
        {/* Sol Bölüm - Sadece Masaüstünde Görünür */}
        <div className="respect-left-panel desktop-only">
          {/* Hızlı Gönderim Butonu */}
          <div className="quick-send-section">
            <h3 className="panel-title">Hızlı Gönderim</h3>
            <button 
              className="quick-send-button"
              onClick={() => handleAmountSelect(100)}
              disabled={loading}
            >
              100 Respect Gönder
            </button>
          </div>

          {/* Sanatçı Teşekkür Mesajı */}
          <div className="artist-thanks-section">
            <h3 className="panel-title">Sanatçı Mesajı</h3>
            <div className="thanks-message">
              <div className="artist-avatar">
                <img src="/assets/user/Image.png" alt="Sanatçı" />
              </div>
              <div className="thanks-text">
                <p>"Desteğiniz için çok teşekkür ederim! Müziğimi sevdiğiniz için mutluyum."</p>
                <span className="artist-signature">- {respectData.artistName}</span>
              </div>
            </div>
          </div>

          {/* İstatistik Bildirimleri */}
          <div className="stats-section">
            <h3 className="panel-title">İstatistikler</h3>
            <div className="stat-item">
              <p>Bugün bu şarkıya respect gönderen <strong>18. kişisiniz</strong></p>
            </div>
          </div>

          {/* Son Respect Göndericiler */}
          <div className="recent-supporters-section">
            <h3 className="panel-title">Son Respect Gönderen 5 Kişi</h3>
            <div className="recent-supporters-list">
              {[
                { name: 'Ahmet K.', amount: 200, time: '2 dk önce' },
                { name: 'Ayşe M.', amount: 150, time: '5 dk önce' },
                { name: 'Mehmet Y.', amount: 100, time: '8 dk önce' },
                { name: 'Fatma S.', amount: 50, time: '12 dk önce' },
                { name: 'Ali R.', amount: 300, time: '15 dk önce' }
              ].map((supporter, index) => (
                <div key={index} className="supporter-item">
                  <div className="supporter-avatar">
                    <img src={`/assets/user/Image (${index + 1}).png`} alt={supporter.name} />
                  </div>
                  <div className="supporter-info">
                    <span className="supporter-name">{supporter.name}</span>
                    <span className="supporter-amount">{supporter.amount} Respect</span>
                  </div>
                  <span className="supporter-time">{supporter.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Bölüm - Mevcut Respect Content */}
        <div className="respect-content">
          <div className="song-info-section">
            <div className="song-cover">
              <img src={respectData.songCover} alt={respectData.songTitle} />
            </div>
            <div className="song-details">
              <h2 className="song-name">{respectData.songTitle}</h2>
              <p className="artist-name">{respectData.artistName}</p>
            </div>
          </div>

          <div className="amount-selection">
            <h3 className="section-title">Miktar Seç</h3>
            
            {/* Balance Display */}
            <div className="balance-display">
              <span className="balance-label">Mevcut Balance:</span>
              {balanceLoading ? (
                <LoadingSpinner size="small" />
              ) : (
                <span className="balance-amount">{userBalance.toLocaleString()} Respect</span>
              )}
            </div>
            
            {error && (
              <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </div>
            )}
            
            <div className="amount-grid">
              {respectAmounts.map((amount) => (
                <button
                  key={amount}
                  className={`amount-button ${selectedAmount === amount ? 'selected' : ''} ${amount > userBalance ? 'insufficient' : ''}`}
                  onClick={() => handleAmountSelect(amount)}
                  disabled={loading}
                >
                  {amount} Respect
                  {amount > userBalance && <span className="insufficient-indicator">Yetersiz</span>}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Miktar girin"
              value={customAmount}
              onChange={handleCustomAmountChange}
              className="custom-amount-input"
              disabled={loading}
            />
          </div>

          <div className="action-buttons">
            <button 
              className="send-support-button"
              onClick={handleSendRespect}
              disabled={(!selectedAmount && !customAmount) || loading || (selectedAmount && selectedAmount > userBalance) || (customAmount && parseInt(customAmount) > userBalance)}
            >
              {loading ? 'Gönderiliyor...' : 'Gönder ve Destekle'}
            </button>
            
            <button 
              className="purchase-respect-button"
              onClick={handlePurchaseRespect}
              disabled={loading}
            >
              Respect Satın Al
            </button>
          </div>
        </div>
      </div>
      
      {/* Success Popup */}
      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Respect Gönderildi!"
        message={successMessage}
        autoClose={false}
      />
    </div>
  )
}

export default SendRespectPage 