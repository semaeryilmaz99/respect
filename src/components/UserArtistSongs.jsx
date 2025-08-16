import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import userService from '../api/userService'
import spotifyService from '../api/spotifyService'
import { supabase } from '../config/supabase'
import LoadingSpinner from './LoadingSpinner'

const UserArtistSongs = ({ userId }) => {
  const { state } = useAppContext()
  const { user: currentUser } = state
  
  // userId prop'u verilmişse onu kullan, yoksa mevcut kullanıcının ID'sini kullan
  const targetUserId = userId || currentUser?.id
  
  const [artistSongs, setArtistSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isArtist, setIsArtist] = useState(false)

  useEffect(() => {
    const fetchArtistData = async () => {
      console.log('🔍 UserArtistSongs: fetchArtistData başladı')
      console.log('🎯 targetUserId:', targetUserId)
      
      if (!targetUserId) {
        console.log('❌ targetUserId yok, çıkılıyor')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Önce kullanıcının sanatçı olup olmadığını kontrol et
        console.log('🎭 Sanatçı kontrolü başlıyor...')
        const artistStatus = await userService.isUserArtist(targetUserId)
        console.log('✅ Sanatçı durumu:', artistStatus)
        setIsArtist(artistStatus)
        
        if (artistStatus) {
          // Sanatçı ise kendi şarkılarını getir
          console.log('🎵 Sanatçı şarkıları getiriliyor...')
          const songs = await userService.getUserArtistSongs(targetUserId, 10)
          console.log('✅ Sanatçı şarkıları:', songs)
          setArtistSongs(songs)
        } else {
          // Sanatçı değilse, Spotify'dan otomatik tespit yap
          console.log('🎵 Spotify\'dan otomatik sanatçı tespiti yapılıyor...')
          try {
            // Spotify bağlantısı var mı kontrol et
            const { data: spotifyConnection } = await supabase
              .from('spotify_connections')
              .select('access_token')
              .eq('user_id', targetUserId)
              .single();
            
            if (spotifyConnection?.access_token) {
              console.log('🎵 Spotify token bulundu, otomatik tespit yapılıyor...')
              
              // Otomatik sanatçı tespiti ve veri senkronizasyonu
              const syncResult = await spotifyService.autoDetectAndSyncArtistData(
                spotifyConnection.access_token,
                targetUserId
              );
              
              console.log('🎉 Otomatik tespit sonucu:', syncResult)
              
              if (syncResult.isArtist) {
                console.log('🎵 Sanatçı tespit edildi, şarkılar getiriliyor...')
                setIsArtist(true)
                
                // Güncellenmiş şarkıları getir
                const updatedSongs = await userService.getUserArtistSongs(targetUserId, 10)
                console.log('✅ Güncellenmiş sanatçı şarkıları:', updatedSongs)
                setArtistSongs(updatedSongs)
                return
              }
            }
          } catch (syncError) {
            console.error('❌ Otomatik tespit hatası:', syncError)
          }
          
          // Sanatçı değilse playlist şarkılarını getir
          console.log('🎵 Playlist şarkıları getiriliyor...')
          const songs = await userService.getUserPlaylistSongs(targetUserId, 10)
          console.log('✅ Playlist şarkıları:', songs)
          setArtistSongs(songs)
        }
      } catch (error) {
        console.error('❌ Error fetching artist songs:', error)
        setError('Şarkı bilgileri yüklenirken hata oluştu')
        setArtistSongs([])
      } finally {
        setLoading(false)
      }
    }

    fetchArtistData()
  }, [targetUserId])

  if (loading) {
    return (
      <div className="user-artist-songs">
        <h3 className="section-title">
          {isArtist ? 'Kendi Şarkılarım' : 'Playlist Şarkılarım'}
        </h3>
        <LoadingSpinner />
      </div>
    )
  }

  if (error && artistSongs.length === 0) {
    return (
      <div className="user-artist-songs">
        <h3 className="section-title">
          {isArtist ? 'Kendi Şarkılarım' : 'Playlist Şarkılarım'}
        </h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="user-artist-songs">
      <h3 className="section-title">
        {isArtist ? 'Kendi Şarkılarım' : 'Playlist Şarkılarım'}
      </h3>
      
      {artistSongs.length === 0 ? (
        <div className="empty-state">
          <p>
            {isArtist 
              ? 'Henüz hiç şarkı yayınlamamışsın' 
              : 'Henüz hiç playlist şarkısı eklenmemiş'
            }
          </p>
        </div>
      ) : (
        <div className="artist-songs-grid">
          {artistSongs.map((song, index) => (
            <div key={song.song_id} className="artist-song-card">
              <div className="artist-song-cover">
                <img 
                  src={song.cover_url || "/assets/song/Image.png"} 
                  alt={`${song.title} kapağı`} 
                />
                {isArtist && (
                  <div className="artist-badge">
                    <span>🎵</span>
                  </div>
                )}
              </div>
              <div className="artist-song-info">
                <h4 className="artist-song-title">{song.title}</h4>
                <p className="artist-song-artist">
                  {isArtist ? 'Kendi şarkım' : song.artist_name}
                </p>
                {song.total_respect > 0 && (
                  <p className="artist-song-respect">
                    {song.total_respect?.toLocaleString()} Respect
                  </p>
                )}
                {song.release_date && (
                  <p className="artist-song-release">
                    {new Date(song.release_date).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserArtistSongs
