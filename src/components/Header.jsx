import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUI, useAppContext } from '../context/AppContext'
import userService from '../api/userService'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toggleSidebar } = useUI()
  const { state } = useAppContext()
  const { user } = state
  
  const [userData, setUserData] = useState(null)
  
  const isFeedPage = location.pathname === '/feed'
  const isSongPage = location.pathname.startsWith('/song')
  const isUserPage = location.pathname.startsWith('/user') || location.pathname === '/profile'
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
  
  return (
    <header className="header">
      <div className="header-content">
        <button className="menu-button" onClick={toggleSidebar}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        {/* Desktop'ta feed, song ve user sayfasında arama motoru, send respect sayfasında "Respect Gönder", diğerlerinde title */}
        {isFeedPage || isSongPage || isUserPage ? (
          <>
            {/* Mobile'da title görünecek, desktop'ta gizlenecek */}
            <h1 className="app-title mobile-only">Respect Müzik</h1>
            
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
                />
              </div>
            </div>
          </>
        ) : isSendRespectPage ? (
          <>
            {/* Mobile'da normal title */}
            <h1 className="app-title mobile-only">Respect Müzik</h1>
            {/* Desktop'ta "Respect Gönder" yazısı */}
            <h1 className="app-title desktop-only">Respect Gönder</h1>
          </>
        ) : (
        <h1 className="app-title">Respect Müzik</h1>
        )}
        
        <button className="user-avatar" onClick={() => navigate('/profile')}>
          <img 
            src={userData?.avatar_url || '/assets/user/Image.png'} 
            alt={userData?.full_name || 'Kullanıcı'} 
          />
        </button>
      </div>
      
      {/* Mobile'da feed, song ve user sayfasında arama motoru alt tarafta kalacak */}
      {(isFeedPage || isSongPage || isUserPage) && (
        <div className="search-container mobile-search">
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
            />
          </div>
        </div>
      )}
      
      {/* Send respect sayfasında arama motoru yok */}
      {/* Diğer sayfalarda arama motoru alt tarafta */}
      {!isFeedPage && !isSongPage && !isUserPage && !isSendRespectPage && (
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
          />
        </div>
      </div>
      )}
    </header>
  )
}

export default Header 