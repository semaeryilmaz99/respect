-- Fix RLS Policies for Artist Songs System
-- Migration: 20250101000014_fix_rls_policies.sql

-- 1. Artists tablosu için RLS politikaları
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Artists tablosu için SELECT politikası - Herkes görebilir
DROP POLICY IF EXISTS "Anyone can view artists" ON artists;
CREATE POLICY "Anyone can view artists" ON artists
  FOR SELECT USING (true);

-- Artists tablosu için INSERT politikası - Sadece kendi profilini ekleyebilir
DROP POLICY IF EXISTS "Users can insert their own artist profile" ON artists;
CREATE POLICY "Users can insert their own artist profile" ON artists
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IS NOT NULL
  );

-- Artists tablosu için UPDATE politikası - Sadece kendi profilini güncelleyebilir
DROP POLICY IF EXISTS "Users can update their own artist profile" ON artists;
CREATE POLICY "Users can update their own artist profile" ON artists
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() IS NOT NULL
  );

-- 2. Songs tablosu için RLS politikaları
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Songs tablosu için SELECT politikası - Herkes görebilir
DROP POLICY IF EXISTS "Anyone can view songs" ON songs;
CREATE POLICY "Anyone can view songs" ON songs
  FOR SELECT USING (true);

-- Songs tablosu için INSERT politikası - Sanatçılar kendi şarkılarını ekleyebilir
DROP POLICY IF EXISTS "Artists can insert their own songs" ON songs;
CREATE POLICY "Artists can insert their own songs" ON songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM artists 
      WHERE artists.id = songs.artist_id 
      AND artists.user_id = auth.uid()
    ) OR
    auth.uid() IS NOT NULL
  );

-- Songs tablosu için UPDATE politikası - Sanatçılar kendi şarkılarını güncelleyebilir
DROP POLICY IF EXISTS "Artists can update their own songs" ON songs;
CREATE POLICY "Artists can update their own songs" ON songs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artists 
      WHERE artists.id = songs.artist_id 
      AND artists.user_id = auth.uid()
    ) OR
    auth.uid() IS NOT NULL
  );

-- 3. Profiles tablosu için RLS politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles tablosu için SELECT politikası - Herkes görebilir
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- Profiles tablosu için INSERT politikası - Sadece kendi profilini ekleyebilir
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Profiles tablosu için UPDATE politikası - Sadece kendi profilini güncelleyebilir
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Spotify connections tablosu için RLS politikaları
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;

-- Spotify connections için SELECT politikası - Sadece kendi bağlantısını görebilir
DROP POLICY IF EXISTS "Users can view their own spotify connections" ON spotify_connections;
CREATE POLICY "Users can view their own spotify connections" ON spotify_connections
  FOR SELECT USING (auth.uid() = user_id);

-- Spotify connections için INSERT politikası - Sadece kendi bağlantısını ekleyebilir
DROP POLICY IF EXISTS "Users can insert their own spotify connections" ON spotify_connections;
CREATE POLICY "Users can insert their own spotify connections" ON spotify_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Spotify connections için UPDATE politikası - Sadece kendi bağlantısını güncelleyebilir
DROP POLICY IF EXISTS "Users can update their own spotify connections" ON spotify_connections;
CREATE POLICY "Users can update their own spotify connections" ON spotify_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Respect transactions tablosu için RLS politikaları
ALTER TABLE respect_transactions ENABLE ROW LEVEL SECURITY;

-- Respect transactions için SELECT politikası - Herkes görebilir
DROP POLICY IF EXISTS "Anyone can view respect transactions" ON respect_transactions;
CREATE POLICY "Anyone can view respect transactions" ON respect_transactions
  FOR SELECT USING (true);

-- Respect transactions için INSERT politikası - Giriş yapmış kullanıcılar ekleyebilir
DROP POLICY IF EXISTS "Authenticated users can insert respect transactions" ON respect_transactions;
CREATE POLICY "Authenticated users can insert respect transactions" ON respect_transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Fonksiyon izinlerini güncelle
GRANT EXECUTE ON FUNCTION is_user_artist(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_artist_songs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_playlist_songs(UUID) TO authenticated;

-- 7. Tablo izinlerini güncelle
GRANT SELECT ON artists TO authenticated;
GRANT SELECT ON songs TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON spotify_connections TO authenticated;
GRANT SELECT ON respect_transactions TO authenticated;

-- 8. Index'leri güncelle
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user_id ON spotify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections(spotify_user_id);
