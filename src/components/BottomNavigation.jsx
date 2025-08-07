import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/feed' },
    { icon: '🔍', label: 'Search', path: '/search' },
    { icon: '👤', label: 'Profile', path: '/profile' }
  ]

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => (
        <button 
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div className="nav-icon">{item.icon}</div>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNavigation 