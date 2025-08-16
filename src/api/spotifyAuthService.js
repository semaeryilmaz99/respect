import { supabase } from '../config/supabase';
import config from '../config/environment';
import spotifyRateLimiter from '../utils/spotifyRateLimit.js';

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

  // Spotify callback'i işle
  handleSpotifyCallback: async (code) => {
    try {
      console.log('🔄 Processing Spotify callback with code:', code);
      
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { code }
      });
      
      if (error) {
        console.error('❌ Spotify auth function error:', error);
        return { user: null, profile: null, error: error.message };
      }
      
      if (!data || !data.success) {
        console.error('❌ Spotify auth function returned error:', data?.error);
        return { user: null, profile: null, error: data?.error || 'Authentication failed' };
      }
      
      console.log('✅ Spotify auth successful:', data);
      return { user: data.user, profile: data.profile, error: null };
      
    } catch (error) {
      console.error('❌ Spotify callback processing error:', error);
      return { user: null, profile: null, error: error.message };
    }
  },

  // Supabase OAuth sonrası Spotify bağlantısını kur (rate limiting önlemli)
  setupSpotifyConnection: async (user, providerToken, providerRefreshToken) => {
    try {
      console.log('🔗 Setting up Spotify connection for user:', user.id);
      
      // Rate limiting: Eğer son 5 saniyede aynı kullanıcı için istek atıldıysa bekle
      const lastRequestKey = `spotify_setup_${user.id}`;
      const lastRequest = sessionStorage.getItem(lastRequestKey);
      const now = Date.now();
      
      if (lastRequest && (now - parseInt(lastRequest)) < 5000) {
        console.log('⏳ Rate limiting: Waiting before making Spotify API request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Son istek zamanını kaydet
      sessionStorage.setItem(lastRequestKey, now.toString());
      
      if (!providerToken) {
        console.log('⚠️ No provider token available, skipping Spotify connection setup');
        return { success: true, error: null };
      }

      // Spotify profile'ını al (rate limited)
      console.log('🎵 Fetching Spotify profile...');
      const resp = await spotifyRateLimiter.rateLimitedFetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${providerToken}` }
      }, user.id);
      
      if (!resp.ok) {
        console.warn('⚠️ Failed to fetch Spotify profile:', resp.status, resp.statusText);
        return { success: false, error: `Spotify API error: ${resp.status}` };
      }
      
      const profile = await resp.json();
      console.log('✅ Spotify profile fetched:', profile.id);
      
      // Mevcut bağlantıyı kontrol et
      const { data: existingConnection, error: selectError } = await supabase
        .from('spotify_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (selectError) {
        console.error('❌ Select error:', selectError);
        return { success: false, error: selectError.message };
      }
      
      const connectionData = {
        spotify_user_id: profile.id,
        access_token: providerToken,
        refresh_token: providerRefreshToken || '',
        token_expires_at: new Date(Date.now() + 55 * 60 * 1000)
      };
      
      if (existingConnection) {
        // Kayıt varsa güncelle
        const { error: updateError } = await supabase
          .from('spotify_connections')
          .update(connectionData)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('❌ Update error:', updateError);
          return { success: false, error: updateError.message };
        }
        
        console.log('✅ Spotify connections updated successfully');
      } else {
        // Kayıt yoksa ekle
        const { error: insertError } = await supabase
          .from('spotify_connections')
          .insert({
            user_id: user.id,
            ...connectionData
          });
        
        if (insertError) {
          console.error('❌ Insert error:', insertError);
          return { success: false, error: insertError.message };
        }
        
        console.log('✅ Spotify connections created successfully');
      }
      
      return { success: true, error: null };
      
    } catch (error) {
      console.error('❌ Spotify connection setup error:', error);
      return { success: false, error: error.message };
    }
  },

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
  },

  // Spotify çalma listelerini senkronize et
  syncSpotifyPlaylists: async (userId) => {
    try {
      console.log('🎵 Syncing Spotify playlists for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('spotify-sync-playlists', {
        body: { userId, syncType: 'user_playlists' }
      });

      if (error) throw error;

      if (!data || !data.success) {
        throw new Error(data?.error || 'Playlist sync failed');
      }

      console.log('✅ Spotify playlists synced successfully');
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Spotify playlist sync error:', error);
      return { success: false, data: null, error };
    }
  }
};