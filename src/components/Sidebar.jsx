import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUI, useAppContext } from '../context/AppContext'
import authService from '../api/authService'
import userService from '../api/userService'

const Sidebar = () => {
  const navigate = useNavigate()
  const { sidebarOpen, closeSidebar } = useUI()
  const { state, actions } = useAppContext()
  const { user } = state
  
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const profile = await userService.getProfile(user.id)
        setUserData(profile)
        console.log('✅ Sidebar user data loaded:', profile)
      } catch (error) {
        console.error('Error fetching user profile for sidebar:', error)
        // Fallback to user data from context
        setUserData({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'kullanici',
          avatar_url: user.user_metadata?.avatar_url || '/assets/user/Image.png',
          respect_balance: user.user_metadata?.respect_balance || 1000
        })
      } finally {
        setLoading(false)
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
      console.log('🔄 Sidebar user data updated from context:', user.user_metadata)
    }
  }, [user?.user_metadata])

  const handleNavigation = (path) => {
    navigate(path)
    closeSidebar() // Sidebar'ı kapat
  }

  const handleLogout = async () => {
    try {
      console.log('🔐 Attempting logout with Supabase...')
      
      // Supabase logout
      await authService.logout()
      
      // Context logout
      actions.logout()
      
      console.log('✅ Logout successful')
      
      // Navigate to login
      navigate('/login')
      closeSidebar()
      
    } catch (error) {
      console.error('❌ Logout error:', error)
      
      // Force logout even if API fails
      actions.logout()
      navigate('/login')
      closeSidebar()
    }
  }

  const menuItems = [
    {
      label: 'Ana Sayfa',
      path: '/feed',
      action: () => handleNavigation('/feed')
    },
    {
      label: 'Sanatçılar',
      path: '/artists',
      action: () => handleNavigation('/artists')
    },
    {
      label: 'Şarkılar',
      path: '/songs',
      action: () => handleNavigation('/songs')
    },
    {
      label: 'Çalma Listeleri',
      path: '/playlists',
      action: () => handleNavigation('/playlists')
    },
    {
      label: 'Respect Gönder',
      path: '/send-respect',
      action: () => handleNavigation('/send-respect')
    },
    {
      label: 'Profil Ayarları',
      path: '/profile/settings',
      action: () => handleNavigation('/profile/settings')
    },
    {
      label: 'Çıkış',
      action: handleLogout
    }
  ]

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-close" onClick={closeSidebar}>
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="sidebar-nav-item"
                onClick={item.action}
              >
                <span className="nav-item-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {loading ? (
                <div className="avatar-loading">⏳</div>
              ) : (
                <img 
                  src={userData?.avatar_url || user?.user_metadata?.avatar_url || '/assets/user/Image.png'} 
                  alt={userData?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'} 
                  onLoad={() => console.log('✅ Sidebar avatar loaded:', userData?.avatar_url)}
                  onError={() => console.log('❌ Sidebar avatar failed to load:', userData?.avatar_url)}
                />
              )}
            </div>
            <div className="user-details">
              <p className="user-name">
                {loading ? 'Yükleniyor...' : (userData?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı')}
              </p>
              <p className="user-respect">
                {loading ? '...' : `${userData?.respect_balance?.toLocaleString() || user?.user_metadata?.respect_balance || '1,000'} Respect`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar 