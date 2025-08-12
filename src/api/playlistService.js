import { supabase } from '../config/supabase';

export const playlistService = {
  // Kullanıcının Spotify çalma listelerini getir
  getUserPlaylists: async (userId) => {
    try {
      console.log('🎵 Fetching user playlists for:', userId);
      
      const { data, error } = await supabase
        .from('spotify_playlists')
        .select(`
          *,
          user_playlist_preferences!inner(
            is_favorite,
            is_visible,
            sort_order
          )
        `)
        .eq('user_id', userId)
        .eq('user_playlist_preferences.is_visible', true)
        .order('user_playlist_preferences.sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching playlists:', error);
        throw error;
      }

      console.log('✅ Playlists fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Playlist fetch error:', error);
      return [];
    }
  },

  // Çalma listesi detaylarını getir
  getPlaylistDetails: async (playlistId) => {
    try {
      console.log('🎵 Fetching playlist details for:', playlistId);
      
      const { data, error } = await supabase
        .from('spotify_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (error) {
        console.error('❌ Error fetching playlist details:', error);
        throw error;
      }

      console.log('✅ Playlist details fetched:', data?.name);
      return data;
    } catch (error) {
      console.error('❌ Playlist details fetch error:', error);
      return null;
    }
  },

  // Çalma listesi şarkılarını getir
  getPlaylistTracks: async (playlistId) => {
    try {
      console.log('🎵 Fetching playlist tracks for:', playlistId);
      
      const { data, error } = await supabase
        .from('spotify_playlist_tracks')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Error fetching playlist tracks:', error);
        throw error;
      }

      console.log('✅ Playlist tracks fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Playlist tracks fetch error:', error);
      return [];
    }
  },

  // Spotify'dan çalma listelerini senkronize et
  syncUserPlaylists: async (userId) => {
    try {
      console.log('🔄 Syncing user playlists for:', userId);
      
      const { data, error } = await supabase.functions.invoke('spotify-sync-playlists', {
        body: { userId, syncType: 'user_playlists' }
      });

      if (error) {
        console.error('❌ Playlist sync function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        console.error('❌ Playlist sync failed:', data?.error);
        throw new Error(data?.error || 'Playlist sync failed');
      }

      console.log('✅ Playlists synced successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Playlist sync error:', error);
      throw error;
    }
  },

  // Çalma listesi şarkılarını senkronize et
  syncPlaylistTracks: async (userId, playlistId) => {
    try {
      console.log('🔄 Syncing playlist tracks for:', playlistId);
      
      const { data, error } = await supabase.functions.invoke('spotify-sync-playlists', {
        body: { userId, syncType: 'playlist_tracks', playlistId }
      });

      if (error) {
        console.error('❌ Playlist tracks sync function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        console.error('❌ Playlist tracks sync failed:', data?.error);
        throw new Error(data?.error || 'Playlist tracks sync failed');
      }

      console.log('✅ Playlist tracks synced successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Playlist tracks sync error:', error);
      throw error;
    }
  },

  // Çalma listesi tercihlerini güncelle
  updatePlaylistPreferences: async (userId, playlistId, preferences) => {
    try {
      console.log('⚙️ Updating playlist preferences for:', playlistId);
      
      const { data, error } = await supabase
        .from('user_playlist_preferences')
        .upsert({
          user_id: userId,
          playlist_id: playlistId,
          ...preferences
        }, {
          onConflict: 'user_id,playlist_id'
        });

      if (error) {
        console.error('❌ Error updating playlist preferences:', error);
        throw error;
      }

      console.log('✅ Playlist preferences updated');
      return data;
    } catch (error) {
      console.error('❌ Playlist preferences update error:', error);
      throw error;
    }
  },

  // Çalma listesini favorilere ekle/çıkar
  togglePlaylistFavorite: async (userId, playlistId) => {
    try {
      console.log('❤️ Toggling playlist favorite for:', playlistId);
      
      // Mevcut tercihi al
      const { data: existingPref } = await supabase
        .from('user_playlist_preferences')
        .select('is_favorite')
        .eq('user_id', userId)
        .eq('playlist_id', playlistId)
        .single();

      const newFavoriteState = !(existingPref?.is_favorite || false);

      const { data, error } = await supabase
        .from('user_playlist_preferences')
        .upsert({
          user_id: userId,
          playlist_id: playlistId,
          is_favorite: newFavoriteState
        }, {
          onConflict: 'user_id,playlist_id'
        });

      if (error) {
        console.error('❌ Error toggling playlist favorite:', error);
        throw error;
      }

      console.log('✅ Playlist favorite toggled:', newFavoriteState);
      return { is_favorite: newFavoriteState };
    } catch (error) {
      console.error('❌ Playlist favorite toggle error:', error);
      throw error;
    }
  },

  // Çalma listesini gizle/göster
  togglePlaylistVisibility: async (userId, playlistId) => {
    try {
      console.log('👁️ Toggling playlist visibility for:', playlistId);
      
      // Mevcut tercihi al
      const { data: existingPref } = await supabase
        .from('user_playlist_preferences')
        .select('is_visible')
        .eq('user_id', userId)
        .eq('playlist_id', playlistId)
        .single();

      const newVisibilityState = !(existingPref?.is_visible !== false); // Default true

      const { data, error } = await supabase
        .from('user_playlist_preferences')
        .upsert({
          user_id: userId,
          playlist_id: playlistId,
          is_visible: newVisibilityState
        }, {
          onConflict: 'user_id,playlist_id'
        });

      if (error) {
        console.error('❌ Error toggling playlist visibility:', error);
        throw error;
      }

      console.log('✅ Playlist visibility toggled:', newVisibilityState);
      return { is_visible: newVisibilityState };
    } catch (error) {
      console.error('❌ Playlist visibility toggle error:', error);
      throw error;
    }
  },

  // Çalma listesi sıralamasını güncelle
  updatePlaylistOrder: async (userId, playlistOrders) => {
    try {
      console.log('📋 Updating playlist order for:', userId);
      
      const updates = playlistOrders.map((playlistId, index) => ({
        user_id: userId,
        playlist_id: playlistId,
        sort_order: index
      }));

      const { data, error } = await supabase
        .from('user_playlist_preferences')
        .upsert(updates, {
          onConflict: 'user_id,playlist_id'
        });

      if (error) {
        console.error('❌ Error updating playlist order:', error);
        throw error;
      }

      console.log('✅ Playlist order updated');
      return data;
    } catch (error) {
      console.error('❌ Playlist order update error:', error);
      throw error;
    }
  },

  // Çalma listesi istatistiklerini getir
  getPlaylistStats: async (userId) => {
    try {
      console.log('📊 Fetching playlist stats for:', userId);
      
      const { data, error } = await supabase
        .from('spotify_playlists')
        .select(`
          id,
          name,
          total_tracks,
          user_playlist_preferences!inner(
            is_favorite,
            is_visible
          )
        `)
        .eq('user_id', userId)
        .eq('user_playlist_preferences.is_visible', true);

      if (error) {
        console.error('❌ Error fetching playlist stats:', error);
        throw error;
      }

      const stats = {
        total_playlists: data?.length || 0,
        total_tracks: data?.reduce((sum, playlist) => sum + (playlist.total_tracks || 0), 0) || 0,
        favorite_playlists: data?.filter(p => p.user_playlist_preferences?.is_favorite).length || 0,
        public_playlists: data?.filter(p => p.is_public).length || 0
      };

      console.log('✅ Playlist stats fetched:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Playlist stats fetch error:', error);
      return {
        total_playlists: 0,
        total_tracks: 0,
        favorite_playlists: 0,
        public_playlists: 0
      };
    }
  }
};
