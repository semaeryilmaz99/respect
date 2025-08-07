// Test file to verify Supabase connection
import { supabase } from './config/supabase.js'

async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Connection error:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('📊 Session data:', data)
    return true
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message)
    return false
  }
}

export default testSupabaseConnection 