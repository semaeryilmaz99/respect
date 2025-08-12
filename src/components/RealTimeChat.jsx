import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatManager } from '../utils/realtimeChat'
import { supabase } from '../config/supabase'

const RealTimeChat = ({ roomId = 'general', roomType = 'artist' }) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const chatMessagesRef = useRef(null)
  
  console.log('💬 RealTimeChat props:', { roomId, roomType })

  // Chat room'a join ol ve mesajları yükle
  useEffect(() => {
    const loadChat = async () => {
      try {
        setLoading(true)
        
        // Current user'ı al
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // Mevcut mesajları yükle
        const { data: existingMessages, error } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profiles(username, full_name, avatar_url)
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('❌ Load messages error:', error)
        } else {
          console.log('✅ Chat messages loaded:', existingMessages)
          setMessages(existingMessages || [])
        }

        // Real-time chat'e join ol
        chatManager.joinChatRoom(roomId, roomType, (newMessage) => {
          console.log('💬 New message received in component:', newMessage)
          console.log('💬 Current messages:', messages)
          setMessages(prev => {
            console.log('💬 Updating messages from:', prev, 'to:', [...prev, newMessage])
            return [...prev, newMessage]
          })
        })

      } catch (error) {
        console.error('❌ Chat load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChat()

    // Cleanup
    return () => {
      chatManager.leaveChatRoom(roomId)
    }
  }, [roomId, roomType])

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  // Profil fotoğrafına tıklama fonksiyonu
  const handleAvatarClick = (userId) => {
    if (userId) {
      navigate(`/user/${userId}`)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) {
      console.log('❌ Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        hasUser: !!currentUser,
        message: newMessage,
        user: currentUser 
      })
      return
    }

    try {
      console.log('📤 Sending message:', { 
        message: newMessage, 
        roomId, 
        roomType, 
        userId: currentUser.id 
      })
      
      const result = await chatManager.sendMessage(roomId, roomType, newMessage.trim())
      console.log('✅ Message sent result:', result)
      setNewMessage('')
      
      // Mesaj gönderildikten sonra otomatik scroll
      setTimeout(scrollToBottom, 150)
      
      // Manuel olarak mesajları yenile (real-time çalışmazsa)
      setTimeout(async () => {
        const { data: updatedMessages, error } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profiles(username, full_name, avatar_url)
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })

        if (!error && updatedMessages) {
          console.log('🔄 Manually refreshed messages:', updatedMessages)
          setMessages(updatedMessages)
        }
      }, 500) // 500ms bekle
      
    } catch (error) {
      console.error('❌ Send message error:', error)
    }
  }

  // Otomatik scroll fonksiyonu - en son mesaja scroll et
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }

  // Mesajlar değiştiğinde otomatik scroll
  useEffect(() => {
    if (messages.length > 0 && isOpen) {
      // Kısa bir gecikme ile scroll et (DOM güncellemesi için)
      setTimeout(scrollToBottom, 100)
    }
  }, [messages, isOpen])

  // Chat açıldığında da en son mesaja scroll et
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(scrollToBottom, 200)
    }
  }, [isOpen, messages.length])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  // Debug: Test mesajı gönder
  const sendTestMessage = async () => {
    console.log('🧪 Sending test message...')
    
    try {
      const result = await chatManager.sendMessage(roomId, roomType, 'Test mesajı - ' + new Date().toLocaleTimeString())
      console.log('✅ Test message sent:', result)
    } catch (error) {
      console.error('❌ Test message failed:', error)
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
        {loading ? (
          <div className="chat-loading">
            <p>Mesajlar yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="chat-messages" ref={chatMessagesRef}>
              {messages && Array.isArray(messages) ? messages.map((message) => {
                const isOwn = currentUser?.id === message.user_id
                const senderName = message.profiles?.full_name || message.profiles?.username || 'Anonim'
                const avatar = message.profiles?.avatar_url || '/assets/user/Image.png'
                
                return (
                  <div key={message.id} className={`chat-message ${isOwn ? 'own-message' : 'other-message'}`}>
                    <div 
                      className="message-avatar clickable"
                      onClick={() => handleAvatarClick(message.user_id)}
                      title={`${senderName} profilini görüntüle`}
                    >
                      <img src={avatar} alt={senderName} />
                    </div>
                    
                    <div className="message-content">
                      <div className="message-sender">{senderName}</div>
                      <div className="message-text">{message.message}</div>
                      <div className="message-time">
                        {new Date(message.created_at).toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div className="no-messages">
                  <p>Henüz mesaj yok</p>
                </div>
              )}
            </div>
            
            <div className="chat-input-container">
              <div className="chat-input-avatar">
                <img 
                  src={currentUser?.user_metadata?.avatar_url || '/assets/user/Image.png'} 
                  alt={currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Kullanıcı'} 
                />
              </div>
              <input 
                type="text" 
                placeholder="Mesajını yaz..."
                className="chat-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!currentUser}
              />
              <button 
                className="send-button"
                onClick={sendMessage}
                disabled={!newMessage.trim() || !currentUser}
              >
                Gönder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RealTimeChat 