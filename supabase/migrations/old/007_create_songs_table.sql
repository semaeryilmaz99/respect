-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  artist_id uuid references artists(id) on delete cascade,
  album text,
  duration integer, -- saniye cinsinden
  cover_url text,
  spotify_id text,
  apple_music_id text,
  youtube_video_id text,
  total_respect bigint default 0,
  favorites_count integer default 0,
  plays_count bigint default 0,
  release_date date,
  is_explicit boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Songs are viewable by everyone" 
ON songs FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert songs" 
ON songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update songs" 
ON songs FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_songs_artist_id ON songs(artist_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_total_respect ON songs(total_respect);
CREATE INDEX idx_songs_favorites_count ON songs(favorites_count);
CREATE INDEX idx_songs_created_at ON songs(created_at); 