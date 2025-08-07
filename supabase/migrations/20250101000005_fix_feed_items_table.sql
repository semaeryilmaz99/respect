-- Fix feed_items table - Add missing columns
-- This migration adds the missing is_public and is_personal columns to feed_items table

-- Add missing columns to feed_items table
ALTER TABLE public.feed_items 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_personal boolean DEFAULT false;

-- Update existing records to have default values
UPDATE public.feed_items 
SET 
  is_public = COALESCE(is_public, true),
  is_personal = COALESCE(is_personal, false)
WHERE is_public IS NULL OR is_personal IS NULL;

-- Create indexes for the new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_feed_items_is_public ON feed_items(is_public);
CREATE INDEX IF NOT EXISTS idx_feed_items_is_personal ON feed_items(is_personal);

-- Add comments for documentation
COMMENT ON COLUMN public.feed_items.is_public IS 'Whether this feed item should be shown in public community feed';
COMMENT ON COLUMN public.feed_items.is_personal IS 'Whether this feed item should be shown in personal user feed';

-- Verify the table structure
SELECT 
  'Feed items table updated successfully' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'feed_items' 
AND table_schema = 'public'
ORDER BY ordinal_position; 