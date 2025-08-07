import { supabase } from '../config/supabase'

// Respect Statistics Service
const respectStatsService = {
  // Get user respect statistics
  getUserRespectStats: async (userId) => {
    try {
      console.log('📊 Getting respect stats for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          respect_balance,
          total_respect_sent,
          total_respect_received
        `)
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      // Calculate total activity
      const totalRespectActivity = (data.total_respect_sent || 0) + (data.total_respect_received || 0)

      const stats = {
        ...data,
        total_respect_activity: totalRespectActivity
      }

      console.log('✅ User respect stats retrieved:', stats)
      return { data: stats, error: null }
    } catch (error) {
      console.error('❌ Get user respect stats error:', error)
      return { data: null, error }
    }
  },

  // Subscribe to real-time respect statistics updates
  subscribeToRespectStats: (userId, callback) => {
    console.log('🔔 Subscribing to respect stats for user:', userId)
    
    const subscription = supabase
      .channel(`respect-stats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('📊 Respect stats updated:', payload.new)
          
          // Calculate total activity
          const totalRespectActivity = (payload.new.total_respect_sent || 0) + (payload.new.total_respect_received || 0)
          
          const updatedStats = {
            ...payload.new,
            total_respect_activity: totalRespectActivity
          }
          
          callback(updatedStats)
        }
      )
      .subscribe()

    return subscription
  },

  // Get respect statistics for multiple users
  getMultipleUserRespectStats: async (userIds) => {
    try {
      console.log('📊 Getting respect stats for multiple users:', userIds)
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          respect_balance,
          total_respect_sent,
          total_respect_received
        `)
        .in('id', userIds)

      if (error) {
        throw error
      }

      // Calculate total activity for each user
      const statsWithActivity = data.map(user => ({
        ...user,
        total_respect_activity: (user.total_respect_sent || 0) + (user.total_respect_received || 0)
      }))

      console.log('✅ Multiple user respect stats retrieved:', statsWithActivity)
      return { data: statsWithActivity, error: null }
    } catch (error) {
      console.error('❌ Get multiple user respect stats error:', error)
      return { data: null, error }
    }
  },

  // Get top respect senders
  getTopRespectSenders: async (limit = 10) => {
    try {
      console.log('🏆 Getting top respect senders, limit:', limit)
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          total_respect_sent,
          respect_balance
        `)
        .order('total_respect_sent', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      console.log('✅ Top respect senders retrieved:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get top respect senders error:', error)
      return { data: null, error }
    }
  },

  // Get respect statistics summary
  getRespectStatsSummary: async () => {
    try {
      console.log('📈 Getting respect statistics summary')
      
      const { data, error } = await supabase
        .rpc('get_respect_stats_summary')

      if (error) {
        throw error
      }

      console.log('✅ Respect stats summary retrieved:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get respect stats summary error:', error)
      return { data: null, error }
    }
  },

  // Update user respect balance (for testing/debugging)
  updateUserRespectBalance: async (userId, newBalance) => {
    try {
      console.log('💰 Updating respect balance for user:', userId, 'new balance:', newBalance)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ respect_balance: newBalance })
        .eq('id', userId)
        .select('respect_balance')
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Respect balance updated:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Update respect balance error:', error)
      return { data: null, error }
    }
  },

  // Test real-time subscription (for debugging)
  testRealtimeSubscription: async (userId) => {
    try {
      console.log('🧪 Testing real-time subscription for user:', userId)
      
      // First, get current stats
      const { data: currentStats, error: currentError } = await supabase
        .from('profiles')
        .select('respect_balance, total_respect_sent, total_respect_received')
        .eq('id', userId)
        .single()

      if (currentError) {
        throw currentError
      }

      console.log('📊 Current stats:', currentStats)

      // Update respect balance to trigger real-time update
      const newBalance = (currentStats.respect_balance || 0) + 100
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          respect_balance: newBalance,
          total_respect_sent: (currentStats.total_respect_sent || 0) + 50
        })
        .eq('id', userId)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Test update completed:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Test real-time subscription error:', error)
      return { data: null, error }
    }
  }
}

export default respectStatsService 