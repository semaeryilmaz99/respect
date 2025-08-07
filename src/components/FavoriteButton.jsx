import React, { useState, useEffect } from 'react'
import { favoriteService } from '../api/favoriteService'
import feedService from '../api/feedService'

const FavoriteButton = ({ 
  songId, 
  initialFavoritesCount = 0,
  size = 'medium', // 'small', 'medium', 'large'
  className = ''
}) => {
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // Check initial favorite status and get favorites count
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!songId || !uuidRegex.test(songId)) {
        setError('Geçersiz şarkı ID')
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Check if user has favorited this song
        const { data: isFavorited, error: favoriteError } = await favoriteService.isSongFavorited(songId)
        if (favoriteError) {
          console.error('Error checking favorite status:', favoriteError)
          return
        }
        setIsFavorited(isFavorited)

        // Get current favorites count
        const { data: count, error: countError } = await favoriteService.getSongFavoritesCount(songId)
        if (countError) {
          console.error('Error getting favorites count:', countError)
          // Hata olsa bile varsayılan değeri kullan
          setFavoritesCount(initialFavoritesCount)
          return
        }
        setFavoritesCount(count)

        console.log(`✅ Favorite status loaded for song ${songId}:`, { isFavorited, count })
      } catch (error) {
        console.error('Error in checkFavoriteStatus:', error)
        setError('Favori durumu yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    checkFavoriteStatus()
  }, [songId])

  const handleFavoriteToggle = async () => {
    if (!songId || !uuidRegex.test(songId)) {
      setError('Geçersiz şarkı ID')
      return
    }

    if (loading) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await favoriteService.toggleFavorite(songId)
      
      if (error) {
        setError(error.message || 'Favori işlemi başarısız')
        return
      }

      // Update local state
      setIsFavorited(data.favorited)
      setFavoritesCount(prev => data.favorited ? prev + 1 : prev - 1)

      // Feed item oluştur (sadece favoriye eklendiğinde)
      if (data.favorited) {
        try {
          await feedService.createSongFavoritedFeedItem(songId)
          console.log('✅ Feed item created for song favorite')
        } catch (error) {
          console.error('❌ Feed item creation failed:', error)
        }
      }

      console.log(`✅ Favorite toggled for song ${songId}:`, data)
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setError('Favori işlemi sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (loading) return 'Yükleniyor...'
    return isFavorited ? 'Favorilerden Çıkar' : 'Favorilere Ekle'
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'favorite-button-small'
      case 'large':
        return 'favorite-button-large'
      default:
        return 'favorite-button-medium'
    }
  }

  if (error) {
    return (
      <div className={`favorite-error ${getSizeClasses()}`}>
        <span>❌ {error}</span>
      </div>
    )
  }

  return (
    <div className={`favorite-button-container ${getSizeClasses()} ${className}`}>
      <button
        className={`favorite-button ${isFavorited ? 'favorited' : ''} ${loading ? 'loading' : ''}`}
        onClick={handleFavoriteToggle}
        disabled={loading}
        title={getButtonText()}
      >
        <span className="favorite-text">{getButtonText()}</span>
      </button>
      
      {favoritesCount > 0 && (
        <span className="favorites-count">
          {favoritesCount.toLocaleString()}
        </span>
      )}
    </div>
  )
}

export default FavoriteButton 