-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON artist_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON artist_follows;

-- Create updated RLS policies
CREATE POLICY "Users can view all follows" 
ON artist_follows FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own follows" 
ON artist_follows FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follows" 
ON artist_follows FOR DELETE 
USING (auth.uid() = user_id);

-- Test the policies
-- This should work for authenticated users
SELECT * FROM artist_follows LIMIT 1; 