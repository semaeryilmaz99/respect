import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import songService from '../api/songService'
import LoadingSpinner from './LoadingSpinner'

const SongRecentSupporters = () => {
  const navigate = useNavigate()
  const { id: songId } = useParams()
  const [recentSupporters, setRecentSupporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Şarkıya son respect gönderen kullanıcıları getir
  useEffect(() => {
    const fetchRecentSupporters = async () => {
      if (!songId) {
        console.log('❌ No song ID provided')
        setLoading(false)
        return
      }

      console.log('🔄 Fetching recent supporters for song ID:', songId)

      try {
        setLoading(true)
        
        // Şarkıya son respect gönderen kullanıcıları getir
        const { data: recentSupportersData, error } = await songService.getSongRecentSupporters(songId, 10)

        if (error) {
          console.error('❌ Error fetching recent supporters:', error)
          throw error
        }

        console.log('✅ Recent supporters fetched:', recentSupportersData)
        setRecentSupporters(recentSupportersData || [])
      } catch (error) {
        console.error('❌ Error fetching recent supporters:', error)
        setError('Son destekleyenler yüklenirken hata oluştu')
        
        // Fallback to mock data
        setRecentSupporters([
          { 
            from_user_id: 1, 
            amount: 10, 
            profiles: { 
              id: 1, 
              username: 'fatma_arslan', 
              full_name: 'Fatma Arslan', 
              avatar_url: '/assets/user/Image.png' 
            } 
          },
          { 
            from_user_id: 2, 
            amount: 8, 
            profiles: { 
              id: 2, 
              username: 'emre_koc', 
              full_name: 'Emre Koç', 
              avatar_url: '/assets/user/Image (1).png' 
            } 
          },
          { 
            from_user_id: 3, 
            amount: 6, 
            profiles: { 
              id: 3, 
              username: 'selin_guler', 
              full_name: 'Selin Güler', 
              avatar_url: '/assets/user/Image (2).png' 
            } 
          },
          { 
            from_user_id: 4, 
            amount: 4, 
            profiles: { 
              id: 4, 
              username: 'burak_ates', 
              full_name: 'Burak Ateş', 
              avatar_url: '/assets/user/Image (3).png' 
            } 
          },
          { 
            from_user_id: 5, 
            amount: 2, 
            profiles: { 
              id: 5, 
              username: 'elif_bulut', 
              full_name: 'Elif Bulut', 
              avatar_url: '/assets/user/Image (4).png' 
            } 
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSupporters()
  }, [songId])

  const handleSupporterClick = (supporterId) => {
    navigate(`/user/${supporterId}`)
  }

  if (loading) {
    return (
      <div className="recent-supporters">
        <h3 className="section-title">Son Destekleyenler</h3>
        <div className="recent-supporters-grid">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recent-supporters">
        <h3 className="section-title">Son Destekleyenler</h3>
        <div className="recent-supporters-grid">
          <p className="error-message">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recent-supporters">
      <h3 className="section-title">Son Destekleyenler</h3>
      
      <div className="recent-supporters-grid">
        {recentSupporters.length > 0 ? (
          recentSupporters.map((supporter) => (
            <div 
              key={supporter.from_user_id} 
              className="recent-supporter-item clickable"
              onClick={() => handleSupporterClick(supporter.profiles?.id || supporter.from_user_id)}
            >
              <div className="recent-supporter-image">
                <img 
                  src={supporter.profiles?.avatar_url || '/assets/user/Image.png'} 
                  alt={supporter.profiles?.full_name || 'Kullanıcı'} 
                />
              </div>
              <h4 className="recent-supporter-name">
                {supporter.profiles?.full_name || supporter.profiles?.username || 'Bilinmeyen Kullanıcı'}
              </h4>
              <p className="recent-supporter-respect">{supporter.amount} Respect</p>
            </div>
          ))
        ) : (
          <p className="no-supporters-message">Henüz bu şarkıya respect gönderen kullanıcı bulunmuyor.</p>
        )}
      </div>
    </div>
  )
}

export default SongRecentSupporters 