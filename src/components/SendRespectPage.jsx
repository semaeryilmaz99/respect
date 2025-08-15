import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { respectService } from '../api'
import searchService from '../api/searchService'
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

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ artists: [], songs: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Multi-selection states
  const [selectedItems, setSelectedItems] = useState([])
  const [isMultiSelectionMode, setIsMultiSelectionMode] = useState(false)
  
  // Ref for search results
  const searchResultsRef = useRef(null)

  // Get data from navigation state or URL params
  const [respectData, setRespectData] = useState({
    songId: null,
    songTitle: '',
    artistId: null,
    artistName: '',
    songCover: '/assets/respect.png',
    currentRespect: '0',
    isArtist: false
  })

  const respectAmounts = [20, 50, 100, 200, 500, 1000]

  // Initialize respect data from navigation state or URL params
  useEffect(() => {
    const state = location.state
    const params = new URLSearchParams(location.search)
    
    if (state) {
      // Data from navigation state (from artist/song pages)
      setRespectData({
        songId: state.songId || null,
        songTitle: state.songTitle || '',
        artistId: state.artistId || null,
        artistName: state.artistName || '',
        songCover: state.songCover || '/assets/respect.png',
        currentRespect: state.currentRespect || '0',
        isArtist: state.isArtist || false
      })
      
      // If we have data from navigation, set selected item
      if (state.isArtist && state.artistId) {
        const newItem = {
          id: state.artistId,
          name: state.artistName,
          avatar_url: state.songCover,
          type: 'artist'
        }
        setSelectedItem(newItem)
        setSelectedItems([newItem])
      } else if (state.songId) {
        const newItem = {
          id: state.songId,
          title: state.songTitle,
          cover_url: state.songCover,
          artists: { name: state.artistName },
          type: 'song'
        }
        setSelectedItem(newItem)
        setSelectedItems([newItem])
      }
    } else if (params.get('artistId') || params.get('songId')) {
      // Data from URL params
      const artistId = params.get('artistId')
      const songId = params.get('songId')
      
      if (artistId) {
        setRespectData(prev => ({
          ...prev,
          artistId,
          isArtist: true
        }))
      } else if (songId) {
        setRespectData(prev => ({
          ...prev,
          songId
        }))
      }
    }
  }, [location.state, location.search])

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
    if (location.state?.preselectedAmount) {
      setSelectedAmount(location.state.preselectedAmount)
      setCustomAmount('')
    }
  }, [location.state?.preselectedAmount])

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

  // Handle search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.trim().length >= 2) {
      setIsSearching(true)
      try {
        const results = await searchService.searchArtistsAndSongs(query, 5)
        setSearchResults(results)
        setShowSearchResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults({ artists: [], songs: [] })
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults({ artists: [], songs: [] })
      setShowSearchResults(false)
    }
  }

  // Handle search result item click
  const handleSearchItemClick = (item, type) => {
    const newItem = { ...item, type }
    
    if (isMultiSelectionMode) {
      // Multi-selection mode: add to selected items
      const isAlreadySelected = selectedItems.some(selected => 
        selected.id === item.id && selected.type === type
      )
      
      if (!isAlreadySelected) {
        setSelectedItems(prev => [...prev, newItem])
        setSelectedItem(newItem) // Show the latest selected item
      }
    } else {
      // Single selection mode: replace current selection
      setSelectedItem(newItem)
      setSelectedItems([newItem])
    }
    
    setSearchQuery(type === 'artist' ? item.name : item.title)
    setShowSearchResults(false)
    
    // Update respect data based on selection
    if (type === 'artist') {
      setRespectData({
        artistId: item.id,
        artistName: item.name,
        songCover: item.avatar_url || '/assets/artist/Image.png',
        currentRespect: item.total_respect || '0',
        isArtist: true,
        songId: null,
        songTitle: ''
      })
    } else {
      setRespectData({
        songId: item.id,
        songTitle: item.title,
        artistName: item.artists?.name || 'Bilinmeyen Sanatçı',
        songCover: item.cover_url || '/assets/song/Image.png',
        currentRespect: item.total_respect || '0',
        isArtist: false,
        artistId: null
      })
    }
  }

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2 && (searchResults.artists.length > 0 || searchResults.songs.length > 0)) {
      setShowSearchResults(true)
    }
  }

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSearchResults])

  // Handle search input keydown
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchResults(false)
    } else if (e.key === 'Escape') {
      setSearchQuery('')
      setShowSearchResults(false)
    }
  }

  // Handle add item to multi-selection
  const handleAddItem = () => {
    if (selectedItem) {
      const isAlreadySelected = selectedItems.some(item => 
        item.id === selectedItem.id && item.type === selectedItem.type
      )
      
      if (!isAlreadySelected) {
        setSelectedItems(prev => [...prev, selectedItem])
        setIsMultiSelectionMode(true)
      }
    }
  }

  // Handle remove item from multi-selection
  const handleRemoveItem = (itemToRemove) => {
    setSelectedItems(prev => prev.filter(item => 
      !(item.id === itemToRemove.id && item.type === itemToRemove.type)
    ))
    
    // If removing the currently displayed item, show the first remaining item
    if (selectedItem && selectedItem.id === itemToRemove.id && selectedItem.type === itemToRemove.type) {
      const remainingItems = selectedItems.filter(item => 
        !(item.id === itemToRemove.id && item.type === itemToRemove.type)
      )
      if (remainingItems.length > 0) {
        setSelectedItem(remainingItems[0])
      } else {
        setSelectedItem(null)
        setIsMultiSelectionMode(false)
      }
    }
  }

  // Handle clear all selections
  const handleClearAll = () => {
    setSelectedItem(null)
    setSelectedItems([])
    setSearchQuery('')
    setIsMultiSelectionMode(false)
    setRespectData({
      songId: null,
      songTitle: '',
      artistId: null,
      artistName: '',
      songCover: '/assets/respect.png',
      currentRespect: '0',
      isArtist: false
    })
  }

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value)
    setSelectedAmount(null)
  }

  const handleSendRespect = async () => {
    // Check if items are selected
    if (selectedItems.length === 0) {
      setError('Lütfen en az bir sanatçı veya şarkı seçin')
      return
    }

    const amount = selectedAmount || parseInt(customAmount)
    if (!amount || amount <= 0) {
      setError('Geçerli bir miktar seçin')
      return
    }

    // Calculate total amount needed
    const totalAmount = amount * selectedItems.length

    // Balance kontrolü
    if (totalAmount > userBalance) {
      setError(`Yetersiz balance. ${selectedItems.length} öğeye ${amount} respect göndermek için ${totalAmount} respect gerekiyor.`)
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Send respect to all selected items
      for (const item of selectedItems) {
        if (item.type === 'artist') {
          await respectService.sendRespectToArtist(item.id, amount)
          console.log(`${item.name} sanatçısına ${amount} respect başarıyla gönderildi`)
        } else {
          await respectService.sendRespectToSong(item.id, amount)
          console.log(`${item.title} şarkısına ${amount} respect başarıyla gönderildi`)
        }
      }
      
      // Balance'ı güncelle
      setUserBalance(prev => prev - totalAmount)
      
      // Başarı popup'ını göster
      const itemCount = selectedItems.length
      const recipientText = itemCount === 1 
        ? (selectedItems[0].type === 'artist' ? selectedItems[0].name : selectedItems[0].title)
        : `${itemCount} öğeye`
      
      setSuccessMessage(`${amount} Respect başarıyla ${recipientText}${itemCount === 1 ? (selectedItems[0].type === 'artist' ? ' sanatçısına' : ' şarkısına') : ''} gönderildi!`)
      setShowSuccessPopup(true)
      
      // 3 saniye sonra yönlendir
      setTimeout(() => {
        setShowSuccessPopup(false)
        // Navigate back to the appropriate page
        if (selectedItems.length === 1) {
          const item = selectedItems[0]
          if (item.type === 'artist') {
            navigate(`/artist/${item.id}`)
          } else {
            navigate(`/song/${item.id}`)
          }
        } else {
          navigate('/feed')
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
                <span className="artist-signature">- {respectData.artistName || 'Sanatçı'}</span>
              </div>
            </div>
          </div>

          {/* İstatistik Bildirimleri */}
          <div className="stats-section">
            <h3 className="panel-title">İstatistikler</h3>
            <div className="stat-item">
              <p>Bugün bu {selectedItem?.type === 'artist' ? 'sanatçıya' : 'şarkıya'} respect gönderen <strong>18. kişisiniz</strong></p>
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
          {/* Search Section - Only show if no item is selected from navigation */}
          {!selectedItem && (
            <div className="search-section">
              <h3 className="section-title">Sanatçı veya Şarkı Seç</h3>
              <div className="search-container" ref={searchResultsRef}>
                <div className="search-input-wrapper">
                  <div className="search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Sanatçı veya şarkı adı yazın..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {isSearching && (
                    <div className="search-loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
                {showSearchResults && (searchResults.artists.length > 0 || searchResults.songs.length > 0) && (
                  <div className="search-results">
                    {searchResults.artists.map((artist) => (
                      <div 
                        key={`artist-${artist.id}`} 
                        className="search-result-item"
                        onClick={() => handleSearchItemClick(artist, 'artist')}
                      >
                        <div className="result-avatar">
                          <img src={artist.avatar_url || '/assets/artist/Image.png'} alt={artist.name} />
                        </div>
                        <div className="result-info">
                          <h4>{artist.name}</h4>
                          <p>Sanatçı • {artist.total_respect || 0} Respect</p>
                        </div>
                      </div>
                    ))}
                    {searchResults.songs.map((song) => (
                      <div 
                        key={`song-${song.id}`} 
                        className="search-result-item"
                        onClick={() => handleSearchItemClick(song, 'song')}
                      >
                        <div className="result-avatar">
                          <img src={song.cover_url || '/assets/song/Image.png'} alt={song.title} />
                        </div>
                        <div className="result-info">
                          <h4>{song.title}</h4>
                          <p>Şarkı • {song.artists?.name || 'Bilinmeyen Sanatçı'} • {song.total_respect || 0} Respect</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Items Display */}
          {selectedItems.length > 0 && (
            <div className="selected-items-section">
              <div className="selected-items-header">
                <h3 className="section-title">
                  Seçilen Öğeler ({selectedItems.length})
                </h3>
                <div className="selected-items-actions">
                  <button 
                    className="add-item-btn"
                    onClick={handleAddItem}
                    disabled={!selectedItem || selectedItems.some(item => 
                      item.id === selectedItem.id && item.type === selectedItem.type
                    )}
                  >
                    Ekle
                  </button>
                  <button 
                    className="change-selection-btn"
                    onClick={handleClearAll}
                  >
                    Temizle
                  </button>
                </div>
              </div>
              
                             <div className="selected-items-list">
                 {selectedItems.map((item) => (
                   <div key={`${item.type}-${item.id}`} className="selected-item-info">
                    <div className="selected-item-avatar">
                      <img 
                        src={item.type === 'artist' ? item.avatar_url : item.cover_url} 
                        alt={item.type === 'artist' ? item.name : item.title} 
                      />
                    </div>
                    <div className="selected-item-details">
                      <h4 className="selected-item-title">
                        {item.type === 'artist' ? item.name : item.title}
                      </h4>
                      <p className="selected-item-subtitle">
                        {item.type === 'artist' ? 'Sanatçı' : `${item.artists?.name || 'Bilinmeyen Sanatçı'} • Şarkı`}
                      </p>
                    </div>
                    <button 
                      className="remove-item-btn"
                      onClick={() => handleRemoveItem(item)}
                    >
                      Kaldır
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Selected Item Display */}
          {selectedItem && (
            <div className="selected-item-section">
              <div className="selected-item-info">
                <div className="selected-item-avatar">
                  <img 
                    src={selectedItem.type === 'artist' ? selectedItem.avatar_url : selectedItem.cover_url} 
                    alt={selectedItem.type === 'artist' ? selectedItem.name : selectedItem.title} 
                  />
                </div>
                <div className="selected-item-details">
                  <h3 className="selected-item-title">
                    {selectedItem.type === 'artist' ? selectedItem.name : selectedItem.title}
                  </h3>
                  <p className="selected-item-subtitle">
                    {selectedItem.type === 'artist' ? 'Sanatçı' : `${selectedItem.artists?.name || 'Bilinmeyen Sanatçı'} • Şarkı`}
                  </p>
                </div>
                <div className="selected-item-actions">
                  <button 
                    className="add-item-btn"
                    onClick={handleAddItem}
                    disabled={selectedItems.some(item => 
                      item.id === selectedItem.id && item.type === selectedItem.type
                    )}
                  >
                    Ekle
                  </button>
                  <button 
                    className="change-selection-btn"
                    onClick={handleClearAll}
                  >
                    Değiştir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Amount Selection - Always visible */}
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
              disabled={selectedItems.length === 0 || (!selectedAmount && !customAmount) || loading || (selectedAmount && selectedAmount * selectedItems.length > userBalance) || (customAmount && parseInt(customAmount) * selectedItems.length > userBalance)}
            >
              {loading ? 'Gönderiliyor...' : `Gönder ve Destekle${selectedItems.length > 1 ? ` (${selectedItems.length} öğe)` : ''}`}
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