import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Environment variables (provide via Supabase secrets)
const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') ?? ''
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') ?? ''
const SPOTIFY_REDIRECT_URI = Deno.env.get('SPOTIFY_REDIRECT_URI') ?? ''

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
    // Initialize Supabase client with caller auth header forwarded
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    )

    console.log('🔧 Getting request body')
    const { code } = await req.json()

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
      throw new Error('Spotify environment variables are not configured')
    }

    console.log('🔧 Exchanging authorization code for tokens (via fetch)')
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      throw new Error(`Failed to get tokens from Spotify: ${tokenResponse.status} ${errText}`)
    }

    const tokenJson = await tokenResponse.json()
    const accessToken = tokenJson.access_token
    const refreshToken = tokenJson.refresh_token
    const expiresIn = tokenJson.expires_in

    console.log('🔧 Getting user profile from Spotify (via fetch)')
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!profileResponse.ok) {
      const errText = await profileResponse.text()
      throw new Error(`Failed to fetch Spotify profile: ${profileResponse.status} ${errText}`)
    }

    const profile = await profileResponse.json()

    console.log('🔧 Getting current authenticated user from request')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: user not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔧 Saving Spotify connection')
    const { error: connectionError } = await supabaseClient
      .from('spotify_connections')
      .upsert({
        user_id: user.id,
        spotify_user_id: profile.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000)
      }, {
        onConflict: 'user_id'
      })

    if (connectionError) throw connectionError

    console.log('🔧 Creating/updating artist profile')
    const { error: artistError } = await supabaseClient
      .from('artists')
      .upsert({
        user_id: user.id,
        name: profile.display_name,
        avatar_url: profile.images?.[0]?.url,
        spotify_id: profile.id,
        bio: `Spotify Artist: ${profile.display_name}`,
        verified: true
      }, {
        onConflict: 'user_id'
      })

    if (artistError) throw artistError

    console.log('🔧 Success! Returning response')
    return new Response(
      JSON.stringify({ user, profile, success: true }),
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