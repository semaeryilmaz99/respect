-- Create feed_items table
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid primary key default uuid_generate_v4(),
  type text check (type in (
    'respect_sent', 
    'song_favorited', 
    'artist_followed', 
    'song_shared', 
    'chat_message',
    'daily_bonus_claimed',
    'milestone_reached',
    'profile_completed'
  )),
  user_id uuid references auth.users(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  content jsonb, -- Esnek veri saklama (amount, message, milestone_type vb.)
  is_public boolean default true, -- Topluluk feed'inde gösterilip gösterilmeyeceği
  is_personal boolean default false, -- Kişisel feed'de gösterilip gösterilmeyeceği
  created_at timestamp default now()
);

-- Enable RLS
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Feed items are viewable by everyone" 
ON feed_items FOR SELECT USING (true);

CREATE POLICY "Users can create own feed items" 
ON feed_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_feed_items_user_id ON feed_items(user_id);
CREATE INDEX idx_feed_items_type ON feed_items(type);
CREATE INDEX idx_feed_items_created_at ON feed_items(created_at);
CREATE INDEX idx_feed_items_is_public ON feed_items(is_public);
CREATE INDEX idx_feed_items_is_personal ON feed_items(is_personal);
CREATE INDEX idx_feed_items_artist_id ON feed_items(artist_id);
CREATE INDEX idx_feed_items_song_id ON feed_items(song_id); 