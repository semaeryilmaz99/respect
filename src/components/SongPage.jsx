import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../config/supabase'
import Header from './Header'
import SongInfo from './SongInfo'
import SongTopSupporters from './SongTopSupporters'
import SongRecentSupporters from './SongRecentSupporters'
import SongRealTimeChat from './SongRealTimeChat'
import MoreByArtist from './MoreByArtist'
import FavoriteButton from './FavoriteButton'

import LoadingSpinner from './LoadingSpinner'

const SongPage = () => {
  const navigate = useNavigate()
  const { id: songId } = useParams()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)

  // Şarkı verilerini Supabase'den fetch et
  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) {
        console.log('❌ No song ID provided')
        setLoading(false)
        return
      }

      console.log('🔄 Fetching song data for ID:', songId)

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('songs')
          .select(`
            *,
            artists (
              id,
              name,
              avatar_url
            )
          `)
          .eq('id', songId)
          .single()

        if (error) {
          console.error('❌ Error fetching song:', error)
          throw error
        }

        console.log('✅ Song data fetched:', data)
        setSong(data)
      } catch (error) {
        console.error('❌ Error fetching song:', error)
        // Fallback to mock data
        setSong({
          id: songId,
          title: 'Bilinmeyen Şarkı',
          artist_name: 'Bilinmeyen Sanatçı',
          cover_url: '/assets/song/Image.png',
          total_respect: 0,
          artist: {
            id: 'unknown',
            name: 'Bilinmeyen Sanatçı',
            avatar_url: '/assets/artist/Image.png'
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSong()
  }, [songId])

  const handleQuickRespect = (amount) => {
    if (!song) return
    
    navigate('/send-respect', {
      state: {
        songId: song.id,
        songTitle: song.title,
        artistName: song.artist?.name || song.artist_name,
        songCover: song.cover_url,
        currentRespect: song.total_respect?.toString() || '0',
        artistId: song.artist?.id,
        isArtist: false,
        preselectedAmount: amount
      }
    })
  }

  const handleFullRespect = () => {
    if (!song) return
    
    navigate('/send-respect', {
      state: {
        songId: song.id,
        songTitle: song.title,
        artistName: song.artist?.name || song.artist_name,
        songCover: song.cover_url,
        currentRespect: song.total_respect?.toString() || '0',
        artistId: song.artist?.id,
        isArtist: false
      }
    })
  }

  return (
    <div className="song-page">
      <Header />
      
      {/* Mobile Layout - Orijinal sıra */}
      <div className="song-content mobile-only">
        <SongInfo />
        <SongTopSupporters />
        <SongRecentSupporters />
        <SongRealTimeChat />
        <MoreByArtist />
      </div>

      {/* Desktop Layout */}
      <div className="desktop-only">
        {/* Song Info - Header'ın Altında */}
        <div className="desktop-song-info">
          <SongInfo />
        </div>

        {/* 2 Bölümlü Layout */}
        <div className="song-desktop-layout">
          {/* Sol: En Çok Respect Gönderelenler */}
          <div className="song-left-panel">
            <SongTopSupporters />
          </div>

          {/* Sağ: Sanatçıdan Diğer Şarkılar */}
          <div className="song-right-content">
            {/* Sanatçıdan Diğer Şarkılar */}
            <MoreByArtist />
          </div>

          {/* Chat (Fixed Positioned - diğerlerinin üstünde) */}
          <SongRealTimeChat />
        </div>

        {/* Desktop Fixed Respect Gönder - Sol Alt */}
        <div className="desktop-fixed-respect-send">
          <h3 className="respect-section-title">Respect Gönder</h3>
          <p className="respect-subtitle">Bu harika şarkıya desteğini göster</p>
          
          <div className="quick-respect-buttons">
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(50)}
            >
              50 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(100)}
            >
              100 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(250)}
            >
              250 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(500)}
            >
              500 Respect
            </button>
            <button 
              className="quick-respect-btn" 
              onClick={() => handleQuickRespect(1000)}
            >
              1000 Respect
            </button>
          </div>
          
          <button className="full-respect-button" onClick={handleFullRespect}>
            Respect Gönder
          </button>
        </div>
      </div>
    </div>
  )
}

export default SongPage 