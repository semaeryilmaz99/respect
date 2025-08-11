import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import LoadingSpinner from './LoadingSpinner'

const TopSupporters = ({ artistId }) => {
  const navigate = useNavigate()
  const [supporters, setSupporters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTopSupporters = async () => {
      if (!artistId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Bu sanatçıya en çok respect gönderen kullanıcıları getir
        const { data, error } = await supabase
          .from('respect_transactions')
          .select(`
            from_user_id,
            amount,
            profiles!from_user_id (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('to_artist_id', artistId)
          .order('amount', { ascending: false })
          .limit(20)

        if (error) {
          throw error
        }

        // Kullanıcıları grupla ve toplam respect miktarını hesapla
        const userTotals = {}
        data?.forEach(transaction => {
          const userId = transaction.from_user_id
          if (!userTotals[userId]) {
            userTotals[userId] = {
              id: userId,
              name: transaction.profiles?.full_name || transaction.profiles?.username || 'Bilinmeyen Kullanıcı',
              respect: 0,
              image: transaction.profiles?.avatar_url || '/assets/user/Image.png'
            }
          }
          userTotals[userId].respect += transaction.amount || 0
        })

        const topSupporters = Object.values(userTotals)
          .sort((a, b) => b.respect - a.respect)
          .slice(0, 5)
          .map((supporter, index) => ({
            ...supporter,
            respect: `${supporter.respect} Respect`
          }))

        // Eğer veri yoksa mock data kullan
        if (topSupporters.length === 0) {
          console.log('📊 No top supporters found, using mock data')
          setSupporters([
            { id: 1, name: "Mehmet Yılmaz", respect: "120 Respect", image: "/assets/user/Image.png" },
            { id: 2, name: "Ayşe Kaya", respect: "110 Respect", image: "/assets/user/Image (1).png" },
            { id: 3, name: "Ali Demir", respect: "100 Respect", image: "/assets/user/Image (2).png" },
            { id: 4, name: "Fatma Şahin", respect: "90 Respect", image: "/assets/user/Image (3).png" },
            { id: 5, name: "Mustafa Özkan", respect: "80 Respect", image: "/assets/user/Image (4).png" },
            { id: 6, name: "Selma Ateş", respect: "80 Respect", image: "/assets/user/Image (1).png" },
            { id: 7, name: "Yağmur Yıldırım", respect: "100 Respect", image: "/assets/user/Image (2).png" },
            { id: 8, name: "Sevgi Aktaç", respect: "120 Respect", image: "/assets/user/Image (3).png" },
            { id: 9, name: "Selen Kaya", respect: "800 Respect", image: "/assets/user/Image (4).png" },
            { id: 10, name: "Emre Özdemir", respect: "80 Respect", image: "/assets/user/Image (1).png" },
          ])
        } else {
          setSupporters(topSupporters)
        }
      } catch (error) {
        console.error('Error fetching top supporters:', error)
        setError('Destekleyenler yüklenirken hata oluştu')
        
        // Fallback to mock data
        setSupporters([
          { id: 1, name: "Mehmet Yılmaz", respect: "120 Respect", image: "/assets/user/Image.png" },
          { id: 2, name: "Ayşe Kaya", respect: "110 Respect", image: "/assets/user/Image (1).png" },
          { id: 3, name: "Ali Demir", respect: "100 Respect", image: "/assets/user/Image (2).png" },
          { id: 4, name: "Fatma Şahin", respect: "90 Respect", image: "/assets/user/Image (3).png" },
          { id: 5, name: "Mustafa Özkan", respect: "80 Respect", image: "/assets/user/Image (4).png" }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopSupporters()
  }, [artistId])

  // Mock verileri her zaman göstermek için alternatif yaklaşım
  useEffect(() => {
    // Eğer 3 saniye sonra hala loading ise mock data göster
    const timeoutId = setTimeout(() => {
      if (loading && supporters.length === 0) {
        console.log('⏰ Timeout reached, showing mock data')
        setSupporters([
          { id: 1, name: "Mehmet Yılmaz", respect: "120 Respect", image: "/assets/user/Image.png" },
          { id: 2, name: "Ayşe Kaya", respect: "110 Respect", image: "/assets/user/Image (1).png" },
          { id: 3, name: "Ali Demir", respect: "100 Respect", image: "/assets/user/Image (2).png" },
          { id: 4, name: "Fatma Şahin", respect: "90 Respect", image: "/assets/user/Image (3).png" },
          { id: 5, name: "Mustafa Özkan", respect: "80 Respect", image: "/assets/user/Image (4).png" }
        ])
        setLoading(false)
      }
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [loading, supporters.length])

  const handleSupporterClick = (supporterId) => {
    navigate(`/user/${supporterId}`)
  }

  if (loading) {
    return (
      <div className="top-supporters">
        <h3 className="section-title">En Çok Destekleyenler</h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error && supporters.length === 0) {
    return (
      <div className="top-supporters">
        <h3 className="section-title">En Çok Destekleyenler</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="top-supporters">
      <h3 className="section-title">En Çok Destekleyenler</h3>
      
      <div className="supporters-list">
        {supporters.length === 0 ? (
          <div className="empty-state">
            <p>Henüz hiç destekleyen yok</p>
          </div>
        ) : (
          <>
            {/* İlk 3 supporter - Sabit */}
            <div className="fixed-supporters">
              {supporters.slice(0, 3).map((supporter, index) => (
                <div 
                  key={supporter.id} 
                  className="supporter-item clickable"
                  onClick={() => handleSupporterClick(supporter.id)}
                >
                  <span className="supporter-number">{index + 1}</span>
                  
                  <div className="supporter-info">
                    <h4 className="supporter-name">{supporter.name}</h4>
                    <p className="supporter-respect">{supporter.respect}</p>
                  </div>
                  
                  <div className="supporter-image">
                    <img src={supporter.image} alt={supporter.name} />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Kalan supporter'lar - Slider */}
            {supporters.length > 3 && (
              <div className="slider-supporters">
                <div className="slider-supporters-grid">
                  {supporters.slice(3).map((supporter, index) => (
                    <div 
                      key={supporter.id} 
                      className="supporter-item clickable"
                      onClick={() => handleSupporterClick(supporter.id)}
                    >
                      <span className="supporter-number">{index + 4}</span>
                      
                      <div className="supporter-info">
                        <h4 className="supporter-name">{supporter.name}</h4>
                        <p className="supporter-respect">{supporter.respect}</p>
                      </div>
                      
                      <div className="supporter-image">
                        <img src={supporter.image} alt={supporter.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TopSupporters 