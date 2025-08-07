import React from 'react'

const LoadingSpinner = ({ size = 'medium', text = 'Yükleniyor...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className="loading-spinner">
      <div className="spinner-container">
        <div className={`spinner ${sizeClasses[size]}`}>
          <div className="spinner-inner"></div>
        </div>
        {text && <p className="spinner-text">{text}</p>}
      </div>
      
      <style jsx>{`
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          width: 100%;
        }
        
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #f9dc38;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .spinner-inner {
          width: 100%;
          height: 100%;
        }
        
        .spinner-text {
          color: #666;
          font-size: 14px;
          margin: 0;
          text-align: center;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Full page loading */
        .loading-spinner.full-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          z-index: 9999;
          min-height: 100vh;
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner 