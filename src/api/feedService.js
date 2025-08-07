import { supabase } from '../config/supabase'

const feedService = {
  // Genel feed verilerini getir (tüm kullanıcı aktiviteleri)
  getFeed: async (page = 1, type = 'all') => {
    try {
      console.log('📊 Fetching general feed data from Supabase...')
      
      // Önce feed_items tablosunda kaç kayıt olduğunu kontrol edelim
      const { count, error: countError } = await supabase
        .from('feed_items')
        .select('*', { count: 'exact', head: true })

      console.log('📊 Total feed items count:', count, countError)
      
      // Basit sorgu ile başla
      let query = supabase
        .from('feed_items')
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
        .order('created_at', { ascending: false })

      if (type !== 'all') {
        query = query.eq('type', type)
      }

      const { data, error } = await query
        .range((page - 1) * 20, page * 20 - 1)

      if (error) {
        console.error('❌ Feed query error:', error)
        throw error
      }

      // Kullanıcı bilgilerini ayrı query ile al
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(item => item.user_id))]
        console.log('👥 Community feed - User IDs to fetch:', userIds)

        const { data: userProfiles, error: userError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        if (userError) {
          console.error('❌ Community feed - User profiles fetch error:', userError)
        } else {
          console.log('✅ Community feed - User profiles fetched:', userProfiles)
          
          // Kullanıcı bilgilerini feed items'a ekle
          const userMap = {}
          userProfiles?.forEach(profile => {
            userMap[profile.id] = profile
          })

          const enrichedData = data.map(item => ({
            ...item,
            profiles: userMap[item.user_id]
          }))

          console.log('✅ Community feed data enriched:', enrichedData)
          return enrichedData || []
        }
      }

      console.log('✅ Feed data fetched:', data)
      return data || []

    } catch (error) {
      console.error('❌ Feed fetch error:', error)
      return []
    }
  },

  // Kullanıcıya özel feed verilerini getir (takip edilen sanatçılar ve favori şarkılarla ilgili diğer kullanıcıların işlemleri)
  getPersonalFeed: async (page = 1) => {
    try {
      console.log('👤 Fetching personal feed data...')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      console.log('👤 Current user ID:', user.id)

      // Kullanıcının takip ettiği sanatçıları getir
      const { data: followedArtists, error: followError } = await supabase
        .from('artist_follows')
        .select('artist_id')
        .eq('user_id', user.id)

      let followedArtistIds = []
      if (followError) {
        console.error('Follow error:', followError)
      } else {
        followedArtistIds = followedArtists.map(fa => fa.artist_id)
        console.log('🎨 Followed artist IDs:', followedArtistIds)
      }

      // Kullanıcının favori şarkılarını getir
      const { data: favoriteSongs, error: favoriteError } = await supabase
        .from('song_favorites')
        .select('song_id')
        .eq('user_id', user.id)

      let favoriteSongIds = []
      if (favoriteError) {
        console.error('Favorite error:', favoriteError)
      } else {
        favoriteSongIds = favoriteSongs.map(fs => fs.song_id)
        console.log('🎵 Favorite song IDs:', favoriteSongIds)
      }

      // Eğer takip edilen sanatçı veya favori şarkı yoksa boş array döndür
      if (followedArtistIds.length === 0 && favoriteSongIds.length === 0) {
        console.log('👤 No followed artists or favorite songs found')
        return []
      }

      // Takip edilen sanatçılar ve favori şarkılarla ilgili feed items'ları getir
      // ÖNEMLİ: Sadece diğer kullanıcıların işlemlerini göster (kendi işlemlerini değil)
      let query = supabase
        .from('feed_items')
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
        .neq('user_id', user.id) // Kendi işlemlerini hariç tut
        .order('created_at', { ascending: false })

      // OR koşulu oluştur - takip edilen sanatçılar VEYA favori şarkılarla ilgili işlemler
      const conditions = []
      if (followedArtistIds.length > 0) {
        conditions.push(`artist_id.in.(${followedArtistIds.map(id => `"${id}"`).join(',')})`)
      }
      if (favoriteSongIds.length > 0) {
        conditions.push(`song_id.in.(${favoriteSongIds.map(id => `"${id}"`).join(',')})`)
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(','))
      }

      const { data, error } = await query
        .range((page - 1) * 20, page * 20 - 1)

      if (error) {
        console.error('❌ Personal feed query error:', error)
        throw error
      }

      // Kullanıcı bilgilerini ayrı query ile al
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(item => item.user_id))]
        console.log('👥 User IDs to fetch:', userIds)

        const { data: userProfiles, error: userError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        if (userError) {
          console.error('❌ User profiles fetch error:', userError)
        } else {
          console.log('✅ User profiles fetched:', userProfiles)
          
          // Kullanıcı bilgilerini feed items'a ekle
          const userMap = {}
          userProfiles?.forEach(profile => {
            userMap[profile.id] = profile
          })

          const enrichedData = data.map(item => ({
            ...item,
            profiles: userMap[item.user_id]
          }))

          console.log('✅ Personal feed data enriched:', enrichedData)
          console.log('📊 Personal feed count:', enrichedData?.length || 0)
          return enrichedData || []
        }
      }

      console.log('✅ Personal feed data fetched:', data)
      console.log('📊 Personal feed count:', data?.length || 0)
      return data || []

    } catch (error) {
      console.error('❌ Personal feed fetch error:', error)
      return []
    }
  },

  // Respect flow verilerini getir (son respect işlemleri)
  getRespectFlow: async (limit = 10) => {
    try {
      console.log('💰 Fetching respect flow data...')
      
      const { data, error } = await supabase
        .from('respect_transactions')
        .select(`
          *,
          profiles(username, full_name, avatar_url),
          artists(name, avatar_url),
          songs(title, cover_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      console.log('✅ Respect flow data fetched:', data)
      return data || []

    } catch (error) {
      console.error('❌ Respect flow fetch error:', error)
      return []
    }
  },

  // Top artists getir
  getTopArtists: async (limit = 5) => {
    try {
      console.log('🏆 Fetching top artists...')
      
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      console.log('✅ Top artists fetched:', data)
      return data || []

    } catch (error) {
      console.error('❌ Top artists fetch error:', error)
      return []
    }
  },

  // Top songs getir
  getTopSongs: async (limit = 5) => {
    try {
      console.log('🎵 Fetching top songs...')
      
      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          artists(name, avatar_url)
        `)
        .order('total_respect', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      console.log('✅ Top songs fetched:', data)
      return data || []

    } catch (error) {
      console.error('❌ Top songs fetch error:', error)
      return []
    }
  },

  // Feed item oluştur
  createFeedItem: async (type, artistId = null, songId = null, content = {}) => {
    try {
      console.log('📝 Creating feed item:', { type, artistId, songId, content })
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      console.log('👤 Current user for feed item:', user.id)

      // Önce feed_items tablosunun yapısını kontrol edelim
      const { data: tableInfo, error: tableError } = await supabase
        .from('feed_items')
        .select('*')
        .limit(1)

      console.log('📊 Feed items table structure check:', tableInfo, tableError)

      const feedItemData = {
        type,
        user_id: user.id,
        artist_id: artistId,
        song_id: songId,
        content
      }

      console.log('📝 Inserting feed item data:', feedItemData)

      const { data, error } = await supabase
        .from('feed_items')
        .insert(feedItemData)
        .select()
        .single()

      if (error) {
        console.error('❌ Feed item insert error:', error)
        throw error
      }

      console.log('✅ Feed item created:', data)
      return { data, error: null }

    } catch (error) {
      console.error('❌ Feed item creation error:', error)
      return { data: null, error }
    }
  },

  // Respect gönderildiğinde feed item oluştur
  createRespectFeedItem: async (artistId, songId, amount, message) => {
    return await feedService.createFeedItem('respect_sent', artistId, songId, {
      amount,
      message
    })
  },

  // Şarkı favorilendiğinde feed item oluştur
  createSongFavoritedFeedItem: async (songId) => {
    return await feedService.createFeedItem('song_favorited', null, songId)
  },

  // Sanatçı takip edildiğinde feed item oluştur
  createArtistFollowedFeedItem: async (artistId) => {
    return await feedService.createFeedItem('artist_followed', artistId)
  }
}

export default feedService 