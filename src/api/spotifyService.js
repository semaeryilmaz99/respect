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
}

export default new SpotifyService(); 