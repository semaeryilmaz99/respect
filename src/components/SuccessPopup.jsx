import React, { useEffect } from 'react'
import './SuccessPopup.css'

const SuccessPopup = ({ 
  isVisible, 
  onClose, 
  title, 
  message,
  autoClose = true,
  autoCloseDelay = 3000 
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose])

  if (!isVisible) return null

  return (
    <div className="success-popup-overlay" onClick={onClose}>
      <div className="success-popup" onClick={(e) => e.stopPropagation()}>
        <div className="success-popup-header">
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="success-popup-content">
          <h3 className="success-title">{title}</h3>
          <p className="success-message">{message}</p>
        </div>
        
        <div className="success-popup-actions">
          <button className="success-button" onClick={onClose}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessPopup 