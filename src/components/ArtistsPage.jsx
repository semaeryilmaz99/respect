import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../config/supabase'
import Header from './Header'
import FollowButton from './FollowButton'
import LoadingSpinner from './LoadingSpinner'
import BackButton from './common/BackButton'

const ArtistsPage = () => {
  const navigate = useNavigate()
  const { state } = useAppContext()
  const { user: _user } = state
  
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .order('total_respect', { ascending: false })

        if (error) {
          throw error
        }

        setArtists(data || [])
      } catch (error) {
        console.error('Error fetching artists:', error)
        setError('Sanatçılar yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchArtists()
  }, [])

  const handleArtistClick = (artistId) => {
    navigate(`/artist/${artistId}`)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="artists-page">
        <Header />
        <div className="error-message">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="artists-page">
      <div className="page-header mobile-only">
        <BackButton />
      </div>
      <Header />
      
      <div className="artists-container">
        <div className="artists-header">
          <h1 className="artists-title">Sanatçılar</h1>
          <p className="artists-subtitle">Favori sanatçılarınızı keşfedin ve takip edin</p>
        </div>

        <div className="artists-grid">
          {artists && Array.isArray(artists) ? artists.map((artist) => (
            <div key={artist.id} className="artist-card">
              <div className="artist-image-container" onClick={() => handleArtistClick(artist.id)}>
                <img 
                  src={artist.avatar_url || '/assets/artist/Image.png'} 
                  alt={artist.name}
                  className="artist-image"
                />
              </div>
              
              <div className="artist-info">
                <h3 className="artist-name" onClick={() => handleArtistClick(artist.id)}>
                  {artist.name}
                </h3>
                <p className="artist-genre">{artist.genre}</p>
                <p className="artist-bio">{artist.bio}</p>
                
                <div className="artist-stats">
                  <span className="artist-respect">
                    {artist.total_respect?.toLocaleString() || 0} Respect
                  </span>
                  <span className="artist-followers">
                    {artist.followers_count?.toLocaleString() || 0} Takipçi
                  </span>
                </div>
                
                <div className="artist-actions">
                  <FollowButton artistId={artist.id} />
                </div>
              </div>
            </div>
          )) : (
            <div className="no-artists">
              <p>Henüz sanatçı bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArtistsPage 