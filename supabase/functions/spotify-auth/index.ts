import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import SpotifyWebApi from 'https://esm.sh/spotify-web-api-node@5.0.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Environment variables - Bu değerleri kendi Spotify bilgilerinizle değiştirin
const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') || 'your_spotify_client_id_here'
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') || 'your_spotify_client_secret_here'
const SPOTIFY_REDIRECT_URI = Deno.env.get('SPOTIFY_REDIRECT_URI') || 'http://localhost:5173/auth/spotify/callback'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get request body
    const { code } = await req.json()

    if (!code) {
      throw new Error('Authorization code is required')
    }

    // Initialize Spotify API
    const spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI
    })

    // Exchange authorization code for tokens
    const tokenData = await spotifyApi.authorizationCodeGrant(code)
    
    const accessToken = tokenData.body.access_token
    const refreshToken = tokenData.body.refresh_token
    const expiresIn = tokenData.body.expires_in

    // Get user profile from Spotify
    spotifyApi.setAccessToken(accessToken)
    const profile = await spotifyApi.getMe()

    // Check if user already exists in Supabase
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    let currentUser = user

    if (userError || !user) {
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
    console.error('Spotify auth error:', error)
    
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