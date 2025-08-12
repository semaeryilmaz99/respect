// Test script to verify Spotify playlist sync fixes
// Run this in the browser console after logging in

import { playlistService } from './src/api/playlistService.js';

// Test function to check Spotify connection and sync playlists
async function testSpotifyPlaylistSync() {
  try {
    console.log('🧪 Testing Spotify playlist sync...');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }
    
    console.log('👤 User:', user.id);
    
    // Check Spotify connection
    console.log('🔍 Checking Spotify connection...');
    const connectionStatus = await playlistService.checkSpotifyConnection(user.id);
    
    if (!connectionStatus.connected) {
      console.error('❌ Spotify not connected:', connectionStatus.error);
      console.log('💡 Please connect your Spotify account first');
      return;
    }
    
    console.log('✅ Spotify connected successfully');
    
    // Try to sync playlists
    console.log('🔄 Syncing playlists...');
    const syncResult = await playlistService.syncUserPlaylists(user.id);
    console.log('✅ Sync result:', syncResult);
    
    // Get playlists
    console.log('📋 Getting playlists...');
    const playlists = await playlistService.getUserPlaylists(user.id);
    console.log('✅ Playlists:', playlists.length, 'found');
    
    // Get stats
    console.log('📊 Getting stats...');
    const stats = await playlistService.getPlaylistStats(user.id);
    console.log('✅ Stats:', stats);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console
window.testSpotifyPlaylistSync = testSpotifyPlaylistSync;
console.log('🧪 Test function available: testSpotifyPlaylistSync()');
