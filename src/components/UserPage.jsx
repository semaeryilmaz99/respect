import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import { supabase } from '../config/supabase'
import Header from './Header'
import UserProfile from './UserProfile'
import UserStats from './UserStats'
import UserTopArtists from './UserTopArtists'
import UserTopSongs from './UserTopSongs'
import UserFollowedArtists from './UserFollowedArtists'
import UserFavoritedSongs from './UserFavoritedSongs'
import UserRecentRespects from './UserRecentRespects'
import BackButton from './common/BackButton'
import LoadingSpinner from './LoadingSpinner'

const UserPage = () => {
  const navigate = useNavigate()
  const { id: targetUserId } = useParams() // URL'den user ID'sini al
  const { state, actions } = useAppContext()
  const { user: currentUser } = state
  
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditProfilePopup, setShowEditProfilePopup] = useState(false)
  const [showSendRespectPopup, setShowSendRespectPopup] = useState(false)
  
  // Edit Profile Popup States
  const [editProfileData, setEditProfileData] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: ''
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileMessageType, setProfileMessageType] = useState('')
  
  // Görüntülenen kullanıcının ID'si (URL'den gelen veya mevcut kullanıcı)
  const displayUserId = targetUserId || currentUser?.id
  
  // Mevcut kullanıcının kendi profilini görüntüleyip görüntülemediği
  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id
  
  const handleEditProfile = () => {
    // Initialize form data with current user data
    setEditProfileData({
      username: userData?.username || currentUser?.user_metadata?.username || '',
      full_name: userData?.full_name || currentUser?.user_metadata?.full_name || '',
      bio: userData?.bio || '',
      avatar_url: userData?.avatar_url || currentUser?.user_metadata?.avatar_url || ''
    })
    setAvatarPreview(userData?.avatar_url || currentUser?.user_metadata?.avatar_url || '')
    setAvatarFile(null)
    setProfileMessage('')
    setProfileMessageType('')
    setShowEditProfilePopup(true)
  }

  const handleMobileEditProfile = () => {
    navigate('/profile/settings')
  }

  const handleCloseEditProfile = () => {
    setShowEditProfilePopup(false)
    setEditProfileData({
      username: '',
      full_name: '',
      bio: '',
      avatar_url: ''
    })
    setAvatarFile(null)
    setAvatarPreview('')
    setProfileMessage('')
    setProfileMessageType('')
  }

  // Handle profile form changes
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target
    setEditProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setProfileMessage('Sadece JPG, PNG, GIF ve WebP formatları desteklenir.')
        setProfileMessageType('error')
        return
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setProfileMessage('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        setProfileMessageType('error')
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Clear any previous error messages
      setProfileMessage('')
      setProfileMessageType('')
    }
  }

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (file) => {
    if (!file) return editProfileData.avatar_url

    try {
      console.log('📤 Uploading avatar:', file.name)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}.${fileExt}`
      const filePath = `${fileName}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('❌ Avatar upload error:', error)
        if (error.message.includes('Bucket not found')) {
          throw new Error('Avatar yükleme servisi henüz hazır değil. Lütfen daha sonra tekrar deneyin.')
        }
        throw error
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('✅ Avatar uploaded successfully:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('❌ Avatar upload failed:', error)
      throw error
    }
  }

  // Save profile settings from popup
  const handleSaveProfileFromPopup = async () => {
    setSavingProfile(true)
    setProfileMessage('')
    
    try {
      // Validate required fields
      if (!editProfileData.username || !editProfileData.full_name) {
        setProfileMessage('Kullanıcı adı ve tam ad zorunludur.')
        setProfileMessageType('error')
        return
      }

      // Check if username is changed and if it's already taken
      if (editProfileData.username !== userData?.username) {
        const isAvailable = await userService.checkUsernameAvailability(editProfileData.username, currentUser.id)
        
        if (!isAvailable) {
          setProfileMessage('Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir kullanıcı adı seçin.')
          setProfileMessageType('error')
          return
        }
      }

      let avatarUrl = editProfileData.avatar_url

      // Upload new avatar if selected
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(avatarFile)
        } catch (error) {
          console.error('Avatar upload failed:', error)
          
          // Check if it's a storage policy error
          if (error.message.includes('Bucket not found') || 
              error.message.includes('permission') ||
              error.message.includes('policy')) {
            setProfileMessage('Avatar yükleme servisi henüz hazır değil. Lütfen daha sonra tekrar deneyin veya avatar olmadan kaydedin.')
          } else {
            setProfileMessage(error.message || 'Avatar yüklenirken hata oluştu.')
          }
          setProfileMessageType('error')
          
          // Continue without avatar upload
          console.log('Continuing without avatar upload...')
        }
      }

      // Update profile in database
      await userService.updateProfile(currentUser.id, {
        username: editProfileData.username,
        full_name: editProfileData.full_name,
        bio: editProfileData.bio,
        avatar_url: avatarUrl
      })

      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: editProfileData.username,
          full_name: editProfileData.full_name,
          avatar_url: avatarUrl
        }
      })

      if (authError) {
        console.error('Auth update error:', authError)
      }

      // Update context with new user data
      actions.updateUser({
        ...editProfileData,
        avatar_url: avatarUrl,
        user_metadata: {
          ...currentUser.user_metadata,
          username: editProfileData.username,
          full_name: editProfileData.full_name,
          avatar_url: avatarUrl
        }
      })

      // Update local user data
      setUserData(prev => ({
        ...prev,
        username: editProfileData.username,
        full_name: editProfileData.full_name,
        bio: editProfileData.bio,
        avatar_url: avatarUrl
      }))

      setProfileMessage('Profil başarıyla güncellendi!')
      setProfileMessageType('success')
      
      // Clear avatar file
      setAvatarFile(null)

      // Close popup after 2 seconds
      setTimeout(() => {
        handleCloseEditProfile()
      }, 2000)

    } catch (error) {
      console.error('Profile update error:', error)
      setProfileMessage('Profil güncellenirken hata oluştu.')
      setProfileMessageType('error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSendRespect = () => {
    setShowSendRespectPopup(true)
  }

  const handleCloseSendRespect = () => {
    setShowSendRespectPopup(false)
  }
  
  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!displayUserId) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        console.log('👤 Fetching profile for user ID:', displayUserId)
        const profile = await userService.getProfile(displayUserId)
        setUserData(profile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setError('Profil bilgileri yüklenirken hata oluştu')
        
        // Fallback to user data from context (only if it's the current user's profile)
        if (isOwnProfile && currentUser) {
          setUserData({
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Kullanıcı',
            username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'kullanici',
            bio: 'Profil bilgileri yüklenemedi.',
            avatar_url: currentUser.user_metadata?.avatar_url || '/assets/user/Image.png',
            respect_balance: 1000
          })
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [displayUserId, isOwnProfile, currentUser])
  
  // Loading state
  if (loading) {
    return <LoadingSpinner />
  }
  
  // Error state
  if (error && !userData) {
    return (
      <div className="user-page">
        <Header />
        <div className="error-message">
          {error}
        </div>
      </div>
    )
  }
  
  // Use real user data or fallback to default
  const displayUserData = userData || {
    full_name: 'Alex Rodriguez',
    username: 'alexrodriguez',
    bio: 'Indie rock tutkunu. Sanatçıları desteklemeyi seven biri.',
    avatar_url: '/assets/user/Image.png',
    respect_balance: 2847
  }
  
  return (
    <div className="user-page">
      <div className="page-header mobile-only">
        <BackButton />
      </div>
      <Header />
      
      {/* Mobile Layout - Orijinal sıra */}
      <div className="user-content mobile-only">
        <UserProfile userData={displayUserData} userId={displayUserId} />
        
        {/* Mobile Profil Düzenleme Butonu */}
        {isOwnProfile && (
          <div className="mobile-edit-profile-section">
            <button className="mobile-edit-profile-btn" onClick={handleMobileEditProfile}>
              Profil Düzenle
            </button>
          </div>
        )}
        
        <UserStats userData={displayUserData} userId={displayUserId} />
        
        <UserRecentRespects userId={displayUserId} />
        <UserFollowedArtists userId={displayUserId} />
        <UserFavoritedSongs userId={displayUserId} />
        <UserTopArtists userId={displayUserId} />
        <UserTopSongs userId={displayUserId} />
      </div>

      {/* Desktop Layout */}
      <div className="desktop-only">
        {/* Desktop User Profile - Header'ın Altında */}
        <div className="desktop-user-profile">
          <div className="desktop-profile-content">
            <div className="desktop-profile-avatar">
              <img src={displayUserData.avatar_url} alt={displayUserData.full_name} />
            </div>
            <div className="desktop-profile-info">
              <h1 className="desktop-user-name">{displayUserData.full_name}</h1>
              <p className="desktop-user-handle">@{displayUserData.username}</p>
              <p className="desktop-user-bio">{displayUserData.bio}</p>
              
              <div className="desktop-profile-stats">
                <div className="desktop-profile-actions">
                  {isOwnProfile && (
                    <button className="desktop-edit-profile-btn" onClick={handleEditProfile}>
                      Profil Düzenle
                    </button>
                  )}
                  <button className="desktop-send-respect-btn" onClick={handleSendRespect}>
                    Respect Gönder
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Respect Stats */}
          <div className="desktop-respect-stats">
            <UserStats userId={displayUserId} userData={displayUserData} />
          </div>

          {/* Şu An Dinliyor - Profile İçinde */}
          <div className="profile-now-playing">
            <div className="now-playing-card">
              <div className="now-playing-avatar">
                <img src="/assets/user/Image (1).png" alt="İstakoz" />
              </div>
              <div className="now-playing-info">
                <h4 className="now-playing-artist">İstakoz</h4>
                <p className="now-playing-album">Gaye Su Akyol</p>
              </div>
              <button className="now-playing-listen-btn">
                Birlikte Dinle
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Unified User Sections Layout */}
        <div className="desktop-unified-user-sections">
          <div className="unified-sections-container">
            <div className="unified-section">
              <UserRecentRespects userId={displayUserId} />
            </div>
            <div className="unified-section">
              <UserFollowedArtists userId={displayUserId} />
            </div>
            <div className="unified-section">
              <UserFavoritedSongs userId={displayUserId} />
            </div>
            <div className="unified-section">
              <UserTopArtists userId={displayUserId} />
            </div>
            <div className="unified-section">
              <UserTopSongs userId={displayUserId} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Edit Profile Popup */}
      {showEditProfilePopup && (
        <div className="desktop-edit-profile-popup-overlay" onClick={handleCloseEditProfile}>
          <div className="desktop-edit-profile-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Profil Düzenle</h2>
              <button className="popup-close-btn" onClick={handleCloseEditProfile}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="popup-content">
              <div className="form-group">
                <label>Profil Fotoğrafı</label>
                <div className="avatar-upload">
                  <div className="avatar-preview">
                    <img src={avatarPreview || displayUserData.avatar_url} alt="Profil" />
                    <div className="avatar-overlay">
                      <label htmlFor="popup-avatar-input" className="avatar-upload-btn">
                        📷
                      </label>
                      <input
                        id="popup-avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>
                {profileMessage && (
                  <div className={`popup-message ${profileMessageType}`}>
                    {profileMessage}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Ad Soyad</label>
                <input type="text" name="full_name" value={editProfileData.full_name} onChange={handleProfileFormChange} />
              </div>
              <div className="form-group">
                <label>Kullanıcı Adı</label>
                <input type="text" name="username" value={editProfileData.username} onChange={handleProfileFormChange} />
              </div>
              <div className="form-group">
                <label>Hakkımda</label>
                <textarea name="bio" value={editProfileData.bio} onChange={handleProfileFormChange} rows="3"></textarea>
              </div>
              <div className="popup-actions">
                <button className="popup-cancel-btn" onClick={handleCloseEditProfile}>
                  İptal
                </button>
                <button className="popup-save-btn" onClick={handleSaveProfileFromPopup} disabled={savingProfile}>
                  {savingProfile ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Send Respect Popup */}
      {showSendRespectPopup && (
        <div className="desktop-send-respect-popup-overlay" onClick={handleCloseSendRespect}>
          <div className="desktop-send-respect-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Respect Gönder</h2>
              <button className="popup-close-btn" onClick={handleCloseSendRespect}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="popup-content">
              <div className="form-group">
                <label>Respect Göndermek İstediğiniz Sanatçı veya Şarkı</label>
                <div className="search-container">
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
                    />
                  </div>
                  <div className="search-results" style={{ display: 'none' }}>
                    <div className="search-result-item">
                      <div className="result-avatar">
                        <img src="/assets/artist/Image (1).png" alt="Gaye Su Akyol" />
                      </div>
                      <div className="result-info">
                        <h4>Gaye Su Akyol</h4>
                        <p>Sanatçı</p>
                      </div>
                    </div>
                    <div className="search-result-item">
                      <div className="result-avatar">
                        <img src="/assets/song/Image (1).png" alt="İstakoz" />
                      </div>
                      <div className="result-info">
                        <h4>İstakoz</h4>
                        <p>Gaye Su Akyol • Şarkı</p>
                      </div>
                    </div>
                    <div className="search-result-item">
                      <div className="result-avatar">
                        <img src="/assets/artist/Image (2).png" alt="Altın Gün" />
                      </div>
                      <div className="result-info">
                        <h4>Altın Gün</h4>
                        <p>Sanatçı</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Respect Miktarı</label>
                <div className="respect-amount-list">
                  <button className="respect-amount-item" data-amount="10">
                    <span className="amount-value">10</span>
                    <span className="amount-label">Respect</span>
                  </button>
                  <button className="respect-amount-item" data-amount="25">
                    <span className="amount-value">25</span>
                    <span className="amount-label">Respect</span>
                  </button>
                  <button className="respect-amount-item" data-amount="50">
                    <span className="amount-value">50</span>
                    <span className="amount-label">Respect</span>
                  </button>
                  <button className="respect-amount-item" data-amount="100">
                    <span className="amount-value">100</span>
                    <span className="amount-label">Respect</span>
                  </button>
                  <button className="respect-amount-item" data-amount="250">
                    <span className="amount-value">250</span>
                    <span className="amount-label">Respect</span>
                  </button>
                  <button className="respect-amount-item" data-amount="500">
                    <span className="amount-value">500</span>
                    <span className="amount-label">Respect</span>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Özel Miktar</label>
                <input type="number" placeholder="Miktar girin" min="1" />
              </div>
              <div className="form-group">
                <label>Mesaj (Opsiyonel)</label>
                <textarea placeholder="Respect ile birlikte göndermek istediğiniz mesaj..." rows="3"></textarea>
              </div>
              <div className="popup-actions">
                <button className="popup-cancel-btn" onClick={handleCloseSendRespect}>
                  İptal
                </button>
                <button className="popup-send-btn">
                  Respect Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserPage 