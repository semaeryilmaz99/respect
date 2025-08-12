import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rate limiting utility
const rateLimitMap = new Map<string, number>()

function checkRateLimit(key: string, limitMs: number = 1000): boolean {
  const now = Date.now()
  const lastCall = rateLimitMap.get(key)
  
  if (lastCall && (now - lastCall) < limitMs) {
    return false // Rate limit exceeded
  }
  
  rateLimitMap.set(key, now)
  return true // OK to proceed
}

async function rateLimitedFetch(url: string, options: RequestInit, key: string): Promise<Response> {
  if (!checkRateLimit(key)) {
    console.log(`Rate limit exceeded for ${key}, waiting...`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return fetch(url, options)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  console.log('🔧 Spotify Playlist Sync Function called')
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Missing authorization header' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '')
    console.log('🔧 Token extracted from header')

    // Verify user authentication
    console.log('🔧 Verifying user authentication')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Authentication failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', user.id)

    console.log('🔧 Getting request body')
    const { userId, syncType = 'user_playlists' } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Missing required parameter: userId' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify that the authenticated user matches the requested userId
    if (user.id !== userId) {
      console.log('❌ User ID mismatch:', user.id, '!=', userId)
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'User ID mismatch' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User ID verified')

    console.log('🔧 Getting user Spotify connection')
    const { data: connection, error: connectionError } = await supabaseClient
      .from('spotify_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      console.log('❌ Spotify connection not found for user:', userId)
      console.log('🔍 Connection error:', connectionError)
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Spotify connection not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Spotify connection found')

    console.log('🔧 Checking token expiration')
    let accessToken = connection.access_token
    if (new Date() > new Date(connection.token_expires_at)) {
      console.log('🔧 Token expired, refreshing...')
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${Deno.env.get('SPOTIFY_CLIENT_ID')}:${Deno.env.get('SPOTIFY_CLIENT_SECRET')}`)
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token
        })
      })
      
      if (!tokenResponse.ok) {
        throw new Error(`Failed to refresh token: ${tokenResponse.status}`)
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

    console.log('🔧 Executing playlist sync based on type:', syncType)
    switch (syncType) {
      case 'user_playlists':
        syncResult = await syncUserPlaylists(supabaseClient, accessToken, userId)
        break
      case 'playlist_tracks':
        const { playlistId } = await req.json()
        if (!playlistId) {
          return new Response(
            JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Missing required parameter: playlistId' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        syncResult = await syncPlaylistTracks(supabaseClient, accessToken, userId, playlistId)
        break
      default:
        throw new Error('Invalid sync type. Must be: user_playlists or playlist_tracks')
    }

    console.log('🔧 Logging sync activity')
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
    console.error('❌ Spotify playlist sync error:', error)
    
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

// Sync user playlists
async function syncUserPlaylists(supabase: any, accessToken: string, userId: string) {
  try {
    console.log('Syncing user playlists for user:', userId)
    
    // Get user's playlists from Spotify
    const playlistsResponse = await rateLimitedFetch(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      { headers: { 'Authorization': `Bearer ${accessToken}` } },
      `playlists_${userId}`
    )
    
    if (!playlistsResponse.ok) {
      const errText = await playlistsResponse.text()
      throw new Error(`Failed to fetch playlists: ${playlistsResponse.status} ${errText}`)
    }
    
    const playlistsData = await playlistsResponse.json()
    const playlists = playlistsData.items
    
    let processed = 0
    let failed = 0

    for (const playlist of playlists) {
      try {
        // Check if playlist already exists
        const { data: existingPlaylist } = await supabase
          .from('spotify_playlists')
          .select('id')
          .eq('spotify_playlist_id', playlist.id)
          .single()

        const playlistData = {
          spotify_playlist_id: playlist.id,
          user_id: userId,
          name: playlist.name,
          description: playlist.description,
          cover_url: playlist.images?.[0]?.url,
          is_public: playlist.public,
          is_collaborative: playlist.collaborative,
          total_tracks: playlist.tracks.total,
          spotify_owner_id: playlist.owner.id,
          spotify_owner_name: playlist.owner.display_name,
          last_synced_at: new Date().toISOString()
        }

        if (existingPlaylist) {
          // Update existing playlist
          const { error } = await supabase
            .from('spotify_playlists')
            .update(playlistData)
            .eq('spotify_playlist_id', playlist.id)

          if (error) {
            console.error('Error updating playlist:', playlist.name, error)
            failed++
          } else {
            console.log('Playlist updated:', playlist.name)
            processed++
          }
        } else {
          // Insert new playlist
          const { error } = await supabase
            .from('spotify_playlists')
            .insert(playlistData)

          if (error) {
            console.error('Error inserting playlist:', playlist.name, error)
            failed++
          } else {
            console.log('Playlist synced:', playlist.name)
            processed++
          }
        }
      } catch (error) {
        console.error('Error processing playlist:', playlist.name, error)
        failed++
      }
    }

    console.log(`Playlists sync completed: ${processed} processed, ${failed} failed`)
    return { success: true, processed, failed }
  } catch (error) {
    console.error('User playlists sync error:', error)
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}

// Sync playlist tracks
async function syncPlaylistTracks(supabase: any, accessToken: string, userId: string, playlistId: string) {
  try {
    console.log('Syncing playlist tracks for playlist:', playlistId)
    
    // Get playlist tracks from Spotify
    const tracksResponse = await rateLimitedFetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } },
      `playlist_tracks_${playlistId}`
    )
    
    if (!tracksResponse.ok) {
      const errText = await tracksResponse.text()
      throw new Error(`Failed to fetch playlist tracks: ${tracksResponse.status} ${errText}`)
    }
    
    const tracksData = await tracksResponse.json()
    const tracks = tracksData.items
    
    // Get our playlist record
    const { data: playlist } = await supabase
      .from('spotify_playlists')
      .select('id')
      .eq('spotify_playlist_id', playlistId)
      .single()

    if (!playlist) {
      throw new Error('Playlist not found in database')
    }

    // Clear existing tracks for this playlist
    await supabase
      .from('spotify_playlist_tracks')
      .delete()
      .eq('playlist_id', playlist.id)

    let processed = 0
    let failed = 0

    for (let i = 0; i < tracks.length; i++) {
      const trackItem = tracks[i]
      const track = trackItem.track
      
      if (!track) continue // Skip null tracks

      try {
        const trackData = {
          playlist_id: playlist.id,
          spotify_track_id: track.id,
          track_name: track.name,
          artist_name: track.artists?.[0]?.name || 'Unknown Artist',
          album_name: track.album?.name,
          duration_ms: track.duration_ms,
          cover_url: track.album?.images?.[0]?.url,
          added_at: trackItem.added_at,
          position: i,
          spotify_artist_id: track.artists?.[0]?.id,
          spotify_album_id: track.album?.id
        }

        const { error } = await supabase
          .from('spotify_playlist_tracks')
          .insert(trackData)

        if (error) {
          console.error('Error inserting track:', track.name, error)
          failed++
        } else {
          console.log('Track synced:', track.name)
          processed++
        }
      } catch (error) {
        console.error('Error processing track:', track.name, error)
        failed++
      }
    }

    console.log(`Playlist tracks sync completed: ${processed} processed, ${failed} failed`)
    return { success: true, processed, failed }
  } catch (error) {
    console.error('Playlist tracks sync error:', error)
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}
