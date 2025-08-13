// Debug script for 406 error
// This script tests the exact query that's causing the issue

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug406Error() {
  console.log('🔍 Debugging 406 Error')
  console.log('=' .repeat(50))

  try {
    // 1. Test basic connection
    console.log('1. Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('artists')
      .select('id, name')
      .limit(1)
    
    if (testError) {
      console.error('❌ Basic connection failed:', testError)
      return
    }
    console.log('✅ Basic connection works')

    // 2. Test artist_follows table access
    console.log('\n2. Testing artist_follows table access...')
    const { data: followsData, error: followsError } = await supabase
      .from('artist_follows')
      .select('id')
      .limit(1)
    
    if (followsError) {
      console.error('❌ artist_follows access failed:', followsError)
      console.log('🔍 Error details:', {
        code: followsError.code,
        message: followsError.message,
        details: followsError.details,
        hint: followsError.hint
      })
    } else {
      console.log('✅ artist_follows access works')
    }

    // 3. Test the exact query from the error
    console.log('\n3. Testing exact query from error...')
    const userId = 'd6jk-nohc-4eb4-a306-011225cfd6c1' // Example user ID
    const artistId = '78aa0aab-dac0-493e-a472-050e3baf3e01' // Example artist ID
    
    const { data: exactData, error: exactError } = await supabase
      .from('artist_follows')
      .select('id')
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .single()
    
    if (exactError) {
      console.error('❌ Exact query failed:', exactError)
      console.log('🔍 Exact error details:', {
        code: exactError.code,
        message: exactError.message,
        details: exactError.details,
        hint: exactError.hint
      })
    } else {
      console.log('✅ Exact query works')
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'artist_follows' })
      .catch(() => ({ data: null, error: 'RPC not available' }))
    
    if (policiesError) {
      console.log('⚠️  Could not check policies via RPC, checking manually...')
    } else {
      console.log('📋 Current policies:', policies)
    }

    // 5. Test with different user context
    console.log('\n5. Testing with authentication context...')
    console.log('⚠️  This would require a valid user session')
    console.log('   The 406 error might be due to missing authentication')

    // 6. Check table structure
    console.log('\n6. Checking table structure...')
    const { data: structure, error: structureError } = await supabase
      .from('artist_follows')
      .select('*')
      .limit(0)
    
    if (structureError) {
      console.error('❌ Table structure check failed:', structureError)
    } else {
      console.log('✅ Table structure is accessible')
    }

    // 7. Test with different select fields
    console.log('\n7. Testing different select patterns...')
    const testQueries = [
      { name: 'Select all', query: () => supabase.from('artist_follows').select('*').limit(1) },
      { name: 'Select specific fields', query: () => supabase.from('artist_follows').select('id, user_id, artist_id').limit(1) },
      { name: 'Select with join', query: () => supabase.from('artist_follows').select('id, artists(name)').limit(1) }
    ]

    for (const test of testQueries) {
      try {
        const { data, error } = await test.query()
        if (error) {
          console.log(`❌ ${test.name} failed:`, error.message)
        } else {
          console.log(`✅ ${test.name} works`)
        }
      } catch (err) {
        console.log(`❌ ${test.name} exception:`, err.message)
      }
    }

    console.log('\n📝 Summary:')
    console.log('- If basic connection works but artist_follows fails, it\'s likely RLS')
    console.log('- If exact query fails, check authentication and user context')
    console.log('- 406 usually means the request is not acceptable due to policies or auth')

  } catch (error) {
    console.error('❌ Debug script failed:', error)
  }
}

// Run the debug
debug406Error()
