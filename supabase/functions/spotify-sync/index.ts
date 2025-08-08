import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import SpotifyWebApi from 'https://esm.sh/spotify-web-api-node@5.0.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Environment variables - Doğrudan tanımlanmış
const SPOTIFY_CLIENT_ID = '0c57904463b9424f88e33d3e644e16da'
const SPOTIFY_CLIENT_SECRET = 'your_spotify_client_secret_here' // Gerçek Client Secret'ınızı buraya yazın

serve(async (req) => {
  console.log('🔧 Spotify Sync Function called')
  console.log('🔧 Method:', req.method)
  console.log('🔧 URL:', req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling OPTIONS request')
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log('🔧 Initializing Supabase client')
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    console.log('🔧 Getting request body')
    // Get request body
    const { userId, syncType } = await req.json()

    if (!userId || !syncType) {
      throw new Error('Missing required parameters: userId, syncType')
    }

    console.log('🔧 Getting user Spotify connection')
    // Get user's Spotify connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('spotify_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      throw new Error('Spotify connection not found')
    }

    console.log('🔧 Checking token expiration')
    // Check if token is expired and refresh if needed
    let accessToken = connection.access_token
    if (new Date() > new Date(connection.token_expires_at)) {
      console.log('🔧 Token expired, refreshing...')
      const spotifyApiForRefresh = new SpotifyWebApi({
        clientId: SPOTIFY_CLIENT_ID,
        clientSecret: SPOTIFY_CLIENT_SECRET,
        refreshToken: connection.refresh_token
      })

      const tokenData = await spotifyApiForRefresh.refreshAccessToken()
      accessToken = tokenData.body.access_token

      // Update the connection
      await supabaseClient
        .from('spotify_connections')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + tokenData.body.expires_in * 1000)
        })
        .eq('user_id', userId)
    }

    console.log('🔧 Initializing Spotify API')
    // Initialize Spotify API
    const spotifyApi = new SpotifyWebApi({
      accessToken: accessToken
    })

    let syncResult

    console.log('🔧 Executing sync based on type:', syncType)
    // Execute sync based on type
    switch (syncType) {
      case 'artist_profile':
        syncResult = await syncArtistProfile(supabaseClient, spotifyApi, userId)
        break
      case 'artist_songs':
        syncResult = await syncArtistSongs(supabaseClient, spotifyApi, userId)
        break
      case 'artist_albums':
        syncResult = await syncArtistAlbums(supabaseClient, spotifyApi, userId)
        break
      default:
        throw new Error('Invalid sync type. Must be: artist_profile, artist_songs, or artist_albums')
    }

    console.log('🔧 Logging sync activity')
    // Log sync activity
    await supabaseClient
      .from('spotify_sync_logs')
      .insert({
        user_id: userId,
        sync_type: syncType,
        status: syncResult.success ? 'success' : 'error',
        items_processed: syncResult.processed,
        items_failed: syncResult.failed,
        error_message: syncResult.error
      })

    console.log('🔧 Success! Returning response')
    return new Response(
      JSON.stringify(syncResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Spotify sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        processed: 0, 
        failed: 1, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Sync artist profile
async function syncArtistProfile(supabase: any, spotifyApi: any, userId: string) {
  try {
    console.log('Syncing artist profile for user:', userId)
    
    const profile = await spotifyApi.getMe()
    
    // Update or insert artist record
    const { error } = await supabase
      .from('artists')
      .upsert({
        user_id: userId,
        name: profile.body.display_name,
        avatar_url: profile.body.images?.[0]?.url,
        spotify_id: profile.body.id,
        bio: `Spotify Artist: ${profile.body.display_name}`,
        verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error syncing artist profile:', error)
      throw error
    }

    console.log('Artist profile synced successfully')
    return { success: true, processed: 1, failed: 0 }
  } catch (error) {
    console.error('Artist profile sync error:', error)
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}

// Sync artist songs
async function syncArtistSongs(supabase: any, spotifyApi: any, userId: string) {
  try {
    console.log('Syncing artist songs for user:', userId)
    
    const profile = await spotifyApi.getMe()
    const tracks = await spotifyApi.getArtistTopTracks(profile.body.id, 'TR')
    
    let processed = 0
    let failed = 0

    for (const track of tracks.body.tracks) {
      try {
        // Check if song already exists
        const { data: existingSong } = await supabase
          .from('songs')
          .select('id')
          .eq('spotify_id', track.id)
          .single()

        if (existingSong) {
          console.log('Song already exists:', track.name)
          processed++
          continue
        }

        // Insert new song
        const { error } = await supabase
          .from('songs')
          .insert({
            title: track.name,
            album: track.album.name,
            duration: track.duration_ms,
            cover_url: track.album.images?.[0]?.url,
            spotify_id: track.id,
            artist_id: userId,
            total_respect: 0,
            favorites_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error inserting song:', track.name, error)
          failed++
        } else {
          console.log('Song synced:', track.name)
          processed++
        }
      } catch (error) {
        console.error('Error processing song:', track.name, error)
        failed++
      }
    }

    console.log(`Songs sync completed: ${processed} processed, ${failed} failed`)
    return { success: true, processed, failed }
  } catch (error) {
    console.error('Artist songs sync error:', error)
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}

// Sync artist albums
async function syncArtistAlbums(supabase: any, spotifyApi: any, userId: string) {
  try {
    console.log('Syncing artist albums for user:', userId)
    
    const profile = await spotifyApi.getMe()
    const albums = await spotifyApi.getArtistAlbums(profile.body.id, {
      include_groups: 'album,single',
      limit: 50
    })
    
    let processed = 0
    let failed = 0

    for (const album of albums.body.items) {
      try {
        // Check if album already exists
        const { data: existingAlbum } = await supabase
          .from('albums')
          .select('id')
          .eq('spotify_id', album.id)
          .single()

        if (existingAlbum) {
          console.log('Album already exists:', album.name)
          processed++
          continue
        }

        // Insert new album
        const { error } = await supabase
          .from('albums')
          .insert({
            title: album.name,
            cover_url: album.images?.[0]?.url,
            spotify_id: album.id,
            artist_id: userId,
            release_date: album.release_date,
            total_tracks: album.total_tracks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error inserting album:', album.name, error)
          failed++
        } else {
          console.log('Album synced:', album.name)
          processed++
        }
      } catch (error) {
        console.error('Error processing album:', album.name, error)
        failed++
      }
    }

    console.log(`Albums sync completed: ${processed} processed, ${failed} failed`)
    return { success: true, processed, failed }
  } catch (error) {
    console.error('Artist albums sync error:', error)
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
} 