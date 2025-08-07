import React from 'react'
import { useNavigate } from 'react-router-dom'

const RecentSupporters = () => {
  const navigate = useNavigate()
  const recentSupporters = [
      { id: 1, name: "Cem Özdemir", respect: "500 Respect", image: "/assets/user/Image.png" },
  { id: 2, name: "Zeynep Arslan", respect: "450 Respect", image: "/assets/user/Image (1).png" },
  { id: 3, name: "Burak Ateş", respect: "400 Respect", image: "/assets/user/Image (2).png" },
  { id: 4, name: "Elif Koç", respect: "380 Respect", image: "/assets/user/Image (3).png" },
  { id: 5, name: "Murat Bulut", respect: "360 Respect", image: "/assets/user/Image (4).png" },
  { id: 6, name: "Sinem Güler", respect: "340 Respect", image: "/assets/user/Image.png" },
  { id: 7, name: "Emre Kılıç", respect: "320 Respect", image: "/assets/user/Image (1).png" },
  { id: 8, name: "Gizem Şen", respect: "300 Respect", image: "/assets/user/Image (2).png" }
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

export default RecentSupporters 