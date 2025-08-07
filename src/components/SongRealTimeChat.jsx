import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'

const SongRealTimeChat = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)
  const [userData, setUserData] = useState(null)
  const { state } = useAppContext()
  const { user } = state

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
        console.error('Error fetching user profile for song chat:', error)
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

  const chatMessages = [
    {
      id: 1,
      sender: "Emre Kaya",
      message: "Bu şarkı gerçekten harika! Çok etkileyici.",
      avatar: "/assets/user/Image.png",
      isOwn: false,
      userId: "emre-kaya-id" // Örnek user ID
    },
    {
      id: 2,
      sender: userData?.full_name || "Sen",
      message: "Kesinlikle katılıyorum, çok güçlü bir şarkı.",
      avatar: userData?.avatar_url || "/assets/user/Image.png",
      isOwn: true,
      userId: user?.id
    }
  ]

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  // Profil fotoğrafına tıklama fonksiyonu
  const handleAvatarClick = (userId) => {
    if (userId) {
      navigate(`/user/${userId}`)
    }
  }

  return (
    <div className={`real-time-chat ${isOpen ? 'open' : 'closed'}`}>
      <h3 className="section-title chat-toggle" onClick={toggleChat}>
        Canlı Sohbet
        <span className={`toggle-icon ${isOpen ? 'open' : 'closed'}`}>
          {isOpen ? '▼' : '▲'}
        </span>
      </h3>
      
      <div className="chat-content">
        <div className="chat-messages">
          {chatMessages.map((message) => (
            <div key={message.id} className={`chat-message ${message.isOwn ? 'own-message' : 'other-message'}`}>
              <div 
                className="message-avatar clickable"
                onClick={() => handleAvatarClick(message.userId)}
                title={`${message.sender} profilini görüntüle`}
              >
                <img src={message.avatar} alt={message.sender} />
              </div>
              
              <div className="message-content">
                <div className="message-sender">{message.sender}</div>
                <div className="message-text">{message.message}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="chat-input-container">
          <div className="chat-input-avatar">
            <img 
              src={userData?.avatar_url || '/assets/user/Image.png'} 
              alt={userData?.full_name || 'Kullanıcı'} 
            />
          </div>
          <input 
            type="text" 
            placeholder="Mesajını yaz..."
            className="chat-input"
          />
          <button className="send-button">Gönder</button>
        </div>
      </div>
    </div>
  )
}

export default SongRealTimeChat 