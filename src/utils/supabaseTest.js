import { supabase } from '../config/supabase'

// Supabase bağlantı test fonksiyonları
export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // 1. Basic connection test
    console.log('📡 Testing basic connection...')
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Basic connection failed:', error)
      return { success: false, error: 'Basic connection failed', details: error }
    }
    
    console.log('✅ Basic connection successful')
    
    // 2. Auth test
    console.log('🔐 Testing authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth test failed:', authError)
      return { success: false, error: 'Auth test failed', details: authError }
    }
    
    console.log('✅ Auth test successful, user:', user ? 'Logged in' : 'Not logged in')
    
    // 3. Database function test
    console.log('⚙️ Testing database functions...')
    const { data: funcTest, error: funcError } = await supabase
      .rpc('get_user_respect_stats', { p_user_id: user?.id || '00000000-0000-0000-0000-000000000000' })
    
    if (funcError) {
      console.error('❌ Database function test failed:', funcError)
      return { success: false, error: 'Database function test failed', details: funcError }
    }
    
    console.log('✅ Database function test successful')
    
    // 4. Table structure test
    console.log('📊 Testing table structure...')
    const tables = ['profiles', 'artists', 'songs', 'respect_transactions', 'feed_items']
    
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (tableError) {
          console.error(`❌ Table ${table} test failed:`, tableError)
        } else {
          console.log(`✅ Table ${table} accessible`)
        }
      } catch (err) {
        console.error(`❌ Table ${table} error:`, err)
      }
    }
    
    return { 
      success: true, 
      message: 'All tests passed',
      user: user ? 'Logged in' : 'Not logged in'
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return { success: false, error: 'Connection test failed', details: error }
  }
}

// Respect transaction test
export const testRespectTransaction = async (userId, artistId, amount = 10) => {
  console.log('🧪 Testing respect transaction...')
  
  try {
    const { data, error } = await supabase.rpc('process_respect_transaction', {
      p_from_user_id: userId,
      p_to_artist_id: artistId,
      p_song_id: null,
      p_amount: amount,
      p_message: 'Test transaction',
      p_transaction_type: 'artist'
    })
    
    if (error) {
      console.error('❌ Respect transaction failed:', error)
      return { success: false, error: 'Respect transaction failed', details: error }
    }
    
    console.log('✅ Respect transaction successful:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Respect transaction error:', error)
    return { success: false, error: 'Respect transaction error', details: error }
  }
}

// Debug respect transaction
export const debugRespectTransaction = async (userId, artistId, amount = 10) => {
  console.log('🔍 Debugging respect transaction...')
  
  try {
    const { data, error } = await supabase.rpc('debug_respect_transaction', {
      p_from_user_id: userId,
      p_to_artist_id: artistId,
      p_amount: amount
    })
    
    if (error) {
      console.error('❌ Debug respect transaction failed:', error)
      return { success: false, error: 'Debug respect transaction failed', details: error }
    }
    
    console.log('✅ Debug respect transaction results:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Debug respect transaction error:', error)
    return { success: false, error: 'Debug respect transaction error', details: error }
  }
}

// Table structure check
export const checkTableStructure = async () => {
  console.log('🔍 Checking table structure...')
  
  const tables = {
    profiles: ['id', 'username', 'full_name', 'respect_balance', 'total_respect_sent', 'total_respect_received'],
    artists: ['id', 'name', 'total_respect', 'followers_count'],
    songs: ['id', 'title', 'artist_id', 'total_respect'],
    respect_transactions: ['id', 'from_user_id', 'to_artist_id', 'song_id', 'amount', 'transaction_type'],
    feed_items: ['id', 'type', 'user_id', 'artist_id', 'song_id', 'content', 'is_public', 'is_personal']
  }
  
  const results = {}
  
  for (const [tableName, expectedColumns] of Object.entries(tables)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        results[tableName] = { success: false, error: error.message }
      } else {
        results[tableName] = { success: true, columns: Object.keys(data[0] || {}) }
      }
    } catch (err) {
      results[tableName] = { success: false, error: err.message }
    }
  }
  
  console.log('📊 Table structure results:', results)
  return results
} 