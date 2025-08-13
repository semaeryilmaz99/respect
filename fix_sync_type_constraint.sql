-- Fix Spotify Sync Logs Sync Type Constraint
-- This fixes the 406 error by allowing 'user_playlist_data' sync type

-- Drop the existing constraint
ALTER TABLE spotify_sync_logs 
DROP CONSTRAINT IF EXISTS spotify_sync_logs_sync_type_check;

-- Add the updated constraint with 'user_playlist_data' included
ALTER TABLE spotify_sync_logs 
ADD CONSTRAINT spotify_sync_logs_sync_type_check 
CHECK (sync_type IN (
  'artist_profile', 
  'artist_songs', 
  'artist_albums', 
  'user_top_tracks', 
  'user_recently_played', 
  'user_playlists', 
  'playlist_tracks', 
  'user_playlist_data'
));

-- Verify the constraint was created
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'spotify_sync_logs_sync_type_check';

-- Test inserting a record with the new sync type
-- (This will only work if you have the right permissions)
-- INSERT INTO spotify_sync_logs (user_id, sync_type, status) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'user_playlist_data', 'test');
