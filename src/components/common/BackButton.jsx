import React from 'react'
import { useNavigate } from 'react-router-dom'

const BackButton = ({ to, onClick, className = '', children, style = {} }) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <button 
      className={`back-button ${className}`}
      onClick={handleBack}
      style={style}
    >
      <span className="back-icon">←</span>
      <span className="back-text">{children || 'Geri'}</span>
    </button>
  )
}

export default BackButton 