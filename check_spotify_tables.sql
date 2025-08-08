-- Spotify Integration Tables and Columns Check
-- Run this to check if all required tables and columns exist

-- 1. Check if artists table exists and has spotify_id column
SELECT 
    'artists' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'artists') as table_exists,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'spotify_id') as spotify_id_exists;

-- 2. Check if songs table exists and has spotify_id column
SELECT 
    'songs' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'songs') as table_exists,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'spotify_id') as spotify_id_exists;

-- 3. Check if albums table exists and has spotify_id column
SELECT 
    'albums' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') as table_exists,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'albums' AND column_name = 'spotify_id') as spotify_id_exists;

-- 4. Check if spotify_connections table exists
SELECT 
    'spotify_connections' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'spotify_connections') as table_exists;

-- 5. Check if spotify_sync_logs table exists
SELECT 
    'spotify_sync_logs' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'spotify_sync_logs') as table_exists;

-- 6. Show all tables that contain 'spotify' in their name
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%spotify%' 
AND table_schema = 'public';

-- 7. Show all columns that contain 'spotify' in their name
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name LIKE '%spotify%' 
AND table_schema = 'public'
ORDER BY table_name, column_name;
