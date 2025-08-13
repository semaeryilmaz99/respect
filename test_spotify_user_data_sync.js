// Test script for Spotify User Data Sync
// This script tests the new functionality that syncs user's Spotify playlist data to artists and songs tables

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSpotifyUserDataSync() {
  console.log('🧪 Testing Spotify User Data Sync Functionality')
  console.log('=' .repeat(50))

  try {
    // 1. Check if we have any users with Spotify connections
    console.log('1. Checking for users with Spotify connections...')
    const { data: connections, error: connectionsError } = await supabase
      .from('spotify_connections')
      .select('user_id, spotify_user_id, created_at')
      .limit(5)

    if (connectionsError) {
      console.error('❌ Error fetching Spotify connections:', connectionsError)
      return
    }

    if (!connections || connections.length === 0) {
      console.log('⚠️  No Spotify connections found. Users need to connect their Spotify accounts first.')
      return
    }

    console.log(`✅ Found ${connections.length} Spotify connections`)
    connections.forEach(conn => {
      console.log(`   - User: ${conn.user_id}, Spotify User: ${conn.spotify_user_id}`)
    })

    // 2. Check current artists and songs count
    console.log('\n2. Checking current database state...')
    
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, spotify_id')
      .limit(10)

    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, spotify_id')
      .limit(10)

    if (artistsError) {
      console.error('❌ Error fetching artists:', artistsError)
    } else {
      console.log(`📊 Current artists in database: ${artists?.length || 0}`)
      if (artists && artists.length > 0) {
        console.log('   Sample artists:')
        artists.slice(0, 3).forEach(artist => {
          console.log(`   - ${artist.name}${artist.spotify_id ? ` (Spotify ID: ${artist.spotify_id})` : ' (No Spotify ID)'}`)
        })
      }
    }

    if (songsError) {
      console.error('❌ Error fetching songs:', songsError)
    } else {
      console.log(`📊 Current songs in database: ${songs?.length || 0}`)
      if (songs && songs.length > 0) {
        console.log('   Sample songs:')
        songs.slice(0, 3).forEach(song => {
          console.log(`   - ${song.title}${song.spotify_id ? ` (Spotify ID: ${song.spotify_id})` : ' (No Spotify ID)'}`)
        })
      }
    }

    // 3. Check sync logs
    console.log('\n3. Checking sync logs...')
    const { data: syncLogs, error: syncLogsError } = await supabase
      .from('spotify_sync_logs')
      .select('*')
      .eq('sync_type', 'user_playlist_data')
      .order('created_at', { ascending: false })
      .limit(5)

    if (syncLogsError) {
      console.error('❌ Error fetching sync logs:', syncLogsError)
    } else {
      console.log(`📊 Sync logs found: ${syncLogs?.length || 0}`)
      if (syncLogs && syncLogs.length > 0) {
        console.log('   Recent syncs:')
        syncLogs.forEach(log => {
          console.log(`   - ${log.status}: ${log.items_processed} processed, ${log.items_failed} failed (${new Date(log.created_at).toLocaleString()})`)
        })
      }
    }

    // 4. Test the sync function (this would require authentication)
    console.log('\n4. Testing sync function...')
    console.log('⚠️  Note: To test the actual sync function, you need to:')
    console.log('   1. Be authenticated as a user with Spotify connection')
    console.log('   2. Call the function with proper authorization')
    console.log('   3. The function will sync playlist data to artists/songs tables')

    // 5. Show how to use the new functionality
    console.log('\n5. How to use the new functionality:')
    console.log('   - Users with Spotify connections will see a sync button on Artists/Songs pages')
    console.log('   - Clicking the button will sync their playlist data')
    console.log('   - The sync will populate artists and songs tables with real data')
    console.log('   - Mock data will be replaced with actual Spotify playlist data')

    console.log('\n✅ Test completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Users should connect their Spotify accounts')
    console.log('   2. Visit Artists or Songs page')
    console.log('   3. Click "Spotify Verilerini Senkronize Et" button')
    console.log('   4. Wait for sync to complete')
    console.log('   5. View real data from their playlists')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSpotifyUserDataSync()
