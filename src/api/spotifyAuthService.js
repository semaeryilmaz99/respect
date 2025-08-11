import { supabase } from '../config/supabase';
import config from '../config/environment';

export const spotifyAuthService = {
  // Spotify ile giriş: Supabase OAuth üzerinden
  initiateSpotifyLogin: async () => {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    const redirectTo = `${window.location.origin}/auth/callback`;

    console.log('🎵 Starting Supabase OAuth (spotify) with redirectTo:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo,
        scopes
      }
    });

    if (error) {
      console.error('❌ Supabase OAuth start error:', error);
      throw error;
    }

    return data;
  },

  // Not used when using Supabase OAuth redirect flow
  handleSpotifyCallback: async (_code) => ({ user: null, profile: null, error: null }),

  // Spotify bağlantısını kontrol et
  checkSpotifyConnection: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('spotify_connections')
        .select('*')
        .limit(1)
        .eq('user_id', userId)
        .maybeSingle();

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