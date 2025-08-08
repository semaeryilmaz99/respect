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
const SPOTIFY_CLIENT_ID = '0c57904463b9424f88e33d3e644e16da' // Gerçek Client ID'nizi buraya yazın
const SPOTIFY_CLIENT_SECRET = 'your_spotify_client_secret_here' // Gerçek Client Secret'ınızı buraya yazın
const SPOTIFY_REDIRECT_URI = 'http://localhost:5173/auth/spotify/callback'

serve(async (req) => {
  console.log('🔧 Spotify Auth Function called')
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
    const { code } = await req.json()

    if (!code) {
      throw new Error('Authorization code is required')
    }

    console.log('🔧 Initializing Spotify API')
    // Initialize Spotify API
    const spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI
    })

    console.log('🔧 Exchanging authorization code for tokens')
    // Exchange authorization code for tokens
    const tokenData = await spotifyApi.authorizationCodeGrant(code)
    
    const accessToken = tokenData.body.access_token
    const refreshToken = tokenData.body.refresh_token
    const expiresIn = tokenData.body.expires_in

    console.log('🔧 Getting user profile from Spotify')
    // Get user profile from Spotify
    spotifyApi.setAccessToken(accessToken)
    const profile = await spotifyApi.getMe()

    console.log('🔧 Checking if user exists in Supabase')
    // Check if user already exists in Supabase
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    let currentUser = user

    if (userError || !user) {
      console.log('🔧 Creating new user')
      // Create new user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: profile.body.email,
        password: `spotify_${profile.body.id}_${Date.now()}`, // Temporary password
        options: {
          data: {
            display_name: profile.body.display_name,
            spotify_id: profile.body.id,
            avatar_url: profile.body.images?.[0]?.url
          }
        }
      })

      if (authError) throw authError
      currentUser = authData.user
    }

    console.log('🔧 Saving Spotify connection')
    // Save Spotify connection
    const { error: connectionError } = await supabaseClient
      .from('spotify_connections')
      .upsert({
        user_id: currentUser.id,
        spotify_user_id: profile.body.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000)
      }, {
        onConflict: 'user_id'
      })

    if (connectionError) throw connectionError

    console.log('🔧 Creating/updating artist profile')
    // Create or update artist profile
    const { error: artistError } = await supabaseClient
      .from('artists')
      .upsert({
        user_id: currentUser.id,
        name: profile.body.display_name,
        avatar_url: profile.body.images?.[0]?.url,
        spotify_id: profile.body.id,
        bio: `Spotify Artist: ${profile.body.display_name}`,
        verified: true
      }, {
        onConflict: 'user_id'
      })

    if (artistError) throw artistError

    console.log('🔧 Success! Returning response')
    return new Response(
      JSON.stringify({
        user: currentUser,
        profile: profile.body,
        success: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Spotify auth error:', error)
    
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