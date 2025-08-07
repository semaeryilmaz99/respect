import { supabase } from '../config/supabase';
import config from '../config/environment';

export const spotifyAuthService = {
  // Spotify ile giriş başlat
  initiateSpotifyLogin: () => {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative'
    ];
    
    const params = new URLSearchParams({
      client_id: config.SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: config.SPOTIFY_REDIRECT_URI,
      scope: scopes.join(' '),
      state: Math.random().toString(36).substring(7)
    });
    
    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log('🔧 Spotify Auth URL:', authUrl);
    console.log('🔧 Spotify Client ID:', config.SPOTIFY_CLIENT_ID);
    console.log('🔧 Spotify Redirect URI:', config.SPOTIFY_REDIRECT_URI);
    console.log('🔧 Force redeploy for Spotify callback fix');
    window.location.href = authUrl;
  },

  // Spotify callback'i işle
  handleSpotifyCallback: async (code) => {
    try {
      // Backend'e authorization code'u gönder
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { code }
      });

      if (error) throw error;

      return { user: data.user, profile: data.profile, error: null };
    } catch (error) {
      console.error('Spotify callback error:', error);
      return { user: null, profile: null, error };
    }
  },

  // Spotify bağlantısını kontrol et
  checkSpotifyConnection: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('spotify_connections')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return { connected: false, data: null, error };

      // Token'ın geçerliliğini kontrol et
      if (new Date() > new Date(data.token_expires_at)) {
        // Token'ı yenile
        const { data: refreshData, error: refreshError } = await supabase.functions.invoke('spotify-refresh-token', {
          body: { userId, refreshToken: data.refresh_token }
        });

        if (refreshError) {
          return { connected: false, data: null, error: refreshError };
        }

        data.access_token = refreshData.access_token;
        data.token_expires_at = refreshData.token_expires_at;
      }

      return { connected: true, data, error: null };
    } catch (error) {
      console.error('Spotify connection check error:', error);
      return { connected: false, data: null, error };
    }
  },

  // Spotify bağlantısını kaldır
  disconnectSpotify: async (userId) => {
    try {
      const { error } = await supabase
        .from('spotify_connections')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Spotify disconnect error:', error);
      return { success: false, error };
    }
  },

  // Spotify verilerini senkronize et
  syncSpotifyData: async (userId, syncType) => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-sync', {
        body: { userId, syncType }
      });

      if (error) throw error;

      return { success: true, data, error: null };
    } catch (error) {
      console.error('Spotify sync error:', error);
      return { success: false, data: null, error };
    }
  }
};