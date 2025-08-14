import React from 'react'

const LoadingSpinner = ({ size = 'medium', text = 'Yükleniyor...', fullPage = false }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className={`loading-spinner ${fullPage ? 'full-page' : ''}`}>
      <div className="spinner-container">
        <div className={`spinner ${sizeClasses[size]}`}>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-center"></div>
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
          position: relative;
        }
        
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          position: relative;
        }
        
        .spinner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .spinner-ring {
          position: absolute;
          border: 3px solid transparent;
          border-radius: 50%;
          animation: spin 2s linear infinite;
        }
        
        .spinner-ring:nth-child(1) {
          width: 100%;
          height: 100%;
          border-top: 3px solid #f9dc38;
          border-right: 3px solid rgba(249, 220, 56, 0.3);
          animation-delay: 0s;
        }
        
        .spinner-ring:nth-child(2) {
          width: 75%;
          height: 75%;
          border-top: 3px solid #f69f17;
          border-left: 3px solid rgba(246, 159, 23, 0.3);
          animation-delay: -0.5s;
          animation-direction: reverse;
        }
        
        .spinner-ring:nth-child(3) {
          width: 50%;
          height: 50%;
          border-top: 3px solid #f4d430;
          border-right: 3px solid rgba(244, 212, 48, 0.3);
          animation-delay: -1s;
        }
        
        .spinner-center {
          width: 25%;
          height: 25%;
          background: linear-gradient(135deg, #f9dc38 0%, #f69f17 100%);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(249, 220, 56, 0.5);
          animation: pulse 1.5s ease-in-out infinite alternate;
        }
        
        .spinner-text {
          color: #1b262e;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          text-align: center;
          background: linear-gradient(135deg, #f9dc38 0%, #f69f17 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 1px 2px rgba(246, 159, 23, 0.1);
          letter-spacing: 0.5px;
        }
        
        @keyframes spin {
          0% { 
            transform: rotate(0deg); 
          }
          100% { 
            transform: rotate(360deg); 
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(249, 220, 56, 0.5);
          }
          100% {
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(249, 220, 56, 0.8);
          }
        }
        
        /* Full page loading */
        .loading-spinner.full-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 245, 231, 0.95) 100%);
          backdrop-filter: blur(10px);
          z-index: 9999;
          min-height: 100vh;
        }
        
        .loading-spinner.full-page .spinner-container {
          transform: scale(1.2);
        }
        
        .loading-spinner.full-page .spinner-text {
          font-size: 16px;
          margin-top: 8px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .spinner-text {
            font-size: 13px;
          }
          
          .loading-spinner.full-page .spinner-container {
            transform: scale(1);
          }
          
          .loading-spinner.full-page .spinner-text {
            font-size: 14px;
          }
        }
        
        /* Hover effects for interactive feel */
        .spinner:hover .spinner-center {
          animation-duration: 0.8s;
        }
        
        /* Loading dots animation for text */
        .spinner-text::after {
          content: '';
          animation: loadingDots 1.5s infinite;
        }
        
        @keyframes loadingDots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner 