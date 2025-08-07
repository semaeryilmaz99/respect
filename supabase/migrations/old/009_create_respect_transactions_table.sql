-- Create respect_transactions table
CREATE TABLE IF NOT EXISTS public.respect_transactions (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references auth.users(id) on delete cascade,
  to_artist_id uuid references artists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  amount integer not null check (amount > 0),
  message text,
  transaction_type text check (transaction_type in ('artist', 'song')),
  is_anonymous boolean default false,
  created_at timestamp default now()
);

-- Enable RLS
ALTER TABLE respect_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Respect transactions are viewable by everyone" 
ON respect_transactions FOR SELECT USING (true);

CREATE POLICY "Users can create own transactions" 
ON respect_transactions FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Create indexes for better performance
CREATE INDEX idx_respect_transactions_from_user_id ON respect_transactions(from_user_id);
CREATE INDEX idx_respect_transactions_to_artist_id ON respect_transactions(to_artist_id);
CREATE INDEX idx_respect_transactions_song_id ON respect_transactions(song_id);
CREATE INDEX idx_respect_transactions_created_at ON respect_transactions(created_at);
CREATE INDEX idx_respect_transactions_transaction_type ON respect_transactions(transaction_type); 