import React from 'react'

// Base skeleton component
const Skeleton = ({ width, height, className = '', borderRadius = '4px' }) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius
      }}
    >
      <style jsx>{`
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  )
}

// Feed Card Skeleton
export const FeedCardSkeleton = () => (
  <div className="feed-card-skeleton">
    <div className="card-label-skeleton">
      <Skeleton width="60px" height="12px" />
    </div>
    <div className="card-content-skeleton">
      <div className="card-top-skeleton">
        <div className="card-text-skeleton">
          <Skeleton width="80%" height="16px" className="mb-8" />
          <Skeleton width="60%" height="14px" />
        </div>
        <Skeleton width="90px" height="90px" borderRadius="8px" />
      </div>
    </div>
    <div className="card-button-skeleton">
      <Skeleton width="100%" height="44px" borderRadius="40px" />
    </div>
    
    <style jsx>{`
      .feed-card-skeleton {
        background-color: #ffffff;
        border-radius: 40px;
        box-shadow: 0 2px 12px rgba(27, 38, 46, 0.08);
        margin-bottom: 16px;
      }
      
      .card-label-skeleton {
        padding: 8px 16px;
        text-align: center;
      }
      
      .card-content-skeleton {
        padding: 20px;
        border-top: 2px solid #ffe8a0;
        border-bottom: 2px solid #ffe8a0;
      }
      
      .card-top-skeleton {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .card-text-skeleton {
        flex: 1;
      }
      
      .card-button-skeleton {
        padding: 0 20px 20px;
      }
      
      .mb-8 {
        margin-bottom: 8px;
      }
    `}</style>
  </div>
)

// Artist Profile Skeleton
export const ArtistProfileSkeleton = () => (
  <div className="artist-profile-skeleton">
    <Skeleton width="120px" height="120px" borderRadius="50%" className="avatar-skeleton" />
    <Skeleton width="200px" height="24px" className="name-skeleton" />
    <Skeleton width="120px" height="14px" className="respect-skeleton" />
    <Skeleton width="280px" height="60px" className="description-skeleton" />
    <Skeleton width="160px" height="40px" borderRadius="20px" className="button-skeleton" />
    
    <style jsx>{`
      .artist-profile-skeleton {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 16px;
        text-align: center;
      }
      
      .avatar-skeleton {
        margin-bottom: 16px;
        border: 3px solid #ffe8a0;
      }
      
      .name-skeleton {
        margin-bottom: 4px;
      }
      
      .respect-skeleton {
        margin-bottom: 16px;
      }
      
      .description-skeleton {
        margin-bottom: 20px;
      }
      
      .button-skeleton {
        margin-bottom: 0;
      }
    `}</style>
  </div>
)

// Supporters List Skeleton
export const SupportersListSkeleton = ({ count = 5 }) => (
  <div className="supporters-list-skeleton">
    {Array(count).fill(0).map((_, index) => (
      <div key={index} className="supporter-item-skeleton">
        <Skeleton width="24px" height="16px" className="number-skeleton" />
        <div className="supporter-info-skeleton">
          <Skeleton width="140px" height="16px" className="name-skeleton" />
          <Skeleton width="80px" height="12px" className="respect-skeleton" />
        </div>
        <Skeleton width="70px" height="70px" borderRadius="12px" />
      </div>
    ))}
    
    <style jsx>{`
      .supporters-list-skeleton {
        padding: 0 16px;
      }
      
      .supporter-item-skeleton {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .supporter-item-skeleton:last-child {
        border-bottom: none;
      }
      
      .number-skeleton {
        margin-right: 16px;
      }
      
      .supporter-info-skeleton {
        flex: 1;
        margin-right: 16px;
      }
      
      .name-skeleton {
        margin-bottom: 2px;
      }
      
      .respect-skeleton {
        margin: 0;
      }
    `}</style>
  </div>
)

// Songs List Skeleton
export const SongsListSkeleton = ({ count = 3 }) => (
  <div className="songs-list-skeleton">
    <div className="section-title-skeleton">
      <Skeleton width="120px" height="18px" />
    </div>
    <div className="songs-container-skeleton">
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="song-item-skeleton">
          <Skeleton width="48px" height="48px" borderRadius="8px" />
          <div className="song-info-skeleton">
            <Skeleton width="160px" height="16px" className="title-skeleton" />
            <Skeleton width="100px" height="12px" className="artist-skeleton" />
          </div>
        </div>
      ))}
    </div>
    
    <style jsx>{`
      .songs-list-skeleton {
        margin-bottom: 24px;
      }
      
      .section-title-skeleton {
        text-align: center;
        margin-bottom: 16px;
        padding: 0 16px;
      }
      
      .songs-container-skeleton {
        padding: 0 16px;
      }
      
      .song-item-skeleton {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .song-item-skeleton:last-child {
        border-bottom: none;
      }
      
      .song-info-skeleton {
        flex: 1;
      }
      
      .title-skeleton {
        margin-bottom: 2px;
      }
      
      .artist-skeleton {
        margin: 0;
      }
    `}</style>
  </div>
)

// Chat Messages Skeleton
export const ChatSkeleton = ({ count = 3 }) => (
  <div className="chat-skeleton">
    {Array(count).fill(0).map((_, index) => (
      <div key={index} className="chat-message-skeleton">
        <Skeleton width="44px" height="44px" borderRadius="50%" />
        <div className="message-content-skeleton">
          <Skeleton width="80px" height="13px" className="sender-skeleton" />
          <Skeleton 
            width={`${60 + Math.random() * 40}%`} 
            height="40px" 
            borderRadius="16px" 
            className="message-skeleton"
          />
        </div>
      </div>
    ))}
    
    <style jsx>{`
      .chat-skeleton {
        padding: 0;
        margin-bottom: 16px;
      }
      
      .chat-message-skeleton {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .message-content-skeleton {
        flex: 1;
      }
      
      .sender-skeleton {
        margin-bottom: 4px;
      }
      
      .message-skeleton {
        margin: 0;
      }
    `}</style>
  </div>
)

// User Stats Skeleton
export const UserStatsSkeleton = () => (
  <div className="user-stats-skeleton">
    {Array(3).fill(0).map((_, index) => (
      <div key={index} className="stat-card-skeleton">
        <Skeleton width="80px" height="12px" className="label-skeleton" />
        <Skeleton width="60px" height="24px" className="value-skeleton" />
        <Skeleton width="40px" height="12px" className="change-skeleton" />
      </div>
    ))}
    
    <style jsx>{`
      .user-stats-skeleton {
        display: flex;
        gap: 12px;
        padding: 0 16px;
        margin-bottom: 24px;
      }
      
      .stat-card-skeleton {
        flex: 1;
        background-color: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 16px;
      }
      
      .label-skeleton {
        margin-bottom: 8px;
      }
      
      .value-skeleton {
        margin-bottom: 4px;
      }
      
      .change-skeleton {
        margin: 0;
      }
    `}</style>
  </div>
)

// Page Loading Skeleton
export const PageLoadingSkeleton = () => (
  <div className="page-loading-skeleton">
    <ArtistProfileSkeleton />
    <SupportersListSkeleton count={3} />
    <SongsListSkeleton count={2} />
    
    <style jsx>{`
      .page-loading-skeleton {
        min-height: 100vh;
        background-color: #ffffff;
      }
    `}</style>
  </div>
)

export default Skeleton 