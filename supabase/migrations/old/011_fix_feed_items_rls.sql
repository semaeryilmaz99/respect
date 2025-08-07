-- Fix feed_items RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Feed items are viewable by everyone" ON feed_items;
DROP POLICY IF EXISTS "Users can create own feed items" ON feed_items;

-- Create more permissive policies
CREATE POLICY "Feed items are viewable by everyone" 
ON feed_items FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create feed items" 
ON feed_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own feed items" 
ON feed_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feed items" 
ON feed_items FOR DELETE USING (auth.uid() = user_id);

-- Test function to check auth status
CREATE OR REPLACE FUNCTION check_auth_status()
RETURNS TABLE (
  current_user_id uuid,
  user_role text,
  is_authenticated boolean
) AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.uid() as current_user_id,
    auth.role() as user_role,
    (auth.uid() IS NOT NULL) as is_authenticated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 