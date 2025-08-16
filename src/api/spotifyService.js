import SpotifyWebApi from 'spotify-web-api-node';
import { supabase } from '../config/supabase';

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI
    });
  }

  // OAuth URL oluştur
  getAuthUrl() {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative'
    ];
    
    return this.spotifyApi.createAuthorizeURL(scopes);
  }

  // Authorization code ile token al
  async getTokens(code) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      return {
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in
      };
    } catch (error) {
      console.error('Spotify token error:', error);
      throw error;
    }
  }

  // Token yenile
  async refreshTokens(refreshToken) {
    try {
      this.spotifyApi.setRefreshToken(refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();
      return {
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in
      };
    } catch (error) {
      console.error('Spotify refresh error:', error);
      throw error;
    }
  }

  // Kullanıcı profilini getir
  async getUserProfile(accessToken) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMe();
      return data.body;
    } catch (error) {
      console.error('Spotify user profile error:', error);
      throw error;
    }
  }

  // Sanatçının şarkılarını getir
  async getArtistTracks(accessToken, artistId) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getArtistTopTracks(artistId, 'TR');
      return data.body.tracks;
    } catch (error) {
      console.error('Spotify artist tracks error:', error);
      throw error;
    }
  }

  // Sanatçının albümlerini getir
  async getArtistAlbums(accessToken, artistId) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getArtistAlbums(artistId, {
        include_groups: 'album,single',
        limit: 50
      });
      return data.body.items;
    } catch (error) {
      console.error('Spotify artist albums error:', error);
      throw error;
    }
  }

  // Şarkı arama
  async searchTracks(accessToken, query, limit = 20) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.searchTracks(query, { limit });
      return data.body.tracks.items;
    } catch (error) {
      console.error('Spotify search error:', error);
      throw error;
    }
  }

  // Sanatçı arama
  async searchArtists(accessToken, query, limit = 20) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.searchArtists(query, { limit });
      return data.body.artists.items;
    } catch (error) {
      console.error('Spotify artist search error:', error);
      throw error;
    }
  }

  // Kullanıcının top şarkılarını getir
  async getUserTopTracks(accessToken, limit = 20, timeRange = 'medium_term') {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMyTopTracks({ limit, time_range: timeRange });
      return data.body.items;
    } catch (error) {
      console.error('Spotify top tracks error:', error);
      throw error;
    }
  }

  // Kullanıcının son çaldığı şarkıları getir
  async getUserRecentlyPlayed(accessToken, limit = 20) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMyRecentlyPlayedTracks({ limit });
      return data.body.items;
    } catch (error) {
      console.error('Spotify recently played error:', error);
      throw error;
    }
  }

  // Şarkı detaylarını getir
  async getTrackDetails(accessToken, trackId) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getTrack(trackId);
      return data.body;
    } catch (error) {
      console.error('Spotify track details error:', error);
      throw error;
    }
  }

  // Albüm detaylarını getir
  async getAlbumDetails(accessToken, albumId) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getAlbum(albumId);
      return data.body;
    } catch (error) {
      console.error('Spotify album details error:', error);
      throw error;
    }
  }

  // Sanatçı detaylarını getir
  async getArtistDetails(accessToken, artistId) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getArtist(artistId);
      return data.body;
    } catch (error) {
      console.error('Spotify artist details error:', error);
      throw error;
    }
  }

  // Kullanıcının kendi sanatçı şarkılarını getir (eğer sanatçı ise)
  async getUserOwnArtistSongs(accessToken, limit = 50) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      
      // Önce kullanıcının kendi sanatçı profilini al
      const userProfile = await this.spotifyApi.getMe();
      const userId = userProfile.body.id;
      
      // Kullanıcının kendi sanatçı şarkılarını ara
      const searchQuery = `artist:${userProfile.body.display_name}`;
      const searchResults = await this.spotifyApi.searchTracks(searchQuery, { 
        limit,
        type: 'track'
      });
      
      return searchResults.body.tracks.items;
    } catch (error) {
      console.error('Spotify user own artist songs error:', error);
      throw error;
    }
  }

  // Kullanıcının playlist şarkılarını getir (eğer sanatçı değilse)
  async getUserPlaylistSongs(accessToken, limit = 50) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      
      // Kullanıcının playlist'lerini al
      const playlists = await this.spotifyApi.getUserPlaylists({ limit: 20 });
      const allTracks = [];
      
      // Her playlist'ten şarkıları topla
      for (const playlist of playlists.body.items.slice(0, 5)) { // İlk 5 playlist
        const tracks = await this.spotifyApi.getPlaylistTracks(playlist.id, { limit: 20 });
        allTracks.push(...tracks.body.items);
      }
      
      // Tekrar eden şarkıları kaldır ve limit'e uygun hale getir
      const uniqueTracks = allTracks
        .filter((track, index, self) => 
          index === self.findIndex(t => t.track.id === track.track.id)
        )
        .slice(0, limit);
      
      return uniqueTracks;
    } catch (error) {
      console.error('Spotify user playlist songs error:', error);
      throw error;
    }
  }

  // Kullanıcının sanatçı olup olmadığını kontrol et
  async checkUserArtistStatus(accessToken) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      
      // Kullanıcının kendi sanatçı şarkılarını ara
      const userProfile = await this.spotifyApi.getMe();
      const searchQuery = `artist:${userProfile.body.display_name}`;
      const searchResults = await this.spotifyApi.searchTracks(searchQuery, { limit: 1 });
      
      // Eğer kendi adıyla şarkı bulunuyorsa sanatçıdır
      const isArtist = searchResults.body.tracks.total > 0;
      
      return {
        isArtist,
        userId: userProfile.body.id,
        displayName: userProfile.body.display_name,
        tracksFound: searchResults.body.tracks.total,
        spotifyUserId: userProfile.body.id
      };
    } catch (error) {
      console.error('Spotify user artist status check error:', error);
      throw error;
    }
  }

  // Kullanıcı giriş yaptığında otomatik sanatçı tespiti ve veri çekme
  async autoDetectAndSyncArtistData(accessToken, supabaseUserId) {
    try {
      console.log('🎭 Otomatik sanatçı tespiti başlıyor...');
      
      // 1. Kullanıcının sanatçı olup olmadığını kontrol et
      const artistStatus = await this.checkUserArtistStatus(accessToken);
      console.log('✅ Sanatçı durumu:', artistStatus);
      
      if (artistStatus.isArtist) {
        console.log('🎵 Sanatçı tespit edildi, veri senkronizasyonu başlıyor...');
        
        // 2. Artists tablosuna kayıt ekle/güncelle
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .upsert({
            name: artistStatus.displayName,
            spotify_id: artistStatus.spotifyUserId,
            user_id: supabaseUserId
          }, {
            onConflict: 'spotify_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (artistError) {
          console.error('❌ Artist kayıt hatası:', artistError);
          throw artistError;
        }
        
        console.log('✅ Artist kaydı başarılı:', artistData);
        
        // 3. Sanatçının şarkılarını çek ve songs tablosuna ekle
        const ownSongs = await this.getUserOwnArtistSongs(accessToken, 50);
        console.log('✅ Spotify\'dan şarkılar çekildi:', ownSongs.length);
        
        // 4. Her şarkıyı songs tablosuna ekle
        for (const song of ownSongs) {
          const { error: songError } = await supabase
            .from('songs')
            .upsert({
              title: song.name,
              artist_id: artistData.id,
              spotify_id: song.id,
              cover_url: song.album?.images?.[0]?.url || null,
              duration: song.duration_ms,
              release_date: song.album?.release_date || new Date().toISOString().split('T')[0]
            }, {
              onConflict: 'spotify_id',
              ignoreDuplicates: false
            });
          
          if (songError) {
            console.error('❌ Şarkı ekleme hatası:', songError);
          }
        }
        
        console.log('🎉 Otomatik sanatçı veri senkronizasyonu tamamlandı!');
        return {
          success: true,
          artistData,
          songsCount: ownSongs.length
        };
      } else {
        console.log('👤 Kullanıcı sanatçı değil, veri senkronizasyonu atlanıyor');
        return {
          success: true,
          isArtist: false
        };
      }
    } catch (error) {
      console.error('❌ Otomatik sanatçı tespiti hatası:', error);
      throw error;
    }
  }
}

export default new SpotifyService();
