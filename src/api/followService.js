import { supabase } from '../config/supabase'

export const followService = {
  // Sanatçıyı takip et
  followArtist: async (artistId) => {
    try {
      console.log('👥 Following artist:', artistId)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }
      
      console.log('👤 Current user ID:', user.id)
      
      const { data, error } = await supabase
        .from('artist_follows')
        .insert({
          user_id: user.id,
          artist_id: artistId
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Insert error:', error)
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Bu sanatçıyı zaten takip ediyorsunuz')
        }
        throw error
      }

      console.log('✅ Artist followed successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Follow artist error:', error)
      throw error
    }
  },

  // Sanatçı takibini bırak
  unfollowArtist: async (artistId) => {
    try {
      console.log('👥 Unfollowing artist:', artistId)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }
      
      const { data, error } = await supabase
        .from('artist_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('artist_id', artistId)
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Artist unfollowed successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Unfollow artist error:', error)
      throw error
    }
  },

  // Kullanıcının takip ettiği sanatçıları getir
  getFollowedArtists: async (userId = null) => {
    try {
      console.log('👥 Getting followed artists for user:', userId)
      
      const { data, error } = await supabase
        .from('artist_follows')
        .select(`
          artist_id,
          created_at,
          artists (
            id,
            name,
            avatar_url,
            total_respect,
            followers_count
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('✅ Followed artists fetched:', data)
      return data || []
    } catch (error) {
      console.error('❌ Get followed artists error:', error)
      throw error
    }
  },

  // Sanatçının takipçilerini getir
  getArtistFollowers: async (artistId, limit = 20) => {
    try {
      console.log('👥 Getting followers for artist:', artistId)
      
      const { data, error } = await supabase
        .from('artist_follows')
        .select(`
          created_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      console.log('✅ Artist followers fetched:', data)
      return data || []
    } catch (error) {
      console.error('❌ Get artist followers error:', error)
      throw error
    }
  },

  // Kullanıcının sanatçıyı takip edip etmediğini kontrol et
  isFollowingArtist: async (artistId) => {
    try {
      console.log('👥 Checking if following artist:', artistId)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return false
      }
      
      const { data, error } = await supabase
        .from('artist_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('artist_id', artistId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      const isFollowing = !!data
      console.log('✅ Following status:', isFollowing)
      return isFollowing
    } catch (error) {
      console.error('❌ Check following status error:', error)
      return false
    }
  },

  // Sanatçının takipçi sayısını getir
  getArtistFollowersCount: async (artistId) => {
    try {
      console.log('👥 Getting followers count for artist:', artistId)
      
      const { data, error } = await supabase
        .from('artists')
        .select('followers_count')
        .eq('id', artistId)
        .single()

      if (error) throw error

      console.log('✅ Followers count:', data?.followers_count || 0)
      return data?.followers_count || 0
    } catch (error) {
      console.error('❌ Get followers count error:', error)
      return 0
    }
  },

  // Takip etme/takibi bırakma toggle fonksiyonu
  toggleFollowArtist: async (artistId, isCurrentlyFollowing) => {
    try {
      if (isCurrentlyFollowing) {
        return await followService.unfollowArtist(artistId)
      } else {
        return await followService.followArtist(artistId)
      }
    } catch (error) {
      console.error('❌ Toggle follow error:', error)
      throw error
    }
  }
}

export default followService 