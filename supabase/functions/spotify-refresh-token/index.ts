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
const SPOTIFY_CLIENT_ID = ''
const SPOTIFY_CLIENT_SECRET = 'your_spotify_client_secret_here' // Gerçek Client Secret'ınızı buraya yazın

serve(async (req) => {
  console.log('🔧 Spotify Refresh Token Function called')
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
    const { userId, refreshToken } = await req.json()

    if (!userId || !refreshToken) {
      throw new Error('Missing required parameters: userId, refreshToken')
    }

    console.log('🔧 Initializing Spotify API')
    // Initialize Spotify API
    const spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      refreshToken: refreshToken
    })

    console.log('🔧 Refreshing access token')
    // Refresh the access token
    const tokenData = await spotifyApi.refreshAccessToken()
    
    const newAccessToken = tokenData.body.access_token
    const newExpiresIn = tokenData.body.expires_in

    console.log('🔧 Updating connection in database')
    // Update the connection in database
    const { error: updateError } = await supabaseClient
      .from('spotify_connections')
      .update({
        access_token: newAccessToken,
        token_expires_at: new Date(Date.now() + newExpiresIn * 1000)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    console.log('🔧 Success! Returning response')
    return new Response(
      JSON.stringify({
        access_token: newAccessToken,
        token_expires_at: new Date(Date.now() + newExpiresIn * 1000),
        success: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Spotify refresh token error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 