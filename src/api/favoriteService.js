import { supabase } from '../config/supabase'

export const favoriteService = {
  // Favori şarkı ekle
  addToFavorites: async (songId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }
      
      const { data, error } = await supabase
        .from('song_favorites')
        .insert({
          user_id: user.id,
          song_id: songId
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Bu şarkı zaten favorilerinizde')
        }
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error adding song to favorites:', error)
      return { data: null, error }
    }
  },

  // Favori şarkıdan çıkar
  removeFromFavorites: async (songId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }
      
      const { data, error } = await supabase
        .from('song_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error removing song from favorites:', error)
      return { data: null, error }
    }
  },

  // Kullanıcının favori şarkılarını getir
  getFavoriteSongs: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }
      
      const { data, error } = await supabase
        .from('song_favorites')
        .select(`
          *,
          songs (
            id,
            title,
            album,
            duration,
            cover_url,
            total_respect,
            favorites_count,
            artists (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error getting favorite songs:', error)
      return { data: null, error }
    }
  },

  // Şarkının favori sayısını getir
  getSongFavoritesCount: async (songId) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('favorites_count')
        .eq('id', songId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Şarkı bulunamadı, varsayılan değer döndür
          return { data: 0, error: null }
        }
        throw error
      }

      return { data: data?.favorites_count || 0, error: null }
    } catch (error) {
      console.error('❌ Error getting song favorites count:', error)
      return { data: 0, error }
    }
  },

  // Kullanıcının şarkıyı favoriye ekleyip eklemediğini kontrol et
  isSongFavorited: async (songId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { data: false, error: null }
      }
      
      const { data, error } = await supabase
        .from('song_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .maybeSingle() // single() yerine maybeSingle() kullan

      if (error) {
        console.error('❌ Error checking if song is favorited:', error)
        return { data: false, error }
      }

      return { data: !!data, error: null }
    } catch (error) {
      console.error('❌ Error checking if song is favorited:', error)
      return { data: false, error }
    }
  },

  // Favori durumunu değiştir (toggle)
  toggleFavorite: async (songId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }
      
      // Önce şarkının var olup olmadığını kontrol et
      const { data: _songExists, error: songCheckError } = await supabase
        .from('songs')
        .select('id')
        .eq('id', songId)
        .single()

      if (songCheckError) {
        if (songCheckError.code === 'PGRST116') {
          throw new Error('Bu şarkı mevcut değil')
        }
        throw songCheckError
      }
      
      // Önce favori durumunu kontrol et
      const { data: existingFavorite, error: checkError } = await supabase
        .from('song_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingFavorite) {
        // Favori varsa kaldır
        const { data, error } = await supabase
          .from('song_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', songId)
          .select()
          .single()

        if (error) {
          throw error
        }

        return { data: { favorited: false, removed: data }, error: null }
      } else {
        // Favori yoksa ekle
        const { data, error } = await supabase
          .from('song_favorites')
          .insert({
            user_id: user.id,
            song_id: songId
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23503') {
            throw new Error('Bu şarkı mevcut değil')
          }
          throw error
        }

        return { data: { favorited: true, added: data }, error: null }
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
      return { data: null, error }
    }
  }
} 

export default favoriteService;