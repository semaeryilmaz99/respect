import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import followService from '../api/followService'
import feedService from '../api/feedService'

const FollowButton = ({ 
  artistId, 
  artistName, 
  initialFollowersCount = 0, 
  size = 'medium',
  isFollowing: propIsFollowing = null, // Prop olarak gelen takip durumu
  onFollowChange = null // Takip durumu değiştiğinde çağrılacak callback
}) => {
  const { state } = useAppContext()
  const { user } = state

  const [isFollowing, setIsFollowing] = useState(propIsFollowing || false)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Prop'tan gelen takip durumunu izle
  useEffect(() => {
    if (propIsFollowing !== null) {
      console.log(`🎯 FollowButton prop güncellendi: ${artistName} -> ${propIsFollowing ? 'Takip ediliyor' : 'Takip edilmiyor'}`)
      setIsFollowing(propIsFollowing)
    }
  }, [propIsFollowing, artistName])

  // Eğer prop olarak takip durumu gelmiyorsa, manuel kontrol yap
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!user || !artistId || propIsFollowing !== null) return // Prop varsa kontrol etme
      
      try {
        console.log('🔍 Checking following status for artist:', artistId)
        const following = await followService.isFollowingArtist(artistId)
        console.log('📊 Following status:', following)
        setIsFollowing(following)
      } catch (error) {
        console.error('Error checking following status:', error)
        // Don't set state on error to prevent infinite loop
      }
    }

    checkFollowingStatus()
  }, [user?.id, artistId, propIsFollowing]) // propIsFollowing'i de dependency'ye ekle

  // Get initial followers count
  useEffect(() => {
    const getFollowersCount = async () => {
      if (!artistId) return
      
      try {
        const count = await followService.getArtistFollowersCount(artistId)
        setFollowersCount(count)
      } catch (error) {
        console.error('Error getting followers count:', error)
        // Don't set state on error to prevent infinite loop
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
      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1)
      
      // Callback'i çağır (eğer varsa)
      if (onFollowChange) {
        onFollowChange(artistId, newFollowingState)
      }
      
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

  // Debug için render durumunu logla
  console.log(`🎨 FollowButton render: ${artistName} -> isFollowing: ${isFollowing}, propIsFollowing: ${propIsFollowing}`)

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
      

      
      {error && (
        <div className="follow-error">
          {error}
        </div>
      )}
    </div>
  )
}

export default FollowButton 