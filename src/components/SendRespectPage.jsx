import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { respectService } from '../api'
import searchService from '../api/searchService'
import artistService from '../api/artistService'
import songService from '../api/songService'
import { supabase } from '../config/supabase'
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
  
  // Recent supporters state
  const [recentSupporters, setRecentSupporters] = useState([])
  const [supportersLoading, setSupportersLoading] = useState(false)
  
  // Quick send popup state
  const [showQuickSendPopup, setShowQuickSendPopup] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [popupSearchQuery, setPopupSearchQuery] = useState('')
  const [popupSearchResults, setPopupSearchResults] = useState({ artists: [], songs: [] })
  const [popupSearchLoading, setPopupSearchLoading] = useState(false)
  
  // Ref for search results
  const searchResultsRef = useRef(null)



  const respectAmounts = [20, 50, 100, 200, 500, 1000]

  // Utility function to format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Az önce'
    
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)
    
    if (diffInSeconds < 60) return 'Az önce'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} gün önce`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} ay önce`
    return `${Math.floor(diffInSeconds / 31536000)} yıl önce`
  }

  // Initialize respect data from navigation state or URL params
  useEffect(() => {
    const state = location.state
    const params = new URLSearchParams(location.search)
    
    if (state) {
      // If we have data from navigation, set selected item
      if (state.isArtist && state.artistId) {
        setSelectedItem({
          id: state.artistId,
          name: state.artistName,
          avatar_url: state.songCover,
          type: 'artist'
        })
      } else if (state.songId) {
        setSelectedItem({
          id: state.songId,
          title: state.songTitle,
          cover_url: state.songCover,
          artists: { name: state.artistName },
          type: 'song'
        })
      }
    } else if (params.get('artistId') || params.get('songId')) {
      // Data from URL params - handle if needed
      // URL params handling can be implemented here if needed
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

  // Fetch recent supporters when selectedItem changes
  useEffect(() => {
    const fetchRecentSupporters = async () => {
      try {
        setSupportersLoading(true)
        let supporters = []

        if (selectedItem) {
          // Seçili item varsa, o item'ın son respect gönderenlerini getir
          if (selectedItem.type === 'artist') {
            const response = await artistService.getArtistRecentSupporters(selectedItem.id, 5)
            if (response?.data) {
              supporters = response.data.map(supporter => ({
                name: supporter.profiles?.full_name || supporter.profiles?.username || 'Bilinmeyen Kullanıcı',
                amount: supporter.amount,
                time: supporter.created_at,
                avatar: supporter.profiles?.avatar_url || '/assets/user/Image.png'
              }))
            }
          } else if (selectedItem.type === 'song') {
            const response = await songService.getSongRecentSupporters(selectedItem.id, 5)
            if (response?.data) {
              supporters = response.data.map(supporter => ({
                name: supporter.profiles?.full_name || supporter.profiles?.username || 'Bilinmeyen Kullanıcı',
                amount: supporter.amount,
                time: supporter.created_at,
                avatar: supporter.profiles?.avatar_url || '/assets/user/Image.png'
              }))
            }
          }
        } else {
          // Seçili item yoksa, genel son respect gönderenleri getir
          const response = await fetchGeneralRecentSupporters(5)
          if (response?.data) {
            supporters = response.data.map(supporter => ({
              name: supporter.profiles?.full_name || supporter.profiles?.username || 'Bilinmeyen Kullanıcı',
              amount: supporter.amount,
              time: supporter.created_at,
              avatar: supporter.profiles?.avatar_url || '/assets/user/Image.png',
              recipient: supporter.artists?.name || supporter.songs?.title || 'Bilinmeyen'
            }))
          }
        }

        setRecentSupporters(supporters)
      } catch (error) {
        console.error('Error fetching recent supporters:', error)
        setRecentSupporters([])
      } finally {
        setSupportersLoading(false)
      }
    }

    fetchRecentSupporters()
  }, [selectedItem])

  // Debug popup state changes
  useEffect(() => {
    console.log('🔍 Popup state changed:', {
      showQuickSendPopup,
      popupSearchQuery,
      popupSearchResults,
      selectedItems
    })
  }, [showQuickSendPopup, popupSearchQuery, popupSearchResults, selectedItems])

  // Genel son respect gönderenleri getiren fonksiyon
  const fetchGeneralRecentSupporters = async (limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('respect_transactions')
        .select(`
          amount,
          created_at,
          profiles!from_user_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          artists (
            id,
            name
          ),
          songs (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get general recent supporters error:', error)
      return { data: null, error }
    }
  }

  // Quick send popup fonksiyonları
  const handleQuickSendPopup = () => {
    console.log('🚀 Opening quick send popup')
    setShowQuickSendPopup(true)
    setSelectedItems([])
    setPopupSearchQuery('')
    setPopupSearchResults({ artists: [], songs: [] })
    console.log('✅ Popup state set to true')
  }

  const handlePopupSearch = async (query) => {
    console.log('🔍 handlePopupSearch called with query:', query)
    setPopupSearchQuery(query)
    
    if (query.trim().length < 2) {
      console.log('❌ Query too short, clearing results')
      setPopupSearchResults({ artists: [], songs: [] })
      return
    }

    try {
      console.log('📡 Starting search for:', query)
      setPopupSearchLoading(true)
      const results = await searchService.searchArtistsAndSongs(query, 10)
      console.log('✅ Search results received:', results)
      setPopupSearchResults(results)
    } catch (error) {
      console.error('❌ Popup search error:', error)
      setPopupSearchResults({ artists: [], songs: [] })
    } finally {
      setPopupSearchLoading(false)
    }
  }

  const handleAddItem = (item, type) => {
    const newItem = {
      id: item.id,
      name: type === 'artist' ? item.name : item.title,
      type: type,
      avatar: type === 'artist' ? item.avatar_url : item.cover_url,
      artistName: type === 'artist' ? item.name : item.artists?.name
    }
    
    // Eğer item zaten seçiliyse, kaldır
    if (selectedItems.find(selected => selected.id === item.id && selected.type === type)) {
      setSelectedItems(selectedItems.filter(selected => !(selected.id === item.id && selected.type === type)))
    } else {
      // Eğer seçili değilse, ekle
      setSelectedItems([...selectedItems, newItem])
    }
  }

  const handleRemoveItem = (itemId, type) => {
    setSelectedItems(selectedItems.filter(item => !(item.id === itemId && item.type === type)))
  }

  const handleSendMultipleRespect = async () => {
    if (selectedItems.length === 0) return

    try {
      setLoading(true)
      let successCount = 0
      let errorCount = 0

      for (const item of selectedItems) {
        try {
          if (item.type === 'artist') {
            const result = await respectService.sendRespectToArtist(item.id, 2000)
            if (result.error) {
              errorCount++
            } else {
              successCount++
            }
          } else if (item.type === 'song') {
            const result = await respectService.sendRespectToSong(item.id, 2000)
            if (result.error) {
              errorCount++
            } else {
              successCount++
            }
          }
        } catch (error) {
          console.error(`Error sending respect to ${item.name}:`, error)
          errorCount++
        }
      }

      // Sonuç mesajını göster
      if (errorCount === 0) {
        setSuccessMessage(`${successCount} item'a başarıyla 2000 respect gönderildi!`)
        setShowSuccessPopup(true)
        setShowQuickSendPopup(false)
        setSelectedItems([])
        
        // Balance'ı güncelle
        const { data } = await respectService.getRespectBalance()
        if (data) {
          setUserBalance(data.respect_balance || 0)
        }
      } else {
        setSuccessMessage(`${successCount} item'a respect gönderildi, ${errorCount} item'da hata oluştu.`)
        setShowSuccessPopup(true)
      }
    } catch (error) {
      console.error('Multiple respect send error:', error)
      setSuccessMessage('Respect gönderirken hata oluştu.')
      setShowSuccessPopup(true)
    } finally {
      setLoading(false)
    }
  }

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
    
    setSelectedItem(newItem)
    setSearchQuery(type === 'artist' ? item.name : item.title)
    setShowSearchResults(false)
    

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

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedItem(null)
    setSearchQuery('')
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
    // Check if an item is selected
    if (!selectedItem) {
      setError('Lütfen bir sanatçı veya şarkı seçin')
      return
    }

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
      
      // Send respect to selected item
      if (selectedItem.type === 'artist') {
        await respectService.sendRespectToArtist(selectedItem.id, amount)
        console.log(`${selectedItem.name} sanatçısına ${amount} respect başarıyla gönderildi`)
      } else {
        await respectService.sendRespectToSong(selectedItem.id, amount)
        console.log(`${selectedItem.title} şarkısına ${amount} respect başarıyla gönderildi`)
      }
      
      // Balance'ı güncelle
      setUserBalance(prev => prev - amount)
      
      // Başarı popup'ını göster
      const recipientName = selectedItem.type === 'artist' ? selectedItem.name : selectedItem.title
      setSuccessMessage(`${amount} Respect başarıyla ${recipientName}${selectedItem.type === 'artist' ? ' sanatçısına' : ' şarkısına'} gönderildi!`)
      setShowSuccessPopup(true)
      
      // 3 saniye sonra yönlendir
      setTimeout(() => {
        setShowSuccessPopup(false)
        // Navigate back to the appropriate page
        if (selectedItem.type === 'artist') {
          navigate(`/artist/${selectedItem.id}`)
        } else {
          navigate(`/song/${selectedItem.id}`)
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
      <Header />

      {/* Mobil için orta tarafta back button */}
      <div className="mobile-respect-header">
        <button className="mobile-back-button" onClick={() => navigate(-1)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="mobile-respect-title">Respect Gönder</h1>
      </div>

      <div className="respect-main-container">
        {/* Sol Bölüm - Sadece Masaüstünde Görünür */}
        <div className="respect-left-panel desktop-only">
          {/* Hızlı Gönderim Butonu */}
          <div className="quick-send-section">
            <h3 className="panel-title">Hızlı Gönderim</h3>
            <button 
              className="quick-send-button"
              onClick={() => handleQuickSendPopup()}
              disabled={loading}
            >
              2000 Respect Gönder
            </button>
          </div>





          {/* Son Respect Göndericiler */}
          <div className="recent-supporters-section">
            <h3 className="panel-title">
              {selectedItem ? 
                `Bu ${selectedItem.type === 'artist' ? 'sanatçıya' : 'şarkıya'} Son Respect Gönderenler` : 
                'Genel Son Respect Gönderenler'
              }
            </h3>
            <div className="recent-supporters-list">
              {supportersLoading ? (
                <div className="supporters-loading">
                  <LoadingSpinner />
                </div>
              ) : recentSupporters.length > 0 ? (
                recentSupporters.map((supporter, index) => (
                  <div key={index} className="supporter-item">
                    <div className="supporter-avatar">
                      <img src={supporter.avatar} alt={supporter.name} />
                    </div>
                    <div className="supporter-info">
                      <span className="supporter-name">{supporter.name}</span>
                      <span className="supporter-amount">{supporter.amount} Respect</span>
                      {supporter.recipient && (
                        <span className="supporter-recipient">→ {supporter.recipient}</span>
                      )}
                    </div>
                    <span className="supporter-time">
                      {supporter.time ? formatTimeAgo(supporter.time) : 'Az önce'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="no-supporters">
                  <p>
                    {selectedItem ? 
                      'Henüz respect gönderilmemiş' : 
                      'Bir sanatçı veya şarkı seçin'
                    }
                  </p>
                </div>
              )}
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

          {/* Selected Item Display */}
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
                <button 
                  className="change-selection-btn"
                  onClick={handleClearSelection}
                >
                  Değiştir
                </button>
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
              disabled={!selectedItem || (!selectedAmount && !customAmount) || loading || (selectedAmount && selectedAmount > userBalance) || (customAmount && parseInt(customAmount) > userBalance)}
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
      
      {/* Quick Send Popup */}
      {showQuickSendPopup && (
        <div className="quick-send-popup-overlay" onClick={() => setShowQuickSendPopup(false)}>
          <div className="quick-send-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Çoklu Respect Gönder</h2>
              <button 
                className="popup-close-btn"
                onClick={() => setShowQuickSendPopup(false)}
              >
                ×
              </button>
            </div>
            
            <div className="popup-content">
              <div className="search-section">
                <div className="search-input-wrapper">
                  <div className="search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Sanatçı veya şarkı ara..."
                    className="search-input"
                    value={popupSearchQuery}
                    onChange={(e) => {
                      console.log('🔍 Input onChange triggered:', e.target.value)
                      handlePopupSearch(e.target.value)
                    }}
                    onKeyUp={(e) => {
                      console.log('🔍 Input onKeyUp triggered:', e.target.value)
                    }}
                    onFocus={() => {
                      console.log('🔍 Input focused')
                    }}
                    onBlur={() => {
                      console.log('🔍 Input blurred')
                    }}
                    onClick={() => {
                      console.log('🔍 Input clicked')
                    }}
                  />
                  {popupSearchLoading && (
                    <div className="search-loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
                
                {/* Test button for debugging */}
                <button 
                  className="test-search-btn"
                  onClick={() => {
                    console.log('🧪 Test search button clicked')
                    handlePopupSearch('test')
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Test Search
                </button>
                
                {popupSearchResults.artists.length > 0 || popupSearchResults.songs.length > 0 ? (
                  <div className="search-results">
                    {popupSearchResults.artists.map((artist) => (
                      <div 
                        key={`popup-artist-${artist.id}`} 
                        className={`search-result-item ${selectedItems.find(item => item.id === artist.id && item.type === 'artist') ? 'selected' : ''}`}
                        onClick={() => handleAddItem(artist, 'artist')}
                      >
                        <div className="result-avatar">
                          <img src={artist.avatar_url || '/assets/artist/Image.png'} alt={artist.name} />
                        </div>
                        <div className="result-info">
                          <h4>{artist.name}</h4>
                          <p>Sanatçı • {artist.total_respect || 0} Respect</p>
                        </div>
                        <div className="add-button">
                          {selectedItems.find(item => item.id === artist.id && item.type === 'artist') ? '✓' : '+'}
                        </div>
                      </div>
                    ))}
                    {popupSearchResults.songs.map((song) => (
                      <div 
                        key={`popup-song-${song.id}`} 
                        className={`search-result-item ${selectedItems.find(item => item.id === song.id && item.type === 'song') ? 'selected' : ''}`}
                        onClick={() => handleAddItem(song, 'song')}
                      >
                        <div className="result-avatar">
                          <img src={song.cover_url || '/assets/song/Image.png'} alt={song.title} />
                        </div>
                        <div className="result-info">
                          <h4>{song.title}</h4>
                          <p>Şarkı • {song.artists?.name || 'Bilinmeyen Sanatçı'} • {song.total_respect || 0} Respect</p>
                        </div>
                        <div className="add-button">
                          {selectedItems.find(item => item.id === song.id && item.type === 'song') ? '✓' : '+'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : popupSearchQuery && !popupSearchLoading ? (
                  <div className="no-results">
                    <p>Sonuç bulunamadı</p>
                  </div>
                ) : null}
              </div>

              {selectedItems.length > 0 && (
                <div className="selected-items-section">
                  <h3>Seçilen Item'lar ({selectedItems.length})</h3>
                  <div className="selected-items-list">
                    {selectedItems.map((item, index) => (
                      <div key={`${item.type}-${item.id}`} className="selected-item">
                        <div className="selected-item-avatar">
                          <img src={item.avatar || '/assets/artist/Image.png'} alt={item.name} />
                        </div>
                        <div className="selected-item-info">
                          <span className="selected-item-name">{item.name}</span>
                          <span className="selected-item-type">{item.type === 'artist' ? 'Sanatçı' : 'Şarkı'}</span>
                        </div>
                        <button 
                          className="remove-item-btn"
                          onClick={() => handleRemoveItem(item.id, item.type)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="popup-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowQuickSendPopup(false)}
                >
                  İptal
                </button>
                <button 
                  className="send-multiple-btn"
                  onClick={handleSendMultipleRespect}
                  disabled={selectedItems.length === 0 || loading}
                >
                  {loading ? 'Gönderiliyor...' : `${selectedItems.length} Item'a 2000 Respect Gönder`}
                </button>
              </div>
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
        autoClose={false}
      />
    </div>
  )
}

export default SendRespectPage 