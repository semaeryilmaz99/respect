-- Fix chat_messages RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Chat messages are viewable by everyone" ON chat_messages;
DROP POLICY IF EXISTS "Users can send own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can manage own messages" ON chat_messages;

-- Create more permissive policies
CREATE POLICY "Chat messages are viewable by everyone" 
ON chat_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON chat_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own messages" 
ON chat_messages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" 
ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Test function to check chat permissions
CREATE OR REPLACE FUNCTION check_chat_permissions()
RETURNS TABLE (
  current_user_id uuid,
  user_role text,
  is_authenticated boolean,
  can_insert boolean
) AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.uid() as current_user_id,
    auth.role() as user_role,
    (auth.uid() IS NOT NULL) as is_authenticated,
    (auth.role() = 'authenticated') as can_insert;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 