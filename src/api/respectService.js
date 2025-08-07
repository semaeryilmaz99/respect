import { supabase } from '../config/supabase'

// Respect service
const respectService = {
  // Send respect to artist
  sendRespectToArtist: async (artistId, amount, message = null) => {
    try {
      console.log('💰 Sending respect to artist:', artistId, 'amount:', amount)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      // Respect transaction'ı işle
      const { data, error } = await supabase.rpc('process_respect_transaction', {
        p_from_user_id: user.id,
        p_to_artist_id: artistId,
        p_song_id: null,
        p_amount: amount,
        p_message: message,
        p_transaction_type: 'artist'
      })

      if (error) {
        throw error
      }

      console.log('✅ Respect sent to artist successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Send respect to artist error:', error)
      return { data: null, error }
    }
  },

  // Send respect to song
  sendRespectToSong: async (songId, amount, message = null) => {
    try {
      console.log('💰 Sending respect to song:', songId, 'amount:', amount)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      // Önce şarkının artist_id'sini al
      const { data: song, error: songError } = await supabase
        .from('songs')
        .select('artist_id')
        .eq('id', songId)
        .single()

      if (songError) {
        throw songError
      }

      // Respect transaction'ı işle
      const { data, error } = await supabase.rpc('process_respect_transaction', {
        p_from_user_id: user.id,
        p_to_artist_id: song.artist_id,
        p_song_id: songId,
        p_amount: amount,
        p_message: message,
        p_transaction_type: 'song'
      })

      if (error) {
        throw error
      }

      console.log('✅ Respect sent to song successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Send respect to song error:', error)
      return { data: null, error }
    }
  },

  // Get user's respect balance
  getRespectBalance: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('respect_balance, total_respect_sent, total_respect_received')
        .eq('id', user.id)
        .single()

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Get respect balance error:', error)
      return { data: null, error }
    }
  },

  // Get respect transaction history
  getRespectHistory: async (page = 1, limit = 20, type = 'all') => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      let query = supabase
        .from('respect_transactions')
        .select(`
          *,
          artists (name, avatar_url),
          songs (title, cover_url)
        `)
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (type !== 'all') {
        query = query.eq('transaction_type', type)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Get respect history error:', error)
      return { data: null, error }
    }
  },

  // Claim daily respect bonus
  claimDailyBonus: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      // Günlük bonus miktarı (100 respect)
      const bonusAmount = 100

      const { data, error } = await supabase
        .from('daily_bonuses')
        .insert({
          user_id: user.id,
          bonus_amount: bonusAmount,
          bonus_type: 'daily_login'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Bugün zaten bonus aldınız')
        }
        throw error
      }

      // Kullanıcının respect balance'ını güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          respect_balance: supabase.rpc('increment', { amount: bonusAmount })
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      console.log('✅ Daily bonus claimed successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Claim daily bonus error:', error)
      return { data: null, error }
    }
  },

  // Get daily bonus status
  getDailyBonusStatus: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('daily_bonuses')
        .select('*')
        .eq('user_id', user.id)
        .eq('claim_date', today)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      const canClaim = !data
      return { 
        data: { 
          canClaim, 
          lastClaimed: data?.claimed_at || null 
        }, 
        error: null 
      }
    } catch (error) {
      console.error('❌ Get daily bonus status error:', error)
      return { data: null, error }
    }
  },

  // Get respect given to specific artist
  getRespectGivenToArtist: async (artistId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('respect_transactions')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('to_artist_id', artistId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Get respect given to artist error:', error)
      return { data: null, error }
    }
  },

  // Get respect given to specific song
  getRespectGivenToSong: async (songId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      const { data, error } = await supabase
        .from('respect_transactions')
        .select('*')
        .eq('from_user_id', user.id)
        .eq('song_id', songId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Get respect given to song error:', error)
      return { data: null, error }
    }
  },

  // Add respect to user balance (for dummy purchase)
  addRespectToBalance: async (amount) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Kullanıcı giriş yapmamış')
      }

      // Önce mevcut balance'ı al
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('respect_balance')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const newBalance = (currentProfile.respect_balance || 0) + amount

      // Yeni balance'ı güncelle
      const { data, error } = await supabase
        .from('profiles')
        .update({
          respect_balance: newBalance
        })
        .eq('id', user.id)
        .select('respect_balance')
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Respect balance updated successfully')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Add respect to balance error:', error)
      return { data: null, error }
    }
  }
}

export default respectService 