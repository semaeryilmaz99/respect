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
  console.log('🔧 Spotify User Data Sync Function called')
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
    console.log('🔧 Initializing Supabase client with service role')
    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
    const { userId } = await req.json()

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

    console.log('🔧 Getting user Spotify connection with service role')
    const { data: connection, error: connectionError } = await supabaseClient
      .from('spotify_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      console.log('❌ Spotify connection not found for user:', userId)
      return new Response(
        JSON.stringify({ success: false, processed: 0, failed: 1, error: 'Spotify connection not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Spotify connection found:', connection.id)

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

    console.log('🔧 Starting user data sync')
    const syncResult = await syncUserData(supabaseClient, accessToken, userId)

    console.log('🔧 Logging sync activity')
    await supabaseClient
      .from('spotify_sync_logs')
      .insert({
        user_id: userId,
        sync_type: 'user_playlist_data',
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
    console.error('❌ Spotify user data sync error:', error)
    
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

// Sync user's playlist data to artists and songs tables
async function syncUserData(supabase: any, accessToken: string, userId: string) {
  try {
    console.log('Syncing user playlist data for user:', userId)
    
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
    const uniqueArtists = new Map()
    const uniqueSongs = new Map()

    // Process each playlist
    for (const playlist of playlists) {
      try {
        console.log(`Processing playlist: ${playlist.name}`)
        
        // Get playlist tracks
        const tracksResponse = await rateLimitedFetch(
          `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=100`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } },
          `playlist_tracks_${playlist.id}`
        )
        
        if (!tracksResponse.ok) {
          console.log(`Failed to fetch tracks for playlist ${playlist.name}`)
          continue
        }
        
        const tracksData = await tracksResponse.json()
        const tracks = tracksData.items
        
        // Process each track
        for (const trackItem of tracks) {
          const track = trackItem.track
          if (!track) continue
          
          // Process artist
          if (track.artists && track.artists.length > 0) {
            const artist = track.artists[0]
            if (!uniqueArtists.has(artist.id)) {
              uniqueArtists.set(artist.id, {
                spotify_id: artist.id,
                name: artist.name,
                // We'll fetch artist details later
              })
            }
          }
          
          // Process song
          if (!uniqueSongs.has(track.id)) {
            uniqueSongs.set(track.id, {
              spotify_id: track.id,
              title: track.name,
              album: track.album?.name,
              duration: track.duration_ms,
              cover_url: track.album?.images?.[0]?.url,
              artist_spotify_id: track.artists?.[0]?.id,
              artist_name: track.artists?.[0]?.name
            })
          }
        }
      } catch (error) {
        console.error('Error processing playlist:', playlist.name, error)
        failed++
      }
    }

    console.log(`Found ${uniqueArtists.size} unique artists and ${uniqueSongs.size} unique songs`)

    // Sync artists to database
    console.log('Syncing artists to database...')
    for (const [spotifyId, artistData] of uniqueArtists) {
      try {
        // Check if artist already exists
        const { data: existingArtist } = await supabase
          .from('artists')
          .select('id')
          .eq('spotify_id', spotifyId)
          .single()

        if (!existingArtist) {
          // Fetch detailed artist info from Spotify
          const artistResponse = await rateLimitedFetch(
            `https://api.spotify.com/v1/artists/${spotifyId}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } },
            `artist_${spotifyId}`
          )
          
          if (artistResponse.ok) {
            const spotifyArtist = await artistResponse.json()
            
            const artistInsertData = {
              name: spotifyArtist.name,
              bio: spotifyArtist.bio || '',
              avatar_url: spotifyArtist.images?.[0]?.url,
              cover_url: spotifyArtist.images?.[1]?.url,
              spotify_id: spotifyArtist.id,
              total_respect: 0,
              followers_count: spotifyArtist.followers?.total || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            const { error } = await supabase
              .from('artists')
              .insert(artistInsertData)

            if (error) {
              console.error('Error inserting artist:', spotifyArtist.name, error)
              failed++
            } else {
              console.log('Artist synced:', spotifyArtist.name)
              processed++
            }
          }
        } else {
          console.log('Artist already exists:', artistData.name)
        }
      } catch (error) {
        console.error('Error processing artist:', artistData.name, error)
        failed++
      }
    }

    // Sync songs to database
    console.log('Syncing songs to database...')
    for (const [spotifyId, songData] of uniqueSongs) {
      try {
        // Check if song already exists
        const { data: existingSong } = await supabase
          .from('songs')
          .select('id')
          .eq('spotify_id', spotifyId)
          .single()

        if (!existingSong) {
          // Get artist ID from database
          const { data: artist } = await supabase
            .from('artists')
            .select('id')
            .eq('spotify_id', songData.artist_spotify_id)
            .single()

          if (artist) {
            const songInsertData = {
              title: songData.title,
              artist_id: artist.id,
              album: songData.album,
              duration: songData.duration,
              cover_url: songData.cover_url,
              spotify_id: songData.spotify_id,
              total_respect: 0,
              favorites_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            const { error } = await supabase
              .from('songs')
              .insert(songInsertData)

            if (error) {
              console.error('Error inserting song:', songData.title, error)
              failed++
            } else {
              console.log('Song synced:', songData.title)
              processed++
            }
          } else {
            console.log('Artist not found for song:', songData.title)
            failed++
          }
        } else {
          console.log('Song already exists:', songData.title)
        }
      } catch (error) {
        console.error('Error processing song:', songData.title, error)
        failed++
      }
    }

    console.log(`User data sync completed: ${processed} processed, ${failed} failed`)
    return { success: true, processed, failed }
  } catch (error) {
    console.error('User data sync error:', error)
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}
