import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import songService from '../api/songService'
import LoadingSpinner from './LoadingSpinner'

const SongTopSupporters = () => {
  const navigate = useNavigate()
  const { id: songId } = useParams()
  const [supporters, setSupporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Şarkıya en çok respect gönderen kullanıcıları getir
  useEffect(() => {
    const fetchTopSupporters = async () => {
      if (!songId) {
        console.log('❌ No song ID provided')
        setLoading(false)
        return
      }

      console.log('🔄 Fetching top supporters for song ID:', songId)

      try {
        setLoading(true)
        
        // Şarkıya en çok respect gönderen kullanıcıları getir
        const { data: topSupporters, error } = await songService.getSongTopSupporters(songId, 'all')

        if (error) {
          console.error('❌ Error fetching top supporters:', error)
          throw error
        }

        console.log('✅ Top supporters fetched:', topSupporters)
        setSupporters(topSupporters || [])
      } catch (error) {
        console.error('❌ Error fetching top supporters:', error)
        setError('En çok destekleyenler yüklenirken hata oluştu')
        
        // Fallback to mock data
        setSupporters([
          { 
            from_user_id: 1, 
            amount: 120, 
            profiles: { 
              id: 1, 
              username: 'ahmet_yilmaz', 
              full_name: 'Ahmet Yılmaz', 
              avatar_url: '/assets/user/Image.png' 
            } 
          },
          { 
            from_user_id: 2, 
            amount: 110, 
            profiles: { 
              id: 2, 
              username: 'zeynep_demir', 
              full_name: 'Zeynep Demir', 
              avatar_url: '/assets/user/Image (1).png' 
            } 
          },
          { 
            from_user_id: 3, 
            amount: 100, 
            profiles: { 
              id: 3, 
              username: 'mehmet_ozkan', 
              full_name: 'Mehmet Özkan', 
              avatar_url: '/assets/user/Image (2).png' 
            } 
          },
          { 
            from_user_id: 4, 
            amount: 90, 
            profiles: { 
              id: 4, 
              username: 'ayse_kaya', 
              full_name: 'Ayşe Kaya', 
              avatar_url: '/assets/user/Image (3).png' 
            } 
          },
          { 
            from_user_id: 5, 
            amount: 80, 
            profiles: { 
              id: 5, 
              username: 'mustafa_sahin', 
              full_name: 'Mustafa Şahin', 
              avatar_url: '/assets/user/Image (4).png' 
            } 
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopSupporters()
  }, [songId])

  const handleSupporterClick = (supporterId) => {
    navigate(`/user/${supporterId}`)
  }

  if (loading) {
    return (
      <div className="top-supporters">
        <h3 className="section-title">En Çok Destekleyenler</h3>
        <div className="supporters-list">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="top-supporters">
        <h3 className="section-title">En Çok Destekleyenler</h3>
        <div className="supporters-list">
          <p className="error-message">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="top-supporters">
      <h3 className="section-title">En Çok Destekleyenler</h3>
      
      <div className="supporters-list">
        {supporters.length > 0 ? (
          supporters.map((supporter, index) => (
            <div 
              key={supporter.from_user_id} 
              className="supporter-item clickable"
              onClick={() => handleSupporterClick(supporter.profiles?.id || supporter.from_user_id)}
            >
              <span className="supporter-number">{index + 1}</span>
              
              <div className="supporter-info">
                <h4 className="supporter-name">
                  {supporter.profiles?.full_name || supporter.profiles?.username || 'Bilinmeyen Kullanıcı'}
                </h4>
                <p className="supporter-respect">{supporter.amount} Respect</p>
              </div>
              
              <div className="supporter-image">
                <img 
                  src={supporter.profiles?.avatar_url || '/assets/user/Image.png'} 
                  alt={supporter.profiles?.full_name || 'Kullanıcı'} 
                />
              </div>
            </div>
          ))
        ) : (
          <p className="no-supporters-message">Henüz bu şarkıya respect gönderen kullanıcı bulunmuyor.</p>
        )}
      </div>
    </div>
  )
}

export default SongTopSupporters 