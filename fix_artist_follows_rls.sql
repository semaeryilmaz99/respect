-- Fix artist_follows RLS policies
-- This script fixes the 406 "Not Acceptable" error when accessing artist_follows table

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'artist_follows';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view all follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON artist_follows;
DROP POLICY IF EXISTS "Artist follows are viewable by everyone" ON artist_follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON artist_follows;

-- Create new, more permissive RLS policies
-- Allow everyone to view all follows (for public display)
CREATE POLICY "Artist follows are viewable by everyone" 
ON artist_follows FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own follows
CREATE POLICY "Users can insert own follows" 
ON artist_follows FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own follows
CREATE POLICY "Users can delete own follows" 
ON artist_follows FOR DELETE 
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own follows (if needed)
CREATE POLICY "Users can update own follows" 
ON artist_follows FOR UPDATE 
USING (auth.uid() = user_id);

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'artist_follows';

-- Test the policies with a simple query
-- This should work for authenticated users
SELECT COUNT(*) FROM artist_follows LIMIT 1;
