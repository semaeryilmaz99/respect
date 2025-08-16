import SpotifyWebApi from 'spotify-web-api-node';

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
      console.log('👤 Spotify kullanıcı profili alınıyor...')
      
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMe();
      
      const userProfile = {
        id: data.body.id,
        email: data.body.email,
        display_name: data.body.display_name,
        country: data.body.country,
        product: data.body.product,
        images: data.body.images
      };
      
      console.log('✅ Kullanıcı profili alındı:', userProfile);
      return userProfile;
    } catch (error) {
      console.error('❌ Kullanıcı profili alma hatası:', error);
      throw new Error('Kullanıcı profili alınamadı');
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
        tracksFound: searchResults.body.tracks.total
      };
    } catch (error) {
      console.error('Spotify user artist status check error:', error);
      throw error;
    }
  }
}

export default new SpotifyService(); 