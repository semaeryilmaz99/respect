import { supabase } from '../config/supabase'

// Song service
const songService = {
  // Get song by ID
  getSongById: async (songId) => {
    try {
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
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get song by ID error:', error)
      return { data: null, error }
    }
  },

  // Get song's top supporters
  getSongTopSupporters: async (songId, timeframe = 'all') => {
    try {
      let query = supabase
        .from('respect_transactions')
        .select(`
          from_user_id,
          amount,
          profiles!from_user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('song_id', songId)

      // Timeframe filter
      if (timeframe === 'week') {
        query = query.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      } else if (timeframe === 'month') {
        query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      }

      const { data, error } = await query
        .order('amount', { ascending: false })
        .limit(10)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get song top supporters error:', error)
      return { data: null, error }
    }
  },

  // Get song's recent supporters
  getSongRecentSupporters: async (songId, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('respect_transactions')
        .select(`
          amount,
          created_at,
          profiles!from_user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('song_id', songId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get song recent supporters error:', error)
      return { data: null, error }
    }
  },

  // Get song's chat messages
  getSongChat: async (songId, page = 1, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('song_chat_messages')
        .select(`
          *,
          profiles!user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('song_id', songId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get song chat error:', error)
      return { data: null, error }
    }
  },

  // Like/unlike song
  toggleLikeSong: async (songId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('song_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('song_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', songId)

        if (deleteError) throw deleteError
        return { data: { liked: false }, error: null }
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('song_likes')
          .insert({
            user_id: user.id,
            song_id: songId
          })

        if (insertError) throw insertError
        return { data: { liked: true }, error: null }
      }
    } catch (error) {
      console.error('❌ Toggle like song error:', error)
      return { data: null, error }
    }
  },

  // Search songs
  searchSongs: async (query, page = 1, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          artists (
            id,
            name
          )
        `)
        .ilike('title', `%${query}%`)
        .order('total_respect', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Search songs error:', error)
      return { data: null, error }
    }
  },

  // Get all songs (discover)
  getAllSongs: async (page = 1, limit = 20, sortBy = 'respect') => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          artists (
            id,
            name
          )
        `)
        .order(sortBy === 'respect' ? 'total_respect' : 'title', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get all songs error:', error)
      return { data: null, error }
    }
  },

  // Get song statistics
  getSongStats: async (songId) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('total_respect, likes_count, plays_count')
        .eq('id', songId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get song stats error:', error)
      return { data: null, error }
    }
  },

  // Get similar songs
  getSimilarSongs: async (songId, limit = 10) => {
    try {
      // This is a simplified version - you might want to implement more sophisticated similarity logic
      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          artists (
            id,
            name
          )
        `)
        .neq('id', songId)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get similar songs error:', error)
      return { data: null, error }
    }
  },

  // Get songs by artist (excluding current song)
  getSongsByArtist: async (artistId, currentSongId, limit = 10) => {
    try {
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
        .eq('artist_id', artistId)
        .neq('id', currentSongId)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get songs by artist error:', error)
      return { data: null, error }
    }
  }
}

export default songService 