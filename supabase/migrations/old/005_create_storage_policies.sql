-- Create storage policies for avatars bucket
-- Note: These policies should be created through the Supabase Dashboard
-- This is a backup method if Dashboard doesn't work

-- Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for users to upload their own avatars
-- CREATE POLICY "Users can upload their own avatars" 
-- ON storage.objects FOR INSERT 
-- WITH CHECK (
--   bucket_id = 'avatars' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy for users to view all avatars
-- CREATE POLICY "Users can view all avatars" 
-- ON storage.objects FOR SELECT 
-- USING (bucket_id = 'avatars');

-- Policy for users to update their own avatars
-- CREATE POLICY "Users can update their own avatars" 
-- ON storage.objects FOR UPDATE 
-- USING (
--   bucket_id = 'avatars' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy for users to delete their own avatars
-- CREATE POLICY "Users can delete their own avatars" 
-- ON storage.objects FOR DELETE 
-- USING (
--   bucket_id = 'avatars' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Alternative: Create a simple public policy for testing
-- WARNING: This allows anyone to upload/delete files - use only for testing
CREATE POLICY "Public avatars access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars'); 