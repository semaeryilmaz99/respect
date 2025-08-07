import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import FollowButton from './FollowButton'
import LoadingSpinner from './LoadingSpinner'

const ArtistProfile = ({ artistId }) => {
  const navigate = useNavigate()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Artist verilerini fetch et
  useEffect(() => {
    const fetchArtist = async () => {
      if (!artistId) {
        console.log('❌ No artist ID provided')
        setLoading(false)
        return
      }

      console.log('🔄 Fetching artist data for ID:', artistId)

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single()

        if (error) {
          console.error('❌ Error fetching artist:', error)
          throw error
        }

        console.log('✅ Artist data fetched:', data)
        setArtist(data)
      } catch (error) {
        console.error('❌ Error fetching artist:', error)
        setError('Sanatçı bilgileri yüklenirken hata oluştu')
        
        // Fallback to mock data
        setArtist({
          id: artistId,
          name: 'Bilinmeyen Sanatçı',
          avatar_url: '/assets/artist/Image.png',
          total_respect: 0,
          followers_count: 0,
          bio: 'Sanatçı bilgileri yüklenemedi.'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchArtist()
  }, [artistId])

  const handleSendRespect = () => {
    if (!artist) return
    
    // Artist bilgilerini SendRespectPage'e gönder
    navigate('/send-respect', {
      state: {
        artistId: artist.id,
        artistName: artist.name,
        songTitle: 'Artist Respect', // Artist için genel başlık
        songCover: artist.avatar_url,
        currentRespect: artist.total_respect?.toString() || '0',
        isArtist: true // Artist'e respect gönderildiğini belirtmek için
      }
    })
  }

  if (loading) {
    return (
      <div className="artist-profile">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !artist) {
    return (
      <div className="artist-profile">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="artist-profile">
      <div className="artist-profile-image">
        <img 
          src={artist?.avatar_url || '/assets/artist/Image.png'} 
          alt={artist?.name || 'Sanatçı'} 
        />
      </div>
      
      <div className="artist-info">
        <h2 className="artist-name">{artist?.name || 'Bilinmeyen Sanatçı'}</h2>
        <p className="artist-respect">
          {artist?.total_respect?.toLocaleString() || '0'} Respect
        </p>
        
        <p className="artist-description">
          {artist?.bio || 'Sanatçı hakkında bilgi bulunmuyor.'}
        </p>
        
        <div className="artist-buttons">
          <button className="send-respect-button" onClick={handleSendRespect}>
            Respect Gönder
          </button>
          
          <FollowButton 
            artistId={artist?.id || artistId} 
            artistName={artist?.name || 'Sanatçı'}
            initialFollowersCount={artist?.followers_count || 0}
            size="medium"
          />
        </div>
      </div>
    </div>
  )
}

export default ArtistProfile 