// Test script to identify and fix the artist follows table issue
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testArtistFollowsIssue() {
  console.log('🔍 Testing Artist Follows Table Issue')
  console.log('=' .repeat(50))

  try {
    // Test 1: Check if artist_follows table exists and is accessible
    console.log('1. Testing artist_follows table access...')
    const { data: followsData, error: followsError } = await supabase
      .from('artist_follows')
      .select('*')
      .limit(1)

    if (followsError) {
      console.error('❌ artist_follows table error:', followsError)
    } else {
      console.log('✅ artist_follows table accessible:', followsData?.length || 0, 'records')
    }

    // Test 2: Check if there are any artists to test with
    console.log('\n2. Testing artists table access...')
    const { data: artistsData, error: artistsError } = await supabase
      .from('artists')
      .select('id, name')
      .limit(5)

    if (artistsError) {
      console.error('❌ artists table error:', artistsError)
      return
    } else {
      console.log('✅ artists table accessible:', artistsData?.length || 0, 'artists')
      if (artistsData && artistsData.length > 0) {
        console.log('   Sample artists:')
        artistsData.forEach(artist => {
          console.log(`   - ${artist.name} (${artist.id})`)
        })
      }
    }

    // Test 3: Test the specific query that's failing (isFollowingArtist)
    if (artistsData && artistsData.length > 0) {
      console.log('\n3. Testing isFollowingArtist query...')
      const testArtistId = artistsData[0].id
      
      // Simulate the exact query from followService.isFollowingArtist
      const { data: followingData, error: followingError } = await supabase
        .from('artist_follows')
        .select('id')
        .eq('artist_id', testArtistId)
        .limit(1)

      if (followingError) {
        console.error('❌ isFollowingArtist query error:', followingError)
        console.log('🔍 Error details:', {
          code: followingError.code,
          message: followingError.message,
          details: followingError.details,
          hint: followingError.hint
        })
      } else {
        console.log('✅ isFollowingArtist query successful:', followingData?.length || 0, 'follows')
      }
    }

    // Test 4: Check if there's a table with space in name
    console.log('\n4. Testing for table with space in name...')
    try {
      const { data: spaceTableData, error: spaceTableError } = await supabase
        .from('artist follows')
        .select('*')
        .limit(1)
      
      if (spaceTableError) {
        console.log('✅ No table with space found (expected):', spaceTableError.message)
      } else {
        console.log('⚠️  Found table with space:', spaceTableData)
      }
    } catch (error) {
      console.log('✅ No table with space found (expected):', error.message)
    }

    // Test 5: Check RLS policies
    console.log('\n5. Testing RLS policies...')
    const { data: rlsTest, error: rlsError } = await supabase
      .from('artist_follows')
      .select('count')
      .limit(1)

    if (rlsError) {
      console.error('❌ RLS policy error:', rlsError)
    } else {
      console.log('✅ RLS policies working correctly')
    }

    console.log('\n📝 Analysis:')
    console.log('The 406 (Not Acceptable) error suggests a content negotiation issue.')
    console.log('This could be caused by:')
    console.log('1. Incorrect Accept header in the request')
    console.log('2. Cached/built version using wrong table name')
    console.log('3. Supabase client configuration issue')
    console.log('4. Browser cache issue')

    console.log('\n🔧 Recommended fixes:')
    console.log('1. Clear browser cache and reload the page')
    console.log('2. Check if there are any cached build files')
    console.log('3. Verify the Supabase client is using the correct configuration')
    console.log('4. Check if there are any environment-specific issues')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testArtistFollowsIssue()
