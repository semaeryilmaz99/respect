-- Create profiles table for user profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  respect_balance integer default 1000,
  total_respect_sent bigint default 0,
  total_respect_received bigint default 0,
  followers_count integer default 0,
  following_count integer default 0,
  favorite_songs_count integer default 0,
  followed_artists_count integer default 0,
  is_verified boolean default false,
  is_profile_completed boolean default false,
  profile_completed_at timestamp,
  last_active timestamp default now(),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_last_active ON profiles(last_active); 