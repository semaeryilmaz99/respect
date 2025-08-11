import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../config/supabase'
import cardService from '../api/cardService'
import userService from '../api/userService'
import Header from './Header'
import BackButton from './common/BackButton'
import LoadingSpinner from './LoadingSpinner'

const ProfileSettingsPage = () => {
  const navigate = useNavigate()
  const { state, actions } = useAppContext()
  const { user } = state

  // Form states
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // Profile form data
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: ''
  })

  // Card form data
  const [cardData, setCardData] = useState({
    card_number: '',
    card_holder: '',
    expiry_month: '',
    expiry_year: '',
    cvv: ''
  })

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        full_name: user.full_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || ''
      })
      setAvatarPreview(user.avatar_url || '')
    }
  }, [user])

  // Handle profile data changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle card data changes
  const handleCardChange = (e) => {
    const { name, value } = e.target
    setCardData(prev => ({
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
        setMessage('Sadece JPG, PNG, GIF ve WebP formatları desteklenir.')
        setMessageType('error')
        return
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setMessage('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        setMessageType('error')
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Clear any previous error messages
      setMessage('')
      setMessageType('')
    }
  }

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (file) => {
    if (!file) return profileData.avatar_url

    try {
      console.log('📤 Uploading avatar:', file.name)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `${fileName}` // Remove avatars/ prefix as it's the bucket name

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

  // Save profile settings
  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      // Validate required fields
      if (!profileData.username || !profileData.full_name) {
        setMessage('Kullanıcı adı ve tam ad zorunludur.')
        setMessageType('error')
        return
      }

      // Check if username is changed and if it's already taken
      if (profileData.username !== user.user_metadata?.username) {
        const isAvailable = await userService.checkUsernameAvailability(profileData.username, user.id)
        
        if (!isAvailable) {
          setMessage('Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir kullanıcı adı seçin.')
          setMessageType('error')
          return
        }
      }

      let avatarUrl = profileData.avatar_url

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
            setMessage('Avatar yükleme servisi henüz hazır değil. Lütfen daha sonra tekrar deneyin veya avatar olmadan kaydedin.')
          } else {
            setMessage(error.message || 'Avatar yüklenirken hata oluştu.')
          }
          setMessageType('error')
          
          // Continue without avatar upload
          console.log('Continuing without avatar upload...')
        }
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          bio: profileData.bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setMessage('Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir kullanıcı adı seçin.')
          setMessageType('error')
          return
        }
        throw error
      }

      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: profileData.username,
          full_name: profileData.full_name,
          avatar_url: avatarUrl
        }
      })

      if (authError) {
        console.error('Auth update error:', authError)
      }

      // Update context with new user data
      actions.updateUser({
        ...profileData,
        avatar_url: avatarUrl,
        user_metadata: {
          ...user.user_metadata,
          username: profileData.username,
          full_name: profileData.full_name,
          avatar_url: avatarUrl
        }
      })

      // Mark profile as completed
      actions.completeProfile()

      setMessage('Profil başarıyla güncellendi! Yönlendiriliyorsunuz...')
      setMessageType('success')
      
      // Clear avatar file
      setAvatarFile(null)

      // Redirect to feed after 2 seconds
      setTimeout(() => {
        navigate('/feed')
      }, 2000)

    } catch (error) {
      console.error('Profile update error:', error)
      setMessage('Profil güncellenirken hata oluştu.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  // Save card information
  const handleSaveCard = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      // Validate card data
      if (!cardData.card_number || !cardData.card_holder || 
          !cardData.expiry_month || !cardData.expiry_year || !cardData.cvv) {
        setMessage('Lütfen tüm kart bilgilerini doldurun.')
        setMessageType('error')
        return
      }

      // Detect card type
      const cardType = cardService.detectCardType(cardData.card_number)

      // Save card data using cardService
      await cardService.addCard({
        ...cardData,
        card_type: cardType
      })

      setMessage('Kart bilgileri başarıyla kaydedildi!')
      setMessageType('success')
      
      // Clear card form
      setCardData({
        card_number: '',
        card_holder: '',
        expiry_month: '',
        expiry_year: '',
        cvv: ''
      })

    } catch (error) {
      console.error('Card save error:', error)
      setMessage('Kart bilgileri kaydedilirken hata oluştu.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      const confirmOnce = window.confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')
      if (!confirmOnce) return
      const confirmTwice = window.prompt('Onaylamak için "SİL" yazın:')
      if ((confirmTwice || '').trim().toUpperCase() !== 'SİL') return

      setSaving(true)
      setMessage('Hesabınız siliniyor...')
      setMessageType('info')

      await userService.deleteAccount()

      // Clear client session and redirect
      await supabase.auth.signOut()
      actions.logout()
      navigate('/signup')
    } catch (error) {
      console.error('Delete account error:', error)
      setMessage(error.message || 'Hesap silinirken bir hata oluştu.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return <LoadingSpinner />
  }

  return (
    <div className="profile-settings-page">
      <div className="page-header mobile-only">
        <BackButton to="/profile" />
      </div>
      <Header />
      
      <div className="profile-settings-content">
        <div className="settings-container">
          <h1 className="settings-title">Profil Ayarları</h1>
          
          {/* Message Display */}
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          {/* Profile Settings Section */}
          <div className="settings-section">
            <h2 className="section-title">Profil Bilgileri</h2>
            
            <div className="avatar-upload">
              <div className="avatar-preview">
                <img 
                  src={avatarPreview || '/assets/user/Image.png'} 
                  alt="Profile Avatar" 
                />
                <div className="avatar-overlay">
                  <label htmlFor="avatar-input" className="avatar-upload-btn">
                    📷
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username">Kullanıcı Adı</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                placeholder="Kullanıcı adınızı girin"
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Ad Soyad</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profileData.full_name}
                onChange={handleProfileChange}
                placeholder="Ad ve soyadınızı girin"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Hakkımda</label>
              <textarea
                id="bio"
                name="bio"
                value={profileData.bio}
                onChange={handleProfileChange}
                placeholder="Kendinizden bahsedin..."
                maxLength={200}
                rows={3}
              />
            </div>

            <button 
              className="save-btn primary"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Kaydediliyor...' : 'Profil Bilgilerini Kaydet'}
            </button>
            
            <button 
              className="save-btn complete-profile"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Tamamlanıyor...' : 'Profilimi Tamamla ve Devam Et'}
            </button>
          </div>

          {/* Card Settings Section */}
          <div className="settings-section">
            <h2 className="section-title">Kart Bilgileri</h2>
            <p className="section-description">
              Respect alacağınız zaman kullanılacak kart bilgilerinizi girin.
            </p>

            <div className="form-group">
              <label htmlFor="card_number">Kart Numarası</label>
              <input
                type="text"
                id="card_number"
                name="card_number"
                value={cardData.card_number}
                onChange={handleCardChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>

            <div className="form-group">
              <label htmlFor="card_holder">Kart Sahibi</label>
              <input
                type="text"
                id="card_holder"
                name="card_holder"
                value={cardData.card_holder}
                onChange={handleCardChange}
                placeholder="Ad Soyad"
                maxLength={50}
              />
            </div>

            <div className="card-details-row">
              <div className="form-group">
                <label htmlFor="expiry_month">Ay</label>
                <select
                  id="expiry_month"
                  name="expiry_month"
                  value={cardData.expiry_month}
                  onChange={handleCardChange}
                >
                  <option value="">Ay</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month.toString().padStart(2, '0')}>
                      {month.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="expiry_year">Yıl</label>
                <select
                  id="expiry_year"
                  name="expiry_year"
                  value={cardData.expiry_year}
                  onChange={handleCardChange}
                >
                  <option value="">Yıl</option>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={cardData.cvv}
                  onChange={handleCardChange}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>

            <button 
              className="save-btn secondary"
              onClick={handleSaveCard}
              disabled={saving}
            >
              {saving ? 'Kaydediliyor...' : 'Kart Bilgilerini Kaydet'}
            </button>
          </div>

          {/* Security Section */}
          <div className="settings-section">
            <h2 className="section-title">Güvenlik</h2>
            
            <div className="security-options">
              <button className="security-btn">
                🔒 Şifre Değiştir
              </button>
              <button className="security-btn">
                📱 İki Faktörlü Doğrulama
              </button>
              <button className="security-btn">
                📧 E-posta Bildirimleri
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section danger-zone">
            
            <div className="danger-options">
              <button className="danger-btn" onClick={handleDeleteAccount} disabled={saving}>
                🗑️ Hesabı Sil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettingsPage 