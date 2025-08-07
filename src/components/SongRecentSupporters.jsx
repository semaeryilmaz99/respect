import React from 'react'
import { useNavigate } from 'react-router-dom'

const SongRecentSupporters = () => {
  const navigate = useNavigate()
  const recentSupporters = [
      { id: 1, name: "Fatma Arslan", respect: "10 Respect", image: "/assets/user/Image.png" },
  { id: 2, name: "Emre Koç", respect: "8 Respect", image: "/assets/user/Image (1).png" },
  { id: 3, name: "Selin Güler", respect: "6 Respect", image: "/assets/user/Image (2).png" },
  { id: 4, name: "Burak Ateş", respect: "4 Respect", image: "/assets/user/Image (3).png" },
  { id: 5, name: "Elif Bulut", respect: "2 Respect", image: "/assets/user/Image (4).png" }
  ]

  const handleSupporterClick = (supporterId) => {
    navigate(`/user/${supporterId}`)
  }

  return (
    <div className="recent-supporters">
      <h3 className="section-title">Son Destekleyenler</h3>
      
      <div className="recent-supporters-grid">
        {recentSupporters.map((supporter) => (
          <div 
            key={supporter.id} 
            className="recent-supporter-item clickable"
            onClick={() => handleSupporterClick(supporter.id)}
          >
            <div className="recent-supporter-image">
              <img src={supporter.image} alt={supporter.name} />
            </div>
            <h4 className="recent-supporter-name">{supporter.name}</h4>
            <p className="recent-supporter-respect">{supporter.respect}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SongRecentSupporters 