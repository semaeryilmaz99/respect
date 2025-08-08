-- Spotify Integration Database Schema Updates - Part 1 (Safe)
-- Run this migration to add Spotify support to your database

-- 1. Add Spotify ID columns to existing tables
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;

-- 2. Create Spotify connections table
CREATE TABLE IF NOT EXISTS spotify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_user_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Spotify sync logs table
CREATE TABLE IF NOT EXISTS spotify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user_id ON spotify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_user_id ON spotify_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_created_at ON spotify_sync_logs(created_at);

-- 5. Enable RLS
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_sync_logs ENABLE ROW LEVEL SECURITY;
