/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Environment variables
const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') ?? ''
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') ?? ''

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
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Missing required parameters: userId, syncType' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Getting user Spotify connection')
    // Get user's Spotify connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('spotify_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Spotify connection not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Checking token expiration')
    // Check if token is expired and refresh if needed
    let accessToken = connection.access_token
    if (new Date() > new Date(connection.token_expires_at)) {
      console.log('🔧 Token expired, refreshing via fetch...')
      if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        throw new Error('Spotify client credentials are not configured')
      }
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token
        })
      })
      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text()
        throw new Error(`Failed to refresh token: ${tokenResponse.status} ${errText}`)
      }
      const tokenJson = await tokenResponse.json()
      accessToken = tokenJson.access_token
      // Update the connection
      await supabaseClient
        .from('spotify_connections')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + tokenJson.expires_in * 1000)
        })
        .eq('user_id', userId)
    }

    let syncResult

    console.log('🔧 Executing sync based on type:', syncType)
    // Execute sync based on type
    switch (syncType) {
      case 'artist_profile':
        syncResult = await syncArtistProfile(supabaseClient, accessToken, userId)
        break
      case 'artist_songs':
        syncResult = await syncArtistSongs(supabaseClient, accessToken, userId)
        break
      case 'artist_albums':
        syncResult = await syncArtistAlbums(supabaseClient, accessToken, userId)
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
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Sync artist profile
async function syncArtistProfile(supabase: any, accessToken: string, userId: string) {
  try {
    console.log('Syncing artist profile for user:', userId)
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    if (!profileResponse.ok) {
      const errText = await profileResponse.text()
      throw new Error(`Failed to fetch profile: ${profileResponse.status} ${errText}`)
    }
    const profile = await profileResponse.json()
    
    // Update or insert artist record
    const { error } = await supabase
      .from('artists')
      .upsert({
        user_id: userId,
        name: profile.display_name,
        avatar_url: profile.images?.[0]?.url,
        spotify_id: profile.id,
        bio: `Spotify Artist: ${profile.display_name}`,
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
async function syncArtistSongs(supabase: any, accessToken: string, userId: string) {
  try {
    console.log('Syncing artist songs for user:', userId)
    const meResp = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    if (!meResp.ok) {
      const errText = await meResp.text()
      throw new Error(`Failed to fetch profile: ${meResp.status} ${errText}`)
    }
    const me = await meResp.json()
    const tracksResp = await fetch(`https://api.spotify.com/v1/artists/${me.id}/top-tracks?market=TR`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    if (!tracksResp.ok) {
      const errText = await tracksResp.text()
      throw new Error(`Failed to fetch top tracks: ${tracksResp.status} ${errText}`)
    }
    const tracks = await tracksResp.json()
    
    let processed = 0
    let failed = 0

    for (const track of tracks.tracks) {
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
async function syncArtistAlbums(supabase: any, accessToken: string, userId: string) {
  try {
    console.log('Syncing artist albums for user:', userId)
    const meResp = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    if (!meResp.ok) {
      const errText = await meResp.text()
      throw new Error(`Failed to fetch profile: ${meResp.status} ${errText}`)
    }
    const me = await meResp.json()
    const albumsResp = await fetch(`https://api.spotify.com/v1/artists/${me.id}/albums?include_groups=album,single&limit=50`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    if (!albumsResp.ok) {
      const errText = await albumsResp.text()
      throw new Error(`Failed to fetch albums: ${albumsResp.status} ${errText}`)
    }
    const albums = await albumsResp.json()
    
    let processed = 0
    let failed = 0

    for (const album of albums.items) {
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