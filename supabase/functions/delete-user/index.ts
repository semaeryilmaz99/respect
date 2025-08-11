/* eslint-disable */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  console.log('🗑️ Delete User Function called')
  console.log('🗑️ Method:', req.method)
  console.log('🗑️ URL:', req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🗑️ Handling OPTIONS request')
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Supabase environment variables are not configured')
    }

    console.log('🗑️ Initializing Supabase clients')
    // Authenticated user client (to identify the caller)
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') || ''
        }
      }
    })

    // Admin client for deleting users
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    console.log('🗑️ Getting current authenticated user from request')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: user not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🗑️ Attempting safe cleanup of dependent rows for user:', user.id)
    const tablesWithUserId = [
      'spotify_connections',
      'spotify_sync_logs',
      'user_cards',
      'artist_follows',
      'song_favorites',
      'chat_messages',
      'chat_room_members',
      'notifications',
      'daily_bonuses',
      'user_activities',
      'user_stats'
    ] as const

    for (const table of tablesWithUserId) {
      try {
        console.log(`🧹 Deleting from ${table}...`)
        await supabaseAdmin.from(table).delete().eq('user_id', user.id)
      } catch (e) {
        console.warn(`⚠️ Cleanup warning on ${table}:`, e)
      }
    }

    // Artists table may use user ownership
    try {
      console.log('🧹 Deleting from artists by user ownership...')
      await supabaseAdmin.from('artists').delete().eq('user_id', user.id)
    } catch (e) {
      console.warn('⚠️ Cleanup warning on artists:', e)
    }

    // Profiles row for the user
    try {
      console.log('🧹 Deleting profile row...')
      await supabaseAdmin.from('profiles').delete().eq('id', user.id)
    } catch (e) {
      console.warn('⚠️ Cleanup warning on profiles:', e)
    }

    console.log('🗑️ Deleting user from auth.users with admin client:', user.id)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('❌ Admin delete error details:', deleteError)
      throw deleteError
    }

    // Note: Most dependent records should be removed via ON DELETE CASCADE constraints.
    // If you need to remove storage assets, add logic here.

    console.log('✅ User deleted successfully')
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Delete user error:', error)
    // Always return 200 and include success flag so client doesn't throw FunctionsHttpError
    return new Response(JSON.stringify({
      success: false,
      error: (error as any)?.message || 'Unknown error',
      details: String(error)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})


