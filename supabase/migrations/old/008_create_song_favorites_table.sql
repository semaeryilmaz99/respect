-- Create song_favorites table for song favorites
CREATE TABLE IF NOT EXISTS public.song_favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  created_at timestamp default now(),
  
  -- Prevent duplicate favorites
  UNIQUE(user_id, song_id)
);

-- Enable RLS
ALTER TABLE song_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Song favorites are viewable by everyone" 
ON song_favorites FOR SELECT USING (true);

CREATE POLICY "Users can insert own favorites" 
ON song_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" 
ON song_favorites FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_song_favorites_user_id ON song_favorites(user_id);
CREATE INDEX idx_song_favorites_song_id ON song_favorites(song_id);
CREATE INDEX idx_song_favorites_created_at ON song_favorites(created_at);

-- Create function to update favorites count
CREATE OR REPLACE FUNCTION update_song_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE songs 
        SET favorites_count = favorites_count + 1
        WHERE id = NEW.song_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE songs 
        SET favorites_count = favorites_count - 1
        WHERE id = OLD.song_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update favorites count
DROP TRIGGER IF EXISTS trigger_update_song_favorites_count ON song_favorites;
CREATE TRIGGER trigger_update_song_favorites_count
    AFTER INSERT OR DELETE ON song_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_song_favorites_count(); 