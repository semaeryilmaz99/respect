import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUI, useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import searchService from '../api/searchService'
import BackButton from './common/BackButton'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toggleSidebar } = useUI()
  const { state } = useAppContext()
  const { user } = state
  
  const [userData, setUserData] = useState(null)
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ artists: [], songs: [], users: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  // Ref to track if we're clicking on search results
  const desktopSearchResultsRef = useRef(null)
  const mobileSearchResultsRef = useRef(null)
  const otherSearchResultsRef = useRef(null)
  
  const isFeedPage = location.pathname === '/feed'
  const isSongPage = location.pathname.startsWith('/song')
  const isUserPage = location.pathname.startsWith('/user') || location.pathname === '/profile'
  const isArtistPage = location.pathname.startsWith('/artist')
  const isSendRespectPage = location.pathname === '/send-respect'
  
  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        return
      }
      
      try {
        const profile = await userService.getProfile(user.id)
        setUserData(profile)
      } catch (error) {
        console.error('Error fetching user profile for header:', error)
        // Fallback to user data from context
        setUserData({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'kullanici',
          avatar_url: user.user_metadata?.avatar_url || '/assets/user/Image.png'
        })
      }
    }
    
    fetchUserProfile()
  }, [user])

  // Update userData when user context changes (e.g., after profile update)
  useEffect(() => {
    if (user && user.user_metadata) {
      setUserData(prevData => ({
        ...prevData,
        full_name: user.user_metadata.full_name || prevData?.full_name,
        username: user.user_metadata.username || prevData?.username,
        avatar_url: user.user_metadata.avatar_url || prevData?.avatar_url
      }))
      console.log('🔄 Header user data updated from context:', user.user_metadata)
    }
  }, [user?.user_metadata])

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
        setSearchResults({ artists: [], songs: [], users: [] })
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults({ artists: [], songs: [], users: [] })
      setShowSearchResults(false)
    }
  }

  // Handle search result item click
  const handleSearchItemClick = (item, type) => {
    console.log('🔍 Search item clicked:', { item, type })
    console.log('📍 Current location:', location.pathname)
    console.log('🎯 Navigation function:', typeof navigate)
    
    setSearchQuery('')
    setShowSearchResults(false)
    
    const targetPath = (() => {
      switch (type) {
        case 'artist':
          return `/artist/${item.id}`
        case 'song':
          return `/song/${item.id}`
        case 'user':
          return `/user/${item.id}`
        default:
          return null
      }
    })()
    
    console.log('🛣️ Target path:', targetPath)
    
    if (targetPath) {
      console.log('🚀 Attempting navigation to:', targetPath)
      try {
        navigate(targetPath)
        console.log('✅ Navigation successful')
      } catch (error) {
        console.error('❌ Navigation failed:', error)
      }
    } else {
      console.log('❓ Unknown type:', type)
    }
  }

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2 && (searchResults.artists.length > 0 || searchResults.songs.length > 0 || searchResults.users.length > 0)) {
      setShowSearchResults(true)
    }
  }

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside all search containers
      const searchContainers = [
        desktopSearchResultsRef.current,
        mobileSearchResultsRef.current,
        otherSearchResultsRef.current
      ]
      
      const isClickInsideSearch = searchContainers.some(container => 
        container && container.contains(event.target)
      )
      
      // Also check if click is on the search input itself
      const searchInputs = document.querySelectorAll('.search-input, .mobile-search-input')
      const isClickOnSearchInput = Array.from(searchInputs).some(input => 
        input && input.contains(event.target)
      )
      
      if (!isClickInsideSearch && !isClickOnSearchInput) {
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
      // Navigate to search results page or perform search
      setShowSearchResults(false)
      // You can implement a search results page here
    } else if (e.key === 'Escape') {
      setSearchQuery('')
      setShowSearchResults(false)
    }
  }
  
  return (
    <header className="header">
      <div className="header-content">
        {isSendRespectPage ? (
          <BackButton />
        ) : (
          <button className="menu-button" onClick={toggleSidebar}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}
        
        {/* Desktop'ta feed, song, user, artist ve send respect sayfasında arama motoru */}
        {isFeedPage || isSongPage || isUserPage || isArtistPage || isSendRespectPage ? (
          <>
            {/* Desktop'ta arama motoru buraya gelecek */}
            <div className="search-container desktop-search">
              <div className="search-bar">
                <span className="search-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="sanatçı, şarkı veya kullanıcı ara"
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
              {showSearchResults && (searchResults.artists.length > 0 || searchResults.songs.length > 0 || searchResults.users.length > 0) && (
                <div className="search-results" ref={desktopSearchResultsRef}>
                  {searchResults.artists.map((artist) => (
                    <div 
                      key={`artist-${artist.id}`} 
                      className="search-result-item"
                      onClick={(e) => {
                        console.log('🎯 Artist item clicked!', artist)
                        e.stopPropagation()
                        handleSearchItemClick(artist, 'artist')
                      }}
                      style={{ cursor: 'pointer' }}
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
                      onClick={(e) => {
                        console.log('🎵 Song item clicked!', song)
                        e.stopPropagation()
                        handleSearchItemClick(song, 'song')
                      }}
                      style={{ cursor: 'pointer' }}
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
                  {searchResults.users.map((user) => (
                    <div 
                      key={`user-${user.id}`} 
                      className="search-result-item"
                      onClick={(e) => {
                        console.log('👤 User item clicked!', user)
                        e.stopPropagation()
                        handleSearchItemClick(user, 'user')
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="result-avatar">
                        <img src={user.avatar_url || '/assets/user/Image.png'} alt={user.full_name || user.username} />
                      </div>
                      <div className="result-info">
                        <h4>{user.full_name || user.username}</h4>
                        <p>Kullanıcı • @{user.username} • {user.total_respect_sent || 0} Respect Gönderdi</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
        
        {/* Mobile'da feed, song, user, artist ve send respect sayfasında arama motoru */}
        {(isFeedPage || isSongPage || isUserPage || isArtistPage || isSendRespectPage) && (
          <div className="search-container mobile-search">
            <div className="mobile-search-input-wrapper">
              <div className="mobile-search-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="sanatçı, şarkı veya kullanıcı ara"
                className="mobile-search-input"
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
            {showSearchResults && (searchResults.artists.length > 0 || searchResults.songs.length > 0 || searchResults.users.length > 0) && (
              <div className="mobile-search-results" ref={mobileSearchResultsRef}>
                {searchResults.artists.map((artist) => (
                  <div 
                    key={`artist-${artist.id}`} 
                    className="mobile-search-result-item"
                    onClick={(e) => {
                      console.log('🎯 Mobile artist item clicked!', artist)
                      e.stopPropagation()
                      handleSearchItemClick(artist, 'artist')
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mobile-result-avatar">
                      <img src={artist.avatar_url || '/assets/artist/Image.png'} alt={artist.name} />
                    </div>
                    <div className="mobile-result-info">
                      <h4>{artist.name}</h4>
                      <p>Sanatçı • {artist.total_respect || 0} Respect</p>
                    </div>
                  </div>
                ))}
                {searchResults.songs.map((song) => (
                  <div 
                    key={`song-${song.id}`} 
                    className="mobile-search-result-item"
                    onClick={(e) => {
                      console.log('🎵 Mobile song item clicked!', song)
                      e.stopPropagation()
                      handleSearchItemClick(song, 'song')
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mobile-result-avatar">
                      <img src={song.cover_url || '/assets/song/Image.png'} alt={song.title} />
                    </div>
                    <div className="mobile-result-info">
                      <h4>{song.title}</h4>
                      <p>Şarkı • {song.artists?.name || 'Bilinmeyen Sanatçı'} • {song.total_respect || 0} Respect</p>
                    </div>
                  </div>
                ))}
                {searchResults.users.map((user) => (
                  <div 
                    key={`user-${user.id}`} 
                    className="mobile-search-result-item"
                    onClick={(e) => {
                      console.log('👤 Mobile user item clicked!', user)
                      e.stopPropagation()
                      handleSearchItemClick(user, 'user')
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mobile-result-avatar">
                      <img src={user.avatar_url || '/assets/user/Image.png'} alt={user.full_name || user.username} />
                    </div>
                    <div className="mobile-result-info">
                      <h4>{user.full_name || user.username}</h4>
                      <p>Kullanıcı • @{user.username} • {user.total_respect_sent || 0} Respect Gönderdi</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Diğer sayfalarda arama motoru */}
        {!isFeedPage && !isSongPage && !isUserPage && !isArtistPage && !isSendRespectPage && (
          <div className="search-container">
            <div className="search-bar">
              <span className="search-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="sanatçı, şarkı veya kullanıcı ara"
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
            {showSearchResults && (searchResults.artists.length > 0 || searchResults.songs.length > 0 || searchResults.users.length > 0) && (
              <div className="search-results" ref={otherSearchResultsRef}>
                {searchResults.artists.map((artist) => (
                  <div 
                    key={`artist-${artist.id}`} 
                    className="search-result-item"
                    onClick={(e) => {
                      console.log('🎯 Other artist item clicked!', artist)
                      e.stopPropagation()
                      handleSearchItemClick(artist, 'artist')
                    }}
                    style={{ cursor: 'pointer' }}
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
                    onClick={(e) => {
                      console.log('🎵 Other song item clicked!', song)
                      e.stopPropagation()
                      handleSearchItemClick(song, 'song')
                    }}
                    style={{ cursor: 'pointer' }}
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
                {searchResults.users.map((user) => (
                  <div 
                    key={`user-${user.id}`} 
                    className="search-result-item"
                    onClick={(e) => {
                      console.log('👤 Other user item clicked!', user)
                      e.stopPropagation()
                      handleSearchItemClick(user, 'user')
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="result-avatar">
                      <img src={user.avatar_url || '/assets/user/Image.png'} alt={user.full_name || user.username} />
                    </div>
                    <div className="result-info">
                      <h4>{user.full_name || user.username}</h4>
                      <p>Kullanıcı • @{user.username} • {user.total_respect_sent || 0} Respect Gönderdi</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <button className="user-avatar" onClick={() => navigate('/profile')}>
          <img 
            src={userData?.avatar_url || '/assets/user/Image.png'} 
            alt={userData?.full_name || 'Kullanıcı'} 
          />
        </button>
      </div>
    </header>
  )
}

export default Header 