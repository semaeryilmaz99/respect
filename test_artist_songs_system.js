// Test Artist Songs System
// Bu dosya yeni eklenen sanatçı şarkıları sistemini test etmek için kullanılır

import { supabase } from './src/config/supabase.js'
import userService from './src/api/userService.js'

// Test fonksiyonları
async function testArtistDetection() {
  console.log('🎭 Testing Artist Detection System...')
  
  try {
    // Test user ID (gerçek bir user ID ile değiştirin)
    const testUserId = 'test-user-id'
    
    // 1. Kullanıcının sanatçı olup olmadığını kontrol et
    console.log('1. Checking if user is artist...')
    const isArtist = await userService.isUserArtist(testUserId)
    console.log('✅ User artist status:', isArtist)
    
    // 2. Sanatçı ise kendi şarkılarını getir
    if (isArtist) {
      console.log('2. Fetching user artist songs...')
      const artistSongs = await userService.getUserArtistSongs(testUserId, 5)
      console.log('✅ Artist songs:', artistSongs)
    } else {
      console.log('2. Fetching user playlist songs...')
      const playlistSongs = await userService.getUserPlaylistSongs(testUserId, 5)
      console.log('✅ Playlist songs:', playlistSongs)
    }
    
    console.log('🎉 Artist detection test completed successfully!')
    
  } catch (error) {
    console.error('❌ Artist detection test failed:', error)
  }
}

async function testDatabaseFunctions() {
  console.log('🗄️ Testing Database Functions...')
  
  try {
    // Test user ID (gerçek bir user ID ile değiştirin)
    const testUserId = 'test-user-id'
    
    // 1. Database fonksiyonlarını test et
    console.log('1. Testing is_user_artist function...')
    const { data: artistStatus, error: artistError } = await supabase
      .rpc('is_user_artist', { user_uuid: testUserId })
    
    if (artistError) {
      console.error('❌ Artist status function error:', artistError)
    } else {
      console.log('✅ Artist status function result:', artistStatus)
    }
    
    // 2. Sanatçı şarkıları fonksiyonunu test et
    if (artistStatus) {
      console.log('2. Testing get_user_artist_songs function...')
      const { data: artistSongs, error: songsError } = await supabase
        .rpc('get_user_artist_songs', { user_uuid: testUserId })
      
      if (songsError) {
        console.error('❌ Artist songs function error:', songsError)
      } else {
        console.log('✅ Artist songs function result:', artistSongs)
      }
    } else {
      console.log('2. Testing get_user_playlist_songs function...')
      const { data: playlistSongs, error: playlistError } = await supabase
        .rpc('get_user_playlist_songs', { user_uuid: testUserId })
      
      if (playlistError) {
        console.error('❌ Playlist songs function error:', playlistError)
      } else {
        console.log('✅ Playlist songs function result:', playlistSongs)
      }
    }
    
    // 3. View'ları test et
    console.log('3. Testing user_artist_status view...')
    const { data: artistStatusView, error: viewError } = await supabase
      .from('user_artist_status')
      .select('*')
      .eq('user_id', testUserId)
      .single()
    
    if (viewError) {
      console.error('❌ Artist status view error:', viewError)
    } else {
      console.log('✅ Artist status view result:', artistStatusView)
    }
    
    console.log('🎉 Database functions test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database functions test failed:', error)
  }
}

async function testSpotifyIntegration() {
  console.log('🎵 Testing Spotify Integration...')
  
  try {
    // Bu test için gerçek Spotify access token gerekli
    const accessToken = 'your-access-token-here'
    
    if (accessToken === 'your-access-token-here') {
      console.log('⚠️ Please provide a valid Spotify access token to test integration')
      return
    }
    
    // Spotify service'i import et (ES6 module olarak)
    const SpotifyService = (await import('./src/api/spotifyService.js')).default
    
    // 1. Kullanıcının sanatçı olup olmadığını kontrol et
    console.log('1. Checking Spotify user artist status...')
    const artistStatus = await SpotifyService.checkUserArtistStatus(accessToken)
    console.log('✅ Spotify artist status:', artistStatus)
    
    // 2. Sanatçı ise kendi şarkılarını getir
    if (artistStatus.isArtist) {
      console.log('2. Fetching Spotify user own artist songs...')
      const ownSongs = await SpotifyService.getUserOwnArtistSongs(accessToken, 5)
      console.log('✅ Spotify own artist songs:', ownSongs)
    } else {
      console.log('2. Fetching Spotify user playlist songs...')
      const playlistSongs = await SpotifyService.getUserPlaylistSongs(accessToken, 5)
      console.log('✅ Spotify playlist songs:', playlistSongs)
    }
    
    console.log('🎉 Spotify integration test completed successfully!')
    
  } catch (error) {
    console.error('❌ Spotify integration test failed:', error)
  }
}

// Ana test fonksiyonu
async function runAllTests() {
  console.log('🚀 Starting Artist Songs System Tests...\n')
  
  try {
    await testArtistDetection()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await testDatabaseFunctions()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await testSpotifyIntegration()
    console.log('\n' + '='.repeat(50) + '\n')
    
    console.log('🎉 All tests completed!')
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
  }
}

// Test'leri çalıştır (eğer bu dosya doğrudan çalıştırılıyorsa)
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
}

export {
  testArtistDetection,
  testDatabaseFunctions,
  testSpotifyIntegration,
  runAllTests
}
