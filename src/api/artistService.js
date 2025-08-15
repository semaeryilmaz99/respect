import { supabase } from '../config/supabase'

// Artist service
const artistService = {
  // Get artist by ID
  getArtistById: async (artistId) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get artist by ID error:', error)
      return { data: null, error }
    }
  },

  // Get artist's songs
  getArtistSongs: async (artistId, page = 1, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', artistId)
        .order('total_respect', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get artist songs error:', error)
      return { data: null, error }
    }
  },

  // Get artist's top supporters
  getArtistTopSupporters: async (artistId, timeframe = 'all') => {
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
        .eq('to_artist_id', artistId)

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
      console.error('❌ Get artist top supporters error:', error)
      return { data: null, error }
    }
  },

  // Get artist's recent supporters
  getArtistRecentSupporters: async (artistId, limit = 10) => {
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
        .eq('to_artist_id', artistId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get artist recent supporters error:', error)
      return { data: null, error }
    }
  },

  // Follow/unfollow artist
  toggleFollowArtist: async (artistId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('artist_follows')
        .select('*')
        .eq('user_id', user.id)
        .eq('artist_id', artistId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingFollow) {
        // Unfollow
        const { error: deleteError } = await supabase
          .from('artist_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', artistId)

        if (deleteError) throw deleteError
        return { data: { following: false }, error: null }
      } else {
        // Follow
        const { error: insertError } = await supabase
          .from('artist_follows')
          .insert({
            user_id: user.id,
            artist_id: artistId
          })

        if (insertError) throw insertError
        return { data: { following: true }, error: null }
      }
    } catch (error) {
      console.error('❌ Toggle follow artist error:', error)
      return { data: null, error }
    }
  },

  // Get artist's chat messages
  getArtistChat: async (artistId, page = 1, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('artist_chat_messages')
        .select(`
          *,
          profiles!user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get artist chat error:', error)
      return { data: null, error }
    }
  },

  // Search artists
  searchArtists: async (query, page = 1, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('total_respect', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Search artists error:', error)
      return { data: null, error }
    }
  },

  // Get all artists (discover)
  getAllArtists: async (page = 1, limit = 20, sortBy = 'respect') => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order(sortBy === 'respect' ? 'total_respect' : 'name', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get all artists error:', error)
      return { data: null, error }
    }
  },

  // Get artist statistics
  getArtistStats: async (artistId) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('total_respect, followers_count, songs_count')
        .eq('id', artistId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get artist stats error:', error)
      return { data: null, error }
    }
  },

  // Get similar artists
  getSimilarArtists: async (artistId, limit = 10) => {
    try {
      // This is a simplified version - you might want to implement more sophisticated similarity logic
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .neq('id', artistId)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get similar artists error:', error)
      return { data: null, error }
    }
  }
}

export default artistService 