import { supabase } from '../config/supabase'

/**
 * Sync user's Spotify playlist data to artists and songs tables
 * This replaces mock data with real data from user's playlists
 */
export const syncUserSpotifyData = async (userId) => {
  try {
    console.log('🔄 Starting Spotify user data sync for user:', userId)
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('No active session found')
    }

    // Call the Supabase Edge Function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/spotify-sync-user-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabase.supabaseKey
      },
      body: JSON.stringify({
        userId: userId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Spotify user data sync completed successfully')
      console.log(`📊 Processed: ${result.processed}, Failed: ${result.failed}`)
      return {
        success: true,
        processed: result.processed,
        failed: result.failed,
        message: `Successfully synced ${result.processed} items from your Spotify playlists`
      }
    } else {
      console.error('❌ Spotify user data sync failed:', result.error)
      return {
        success: false,
        error: result.error,
        message: 'Failed to sync Spotify data'
      }
    }
  } catch (error) {
    console.error('❌ Error in syncUserSpotifyData:', error)
    return {
      success: false,
      error: error.message,
      message: 'An error occurred while syncing Spotify data'
    }
  }
}

/**
 * Check if user has Spotify connection
 */
export const checkSpotifyConnection = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return { hasConnection: false, error: error.message }
    }

    return { hasConnection: true, connection: data }
  } catch (error) {
    console.error('Error checking Spotify connection:', error)
    return { hasConnection: false, error: error.message }
  }
}

/**
 * Get sync status for user
 */
export const getSyncStatus = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('spotify_sync_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_type', 'user_playlist_data')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { hasSyncHistory: false, error: error.message }
    }

    // Sync'in ne kadar süre geçerli olduğunu hesapla
    const syncAge = new Date() - new Date(data.created_at)
    const oneWeek = 7 * 24 * 60 * 60 * 1000 // 1 hafta
    
    // Spotify verileri genellikle haftalık olarak güncellenir, bu yüzden 1 hafta geçerli
    const isRecent = syncAge < oneWeek
    
    // Sync yaşını gün cinsinden hesapla (debug için)
    const daysSinceSync = Math.floor(syncAge / (24 * 60 * 60 * 1000))
    
    console.log(`📅 Last sync: ${daysSinceSync} days ago, isRecent: ${isRecent}`)
    
    return { 
      hasSyncHistory: true, 
      lastSync: data,
      isRecent: isRecent,
      daysSinceSync: daysSinceSync,
      syncAge: syncAge
    }
  } catch (error) {
    console.error('Error getting sync status:', error)
    return { hasSyncHistory: false, error: error.message }
  }
}
