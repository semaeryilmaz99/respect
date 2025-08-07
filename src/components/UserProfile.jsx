import React from 'react'
import { useAppContext } from '../context/AppContext'

const UserProfile = ({ userData }) => {
  const { state } = useAppContext()
  const { user } = state
  
  // Use passed userData or fallback to context user
  const displayData = userData || {
    full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı',
    username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'kullanici',
    bio: 'Profil bilgileri yüklenemedi.',
    avatar_url: user?.user_metadata?.avatar_url || '/assets/user/Image.png'
  }
  
  return (
    <div className="user-profile">
      <div className="user-profile-image">
        <img src={displayData.avatar_url} alt={displayData.full_name} />
      </div>
      
      <div className="user-info">
        <h2 className="user-name">{displayData.full_name}</h2>
        <p className="user-handle">@{displayData.username}</p>
        
        <p className="user-bio">
          {displayData.bio}
        </p>
      </div>
    </div>
  )
}

export default UserProfile 