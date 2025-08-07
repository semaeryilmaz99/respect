-- Create user_cards table for storing card information
CREATE TABLE IF NOT EXISTS public.user_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  card_number text not null, -- Only last 4 digits for security
  card_holder text not null,
  expiry_month text not null,
  expiry_year text not null,
  card_type text, -- visa, mastercard, etc.
  is_default boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cards" 
ON user_cards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" 
ON user_cards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" 
ON user_cards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" 
ON user_cards FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);

-- Add unique constraint to prevent duplicate cards
ALTER TABLE user_cards 
ADD CONSTRAINT unique_user_card 
UNIQUE (user_id, card_number); 