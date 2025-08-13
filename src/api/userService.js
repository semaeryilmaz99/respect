import { supabase } from '../config/supabase'

const userService = {
  // Check if username is available
  checkUsernameAvailability: async (username, excludeUserId = null) => {
    try {
      console.log('🔍 Checking username availability:', username)
      
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
      
      if (excludeUserId) {
        query = query.neq('id', excludeUserId)
      }
      
      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      const isAvailable = !data
      console.log('✅ Username availability:', isAvailable)
      return isAvailable
    } catch (error) {
      console.error('❌ Check username availability error:', error)
      throw error
    }
  },

  // Delete account (auth user) via Edge Function
  deleteAccount: async () => {
    try {
      console.log('🗑️ Deleting current user account via Edge Function')
      const { data, error } = await supabase.functions.invoke('delete-user', {
        method: 'POST',
        body: {}
      })

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Hesap silme başarısız oldu')
      }

      return true
    } catch (error) {
      console.error('❌ Delete account error:', error)
      throw error
    }
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    try {
      console.log('👤 Updating profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Bu kullanıcı adı zaten kullanılıyor')
        }
        throw error
      }

      console.log('✅ Profile updated successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Update profile error:', error)
      throw error
    }
  },

  // Get user profile
  getProfile: async (userId) => {
    try {
      console.log('👤 Getting profile for user:', userId)
      
      // Önce profiles tablosunda kullanıcı var mı kontrol edelim
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (checkError) {
        console.error('❌ Profile check error:', checkError)
        throw checkError
      }

      if (!existingProfile) {
        console.log('⚠️ Profile not found, creating default profile...')
        // Profil yoksa varsayılan profil oluştur - is_profile_completed kolonu yok
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: `user_${userId.slice(0, 8)}`,
            full_name: 'Kullanıcı',
            bio: 'Henüz profil bilgisi girilmemiş',
            respect_balance: 1000
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Profile creation error:', createError)
          throw createError
        }

        console.log('✅ Default profile created:', newProfile)
        return newProfile
      }

      console.log('✅ Profile fetched successfully:', existingProfile)
      return existingProfile
    } catch (error) {
      console.error('❌ Get profile error:', error)
      throw error
    }
  },

  // Get user's followed artists
  getFollowedArtists: async (userId) => {
    try {
      console.log('👥 Getting followed artists for user:', userId)
      
      const { data, error } = await supabase
        .from('artist_follows')
        .select(`
          *,
          artists (
            id,
            name,
            avatar_url,
            total_respect,
            followers_count
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Supabase query error:', error)
        throw error
      }
      
      console.log('📊 Raw data from artist_follows:', data)
      const artists = data?.map(follow => follow.artists) || []
      console.log('✅ Processed artists:', artists)
      return artists
    } catch (error) {
      console.error('❌ Get followed artists error:', error)
      return []
    }
  },

  // Get user's favorited songs
  getFavoritedSongs: async (userId) => {
    try {
      console.log('❤️ Getting favorited songs for user:', userId)
      
      const { data, error } = await supabase
        .from('song_favorites')
        .select(`
          *,
          songs (
            id,
            title,
            artist_id,
            cover_url,
            artists (
              id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      console.log('✅ Favorited songs fetched:', data?.length || 0)
      return data?.map(favorite => ({
        ...favorite.songs,
        artist_name: favorite.songs.artists?.name
      })) || []
    } catch (error) {
      console.error('❌ Get favorited songs error:', error)
      return []
    }
  },

  // Get user's recent respect transactions
  getRecentRespectTransactions: async (userId, limit = 10) => {
    try {
      console.log('🔄 getRecentRespectTransactions çağrıldı')
      console.log('👤 userId:', userId)
      console.log('📊 limit:', limit)
      
      const { data, error } = await supabase
        .from('respect_transactions')
        .select(`
          *,
          artists (
            id,
            name,
            avatar_url
          ),
          songs (
            id,
            title,
            cover_url,
            artists (
              id,
              name
            )
          )
        `)
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('✅ Raw data from Supabase:', data)
      
      return data?.map(transaction => ({
        ...transaction,
        recipient_name: transaction.artists?.name || transaction.songs?.artists?.name,
        recipient_image: transaction.artists?.avatar_url || transaction.songs?.cover_url,
        item_title: transaction.songs?.title
      })) || []
    } catch (error) {
      console.error('❌ Get recent respect transactions error:', error)
      return []
    }
  },

  // Get user's top respected artists (most respect given)
  getTopRespectedArtists: async (userId, limit = 6) => {
    try {
      console.log('🏆 Getting top respected artists for user:', userId)
      
      // Use a more efficient query with proper aggregation
      const { data, error } = await supabase
        .from('respect_transactions')
        .select(`
          to_artist_id,
          amount,
          artists (
            id,
            name,
            avatar_url
          )
        `)
        .eq('from_user_id', userId)
        .not('to_artist_id', 'is', null)
      
      if (error) {
        throw error
      }
      
      // Group by artist and sum amounts
      const artistTotals = data?.reduce((acc, transaction) => {
        const artistId = transaction.to_artist_id
        if (!acc[artistId]) {
          acc[artistId] = {
            id: transaction.artists?.id,
            name: transaction.artists?.name,
            avatar_url: transaction.artists?.avatar_url,
            total_respect: 0
          }
        }
        acc[artistId].total_respect += transaction.amount || 0
        return acc
      }, {}) || {}
      
      const topArtists = Object.values(artistTotals)
        .filter(artist => artist.name) // Only include artists with names
        .sort((a, b) => b.total_respect - a.total_respect)
        .slice(0, limit)
      
      console.log('✅ Top respected artists fetched:', topArtists.length)
      return topArtists
    } catch (error) {
      console.error('❌ Get top respected artists error:', error)
      return []
    }
  },

  // Get user's top respected songs (most respect given)
  getTopRespectedSongs: async (userId, limit = 5) => {
    try {
      console.log('🎵 Getting top respected songs for user:', userId)
      
      // Use a more efficient query with proper aggregation
      const { data, error } = await supabase
        .from('respect_transactions')
        .select(`
          song_id,
          amount,
          songs (
            id,
            title,
            cover_url,
            artists (
              id,
              name
            )
          )
        `)
        .eq('from_user_id', userId)
        .not('song_id', 'is', null)
      
      if (error) {
        throw error
      }
      
      // Group by song and sum amounts
      const songTotals = data?.reduce((acc, transaction) => {
        const songId = transaction.song_id
        if (!acc[songId]) {
          acc[songId] = {
            id: transaction.songs?.id,
            title: transaction.songs?.title,
            cover_url: transaction.songs?.cover_url,
            artist_name: transaction.songs?.artists?.name,
            total_respect: 0
          }
        }
        acc[songId].total_respect += transaction.amount || 0
        return acc
      }, {}) || {}
      
      const topSongs = Object.values(songTotals)
        .filter(song => song.title && song.artist_name) // Only include songs with titles and artists
        .sort((a, b) => b.total_respect - a.total_respect)
        .slice(0, limit)
      
      console.log('✅ Top respected songs fetched:', topSongs.length)
      return topSongs
    } catch (error) {
      console.error('❌ Get top respected songs error:', error)
      return []
    }
  }
}

export default userService 