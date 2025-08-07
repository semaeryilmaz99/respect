import React from 'react'
import { useRespectStats } from '../hooks/useRespectStats'
import LoadingSpinner from './LoadingSpinner'

const UserStats = ({ userId, userData }) => {
  // Use the real-time respect stats hook
  const { 
    stats, 
    isLoading, 
    error, 
    respectBalance, 
    totalRespectSent, 
    totalRespectReceived,
    totalRespectActivity 
  } = useRespectStats(userId)

  // Fallback to passed userData if no userId provided
  const displayData = userId ? stats : userData

  if (isLoading) {
    return (
      <div className="user-stats">
        <div className="stat-card">
          <LoadingSpinner size="small" />
        </div>
      </div>
    )
  }

  if (error) {
    console.error('UserStats error:', error)
    return (
      <div className="user-stats">
        <div className="stat-card error">
          <div className="stat-label">Hata</div>
          <div className="stat-value">Veri yüklenemedi</div>
        </div>
      </div>
    )
  }

  return (
    <div className="user-stats">
      {/* Respect Balance */}
      <div className="stat-card">
        <div className="stat-label">Respect Bakiyesi</div>
        <div className="stat-value">{displayData?.respect_balance?.toLocaleString() || '0'}</div>
        <div className="stat-description">Mevcut respect miktarınız</div>
      </div>
      
      {/* Total Respect Sent */}
      <div className="stat-card">
        <div className="stat-label">Gönderilen Respect</div>
        <div className="stat-value">{totalRespectSent?.toLocaleString() || '0'}</div>
        <div className="stat-description">Toplam gönderdiğiniz respect</div>
      </div>

      {/* Total Respect Received */}
      <div className="stat-card">
        <div className="stat-label">Alınan Respect</div>
        <div className="stat-value">{totalRespectReceived?.toLocaleString() || '0'}</div>
        <div className="stat-description">Toplam aldığınız respect</div>
      </div>

      {/* Total Respect Activity */}
      <div className="stat-card">
        <div className="stat-label">Toplam Aktivite</div>
        <div className="stat-value">{totalRespectActivity?.toLocaleString() || '0'}</div>
        <div className="stat-description">Genel respect aktiviteniz</div>
      </div>
    </div>
  )
}

export default UserStats 