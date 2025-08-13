// Test script to check user session and authentication
// This will help identify why the user ID is malformed

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserSession() {
  console.log('🔍 Testing User Session and Authentication')
  console.log('=' .repeat(50))

  try {
    // 1. Check current session
    console.log('1. Checking current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return
    }
    
    if (!session) {
      console.log('⚠️  No active session found')
      console.log('   This means the user is not authenticated')
      console.log('   The 406 error might be due to missing authentication')
      return
    }
    
    console.log('✅ Active session found')
    console.log('🔍 Session user ID:', session.user.id)
    console.log('🔍 Session user email:', session.user.email)
    console.log('🔍 Session expires at:', session.expires_at)
    
    // 2. Validate user ID format
    console.log('\n2. Validating user ID format...')
    const userId = session.user.id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(userId)) {
      console.error('❌ Invalid user ID format:', userId)
      console.log('🔍 Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
      console.log('🔍 Actual format:', userId)
      console.log('🔍 Length:', userId.length)
      console.log('🔍 Type:', typeof userId)
    } else {
      console.log('✅ User ID format is valid')
    }
    
    // 3. Check user profile
    console.log('\n3. Checking user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
    } else {
      console.log('✅ User profile found:', profile)
    }
    
    // 4. Test artist_follows query with valid user ID
    console.log('\n4. Testing artist_follows query...')
    const { data: follows, error: followsError } = await supabase
      .from('artist_follows')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    if (followsError) {
      console.error('❌ artist_follows query error:', followsError)
    } else {
      console.log('✅ artist_follows query successful')
      console.log('📊 Follows count:', follows.length)
    }
    
    // 5. Check authentication headers
    console.log('\n5. Checking authentication headers...')
    console.log('🔍 Access token exists:', !!session.access_token)
    console.log('🔍 Access token length:', session.access_token?.length)
    console.log('🔍 Refresh token exists:', !!session.refresh_token)
    
    // 6. Test with a sample artist ID
    console.log('\n6. Testing with sample artist ID...')
    const sampleArtistId = '550e8400-e29b-41d4-a716-446655440001' // Sample from database
    
    const { data: sampleFollow, error: sampleError } = await supabase
      .from('artist_follows')
      .select('id')
      .eq('user_id', userId)
      .eq('artist_id', sampleArtistId)
      .single()
    
    if (sampleError && sampleError.code !== 'PGRST116') {
      console.error('❌ Sample query error:', sampleError)
    } else {
      console.log('✅ Sample query successful')
      console.log('📊 Is following sample artist:', !!sampleFollow)
    }
    
    console.log('\n📝 Summary:')
    if (session && uuidRegex.test(userId)) {
      console.log('✅ User session is valid and user ID format is correct')
      console.log('✅ The 406 error might be due to RLS policies or other issues')
    } else {
      console.log('❌ User session or user ID format is invalid')
      console.log('❌ This is likely the cause of the 406 error')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testUserSession()
