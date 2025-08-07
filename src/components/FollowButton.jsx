import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import followService from '../api/followService'
import feedService from '../api/feedService'

const FollowButton = ({ artistId, artistName, initialFollowersCount = 0, size = 'medium' }) => {
  const { state } = useAppContext()
  const { user } = state

  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check initial following status
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!user || !artistId) return
      
      try {
        const following = await followService.isFollowingArtist(artistId)
        setIsFollowing(following)
      } catch (error) {
        console.error('Error checking following status:', error)
      }
    }

    checkFollowingStatus()
  }, [user, artistId])

  // Get initial followers count
  useEffect(() => {
    const getFollowersCount = async () => {
      if (!artistId) return
      
      try {
        const count = await followService.getArtistFollowersCount(artistId)
        setFollowersCount(count)
      } catch (error) {
        console.error('Error getting followers count:', error)
      }
    }

    getFollowersCount()
  }, [artistId])

  const handleFollowToggle = async () => {
    if (!user) {
      setError('Takip etmek için giriş yapmalısınız')
      return
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(artistId)) {
      setError('Geçersiz sanatçı ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      await followService.toggleFollowArtist(artistId, isFollowing)
      
      // Update local state
      setIsFollowing(!isFollowing)
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1)
      
      // Feed item oluştur (sadece follow edildiğinde)
      if (!isFollowing) {
        try {
          console.log('🔄 Creating feed item for artist follow...')
          const feedResult = await feedService.createArtistFollowedFeedItem(artistId)
          console.log('📊 Feed item creation result:', feedResult)
          if (feedResult.error) {
            console.error('❌ Feed item creation failed:', feedResult.error)
          } else {
            console.log('✅ Feed item created successfully:', feedResult.data)
          }
        } catch (error) {
          console.error('❌ Feed item creation failed:', error)
        }
      }
      
      console.log(`✅ ${isFollowing ? 'Unfollowed' : 'Followed'} artist: ${artistId}`)
    } catch (error) {
      console.error('Follow toggle error:', error)
      setError(error.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Size variants
  const sizeClasses = {
    small: 'follow-btn-small',
    medium: 'follow-btn-medium',
    large: 'follow-btn-large'
  }

  const buttonClass = `follow-button ${sizeClasses[size]} ${isFollowing ? 'following' : ''} ${loading ? 'loading' : ''}`

  return (
    <div className="follow-button-container">
      <button
        className={buttonClass}
        onClick={handleFollowToggle}
        disabled={loading}
        title={isFollowing ? `${artistName} takibini bırak` : `${artistName} takip et`}
      >
        {loading ? (
          <span className="loading-spinner">⏳</span>
        ) : isFollowing ? (
          <>
            <span className="follow-icon">✓</span>
            <span className="follow-text">Takip Ediliyor</span>
          </>
        ) : (
          <>
            <span className="follow-icon">+</span>
            <span className="follow-text">Takip Et</span>
          </>
        )}
      </button>
      
      {followersCount > 0 && (
        <span className="followers-count">
          {followersCount.toLocaleString()} takipçi
        </span>
      )}
      
      {error && (
        <div className="follow-error">
          {error}
        </div>
      )}
    </div>
  )
}

export default FollowButton 