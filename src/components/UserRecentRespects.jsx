import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import LoadingSpinner from './LoadingSpinner'
import realtimeRespects from '../utils/realtimeRespects'

const UserRecentRespects = ({ userId }) => {
  const { state } = useAppContext()
  const { user: currentUser } = state
  
  // userId prop'u verilmişse onu kullan, yoksa mevcut kullanıcının ID'sini kullan
  const targetUserId = userId || currentUser?.id
  
  const [recentRespects, setRecentRespects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newRespectId, setNewRespectId] = useState(null)

  useEffect(() => {
    const fetchRecentRespects = async () => {
      if (!targetUserId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const respects = await userService.getRecentRespectTransactions(targetUserId, 8)
        setRecentRespects(respects)
      } catch (error) {
        console.error('Error fetching recent respects:', error)
        setError('Son respect gönderimleri yüklenirken hata oluştu')
        setRecentRespects([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentRespects()
  }, [targetUserId])

  // Real-time güncelleme için useEffect
  useEffect(() => {
    if (!targetUserId) return

    // Real-time subscription
    const unsubscribe = realtimeRespects.subscribeToRespects(targetUserId, (event) => {
      console.log('🔄 Real-time respect event:', event)
      
      if (event.type === 'NEW_RESPECT') {
        // Yeni respect gönderimi - listenin başına ekle
        setRecentRespects(prev => {
          const newList = [event.transaction, ...prev.slice(0, 7)] // En fazla 8 item tut
          return newList
        })
        
        // Yeni respect için animasyon
        setNewRespectId(event.transaction.id)
        setTimeout(() => setNewRespectId(null), 3000) // 3 saniye sonra animasyonu kaldır
      } else if (event.type === 'UPDATED_RESPECT') {
        // Respect güncellendi
        setRecentRespects(prev => 
          prev.map(item => 
            item.id === event.transaction.id ? event.transaction : item
          )
        )
      } else if (event.type === 'DELETED_RESPECT') {
        // Respect silindi
        setRecentRespects(prev => 
          prev.filter(item => item.id !== event.transaction.id)
        )
      }
    })

    // Cleanup function
    return () => {
      unsubscribe()
    }
  }, [targetUserId])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Az önce'
    if (diffInHours < 24) return `${diffInHours} saat önce`
    if (diffInHours < 48) return 'Dün'
    return date.toLocaleDateString('tr-TR')
  }

  const getRecipientInfo = (transaction) => {
    // Artist'e gönderilen respect
    if (transaction.to_artist_id && transaction.artists) {
      return {
        name: transaction.artists.name,
        image: transaction.artists.avatar_url || "/assets/artist/Image.png",
        type: 'artist'
      }
    }
    
    // Şarkıya gönderilen respect
    if (transaction.song_id && transaction.songs) {
      return {
        name: transaction.songs.artists?.name || 'Bilinmeyen Sanatçı',
        image: transaction.songs.cover_url || "/assets/song/Image.png",
        type: 'song',
        songTitle: transaction.songs.title
      }
    }
    
    // Fallback
    return {
      name: 'Bilinmeyen',
      image: "/assets/artist/Image.png",
      type: 'unknown'
    }
  }

  if (loading) {
    return (
      <div className="user-recent-respects">
        <h3 className="section-title">Son Respect Gönderimleri</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error && recentRespects.length === 0) {
    return (
      <div className="user-recent-respects">
        <h3 className="section-title">Son Respect Gönderimleri</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="user-recent-respects">
      <h3 className="section-title">Son Respect Gönderimleri</h3>
      
      {recentRespects.length === 0 ? (
        <div className="empty-state">
          <p>Henüz hiç respect göndermemiş</p>
        </div>
      ) : (
        <div className="recent-respects-list">
          {recentRespects.map((transaction) => {
            const recipientInfo = getRecipientInfo(transaction)
            
            return (
              <div 
                key={transaction.id} 
                className={`recent-respect-item ${newRespectId === transaction.id ? 'new-respect' : ''}`}
              >
                <div className="recent-respect-image">
                  <img 
                    src={recipientInfo.image} 
                    alt={recipientInfo.name} 
                  />
                </div>
                <div className="recent-respect-info">
                  <h4 className="recent-respect-recipient">{recipientInfo.name}</h4>
                  {recipientInfo.songTitle && (
                    <p className="recent-respect-song">{recipientInfo.songTitle}</p>
                  )}
                  <p className="recent-respect-time">{formatDate(transaction.created_at)}</p>
                </div>
                <div className="recent-respect-amount">
                  <span className="respect-amount">+{transaction.amount}</span>
                  <span className="respect-label">Respect</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UserRecentRespects 