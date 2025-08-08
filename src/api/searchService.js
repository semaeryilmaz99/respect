import { supabase } from '../config/supabase'

// Search service for artists and songs
const searchService = {
  // Search artists and songs
  searchArtistsAndSongs: async (query, limit = 10) => {
    try {
      console.log('🔍 Searching for:', query)
      
      if (!query || query.trim().length < 2) {
        return { artists: [], songs: [] }
      }

      const searchTerm = `%${query.trim()}%`

      // Search artists
      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('id, name, avatar_url, total_respect, followers_count')
        .ilike('name', searchTerm)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (artistsError) {
        console.error('❌ Artists search error:', artistsError)
      }

      // Search songs
      const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select(`
          id, 
          title, 
          cover_url, 
          total_respect,
          artists (
            id,
            name
          )
        `)
        .ilike('title', searchTerm)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (songsError) {
        console.error('❌ Songs search error:', songsError)
      }

      const results = {
        artists: artists || [],
        songs: songs || []
      }

      console.log('✅ Search results:', results)
      return results
    } catch (error) {
      console.error('❌ Search error:', error)
      return { artists: [], songs: [] }
    }
  },

  // Search only artists
  searchArtists: async (query, limit = 10) => {
    try {
      console.log('🎤 Searching artists for:', query)
      
      if (!query || query.trim().length < 2) {
        return []
      }

      const searchTerm = `%${query.trim()}%`

      const { data, error } = await supabase
        .from('artists')
        .select('id, name, avatar_url, total_respect, followers_count')
        .ilike('name', searchTerm)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Artists search error:', error)
        return []
      }

      console.log('✅ Artists search results:', data)
      return data || []
    } catch (error) {
      console.error('❌ Artists search error:', error)
      return []
    }
  },

  // Search only songs
  searchSongs: async (query, limit = 10) => {
    try {
      console.log('🎵 Searching songs for:', query)
      
      if (!query || query.trim().length < 2) {
        return []
      }

      const searchTerm = `%${query.trim()}%`

      const { data, error } = await supabase
        .from('songs')
        .select(`
          id, 
          title, 
          cover_url, 
          total_respect,
          artists (
            id,
            name
          )
        `)
        .ilike('title', searchTerm)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Songs search error:', error)
        return []
      }

      console.log('✅ Songs search results:', data)
      return data || []
    } catch (error) {
      console.error('❌ Songs search error:', error)
      return []
    }
  }
}

export default searchService
