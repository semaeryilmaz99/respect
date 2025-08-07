import { createClient } from '@supabase/supabase-js'
import config from './environment.js'

// Supabase project configuration from environment
const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc'

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Check environment variables.')
}

// Supabase client'ı oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth state helper
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getUser()
  return !!user
} 