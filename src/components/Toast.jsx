import React, { useEffect, useState } from 'react'
import { useNotifications } from '../context/AppContext'

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Individual Toast Component
const ToastItem = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 10)
    
    // Auto dismiss
    if (toast.duration !== 0) {
      const dismissTimer = setTimeout(() => {
        handleClose()
      }, toast.duration || 5000)
      
      return () => {
        clearTimeout(showTimer)
        clearTimeout(dismissTimer)
      }
    }
    
    return () => clearTimeout(showTimer)
  }, [toast.duration])

  const handleClose = () => {
    setIsRemoving(true)
    setTimeout(() => {
      onClose(toast.id)
    }, 300) // Animation duration
  }

  const getIcon = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return '✅'
      case TOAST_TYPES.ERROR:
        return '❌'
      case TOAST_TYPES.WARNING:
        return '⚠️'
      case TOAST_TYPES.INFO:
      default:
        return 'ℹ️'
    }
  }

  const getThemeClass = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return 'toast-success'
      case TOAST_TYPES.ERROR:
        return 'toast-error'
      case TOAST_TYPES.WARNING:
        return 'toast-warning'
      case TOAST_TYPES.INFO:
      default:
        return 'toast-info'
    }
  }

  return (
    <div 
      className={`toast-item ${getThemeClass()} ${isVisible ? 'toast-visible' : ''} ${isRemoving ? 'toast-removing' : ''}`}
      onClick={handleClose}
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
        ✕
      </button>
      
      <style jsx>{`
        .toast-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-left: 4px solid;
          cursor: pointer;
          transform: translateX(100%);
          opacity: 0;
          transition: all 0.3s ease;
          min-width: 300px;
          max-width: 400px;
        }
        
        .toast-visible {
          transform: translateX(0);
          opacity: 1;
        }
        
        .toast-removing {
          transform: translateX(100%);
          opacity: 0;
        }
        
        .toast-success {
          border-left-color: #22c55e;
        }
        
        .toast-error {
          border-left-color: #ef4444;
        }
        
        .toast-warning {
          border-left-color: #f59e0b;
        }
        
        .toast-info {
          border-left-color: #3b82f6;
        }
        
        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .toast-content {
          flex: 1;
        }
        
        .toast-title {
          font-weight: 600;
          font-size: 14px;
          color: #1b262e;
          margin-bottom: 4px;
        }
        
        .toast-message {
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }
        
        .toast-close {
          background: none;
          border: none;
          font-size: 16px;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color 0.2s ease;
        }
        
        .toast-close:hover {
          color: #666;
        }
        
        @media (max-width: 480px) {
          .toast-item {
            min-width: auto;
            max-width: none;
            margin: 0 16px 8px 16px;
          }
        }
      `}</style>
    </div>
  )
}

// Toast Container
const ToastContainer = () => {
  const { notifications, removeNotification } = useNotifications()

  // Filter only toast notifications
  const toasts = notifications.filter(n => n.type && Object.values(TOAST_TYPES).includes(n.type))

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onClose={removeNotification}
        />
      ))}
      
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
        }
        
        .toast-container > :global(.toast-item) {
          pointer-events: auto;
        }
        
        @media (max-width: 480px) {
          .toast-container {
            top: 20px;
            left: 0;
            right: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Toast Hook
export const useToast = () => {
  const { addNotification } = useNotifications()

  const showToast = (message, options = {}) => {
    const {
      type = TOAST_TYPES.INFO,
      title = null,
      duration = 5000,
      ...otherOptions
    } = options

    addNotification({
      type,
      title,
      message,
      duration,
      ...otherOptions
    })
  }

  // Convenience methods
  const success = (message, options = {}) => 
    showToast(message, { ...options, type: TOAST_TYPES.SUCCESS })
  
  const error = (message, options = {}) => 
    showToast(message, { ...options, type: TOAST_TYPES.ERROR })
  
  const warning = (message, options = {}) => 
    showToast(message, { ...options, type: TOAST_TYPES.WARNING })
  
  const info = (message, options = {}) => 
    showToast(message, { ...options, type: TOAST_TYPES.INFO })

  return {
    showToast,
    success,
    error,
    warning,
    info
  }
}

export default ToastContainer 