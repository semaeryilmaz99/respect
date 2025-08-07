-- Create artist_follows table for following artists
CREATE TABLE IF NOT EXISTS public.artist_follows (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  created_at timestamp default now(),
  
  -- Prevent duplicate follows
  UNIQUE(user_id, artist_id)
);

-- Enable RLS
ALTER TABLE artist_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all follows" 
ON artist_follows FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own follows" 
ON artist_follows FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follows" 
ON artist_follows FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_artist_follows_user_id ON artist_follows(user_id);
CREATE INDEX idx_artist_follows_artist_id ON artist_follows(artist_id);

-- Update artists table to add followers_count column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artists' AND column_name = 'followers_count') THEN
        ALTER TABLE artists ADD COLUMN followers_count integer default 0;
    END IF;
END $$;

-- Create function to update followers count
CREATE OR REPLACE FUNCTION update_artist_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artists 
        SET followers_count = followers_count + 1
        WHERE id = NEW.artist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artists 
        SET followers_count = followers_count - 1
        WHERE id = OLD.artist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update followers count
DROP TRIGGER IF EXISTS trigger_update_artist_followers_count ON artist_follows;
CREATE TRIGGER trigger_update_artist_followers_count
    AFTER INSERT OR DELETE ON artist_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_artist_followers_count(); 