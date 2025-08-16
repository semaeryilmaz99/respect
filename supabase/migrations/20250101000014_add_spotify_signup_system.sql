-- Spotify Signup System - Respect Uygulaması
-- Migration: 20250101000014_add_spotify_signup_system.sql

-- Spotify ile kayıt olan kullanıcılar için tablo
CREATE TABLE IF NOT EXISTS spotify_auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_user_id TEXT UNIQUE NOT NULL,
  spotify_email TEXT,
  spotify_display_name TEXT,
  spotify_country TEXT,
  spotify_product TEXT,
  spotify_images JSONB,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı Spotify profilleri için tablo
CREATE TABLE IF NOT EXISTS user_spotify_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  country TEXT,
  product TEXT,
  images JSONB,
  followers_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mevcut spotify_connections tablosuna yeni kolonlar ekle
ALTER TABLE spotify_connections ADD COLUMN IF NOT EXISTS spotify_email TEXT;
ALTER TABLE spotify_connections ADD COLUMN IF NOT EXISTS spotify_display_name TEXT;
ALTER TABLE spotify_connections ADD COLUMN IF NOT EXISTS spotify_country TEXT;
ALTER TABLE spotify_connections ADD COLUMN IF NOT EXISTS spotify_product TEXT;
ALTER TABLE spotify_connections ADD COLUMN IF NOT EXISTS spotify_images JSONB;

-- Spotify ile otomatik hesap oluşturma için fonksiyon
CREATE OR REPLACE FUNCTION create_user_from_spotify(
  spotify_user_id_param TEXT,
  spotify_email_param TEXT,
  spotify_display_name_param TEXT,
  spotify_country_param TEXT,
  spotify_product_param TEXT,
  spotify_images_param JSONB,
  access_token_param TEXT,
  refresh_token_param TEXT,
  token_expires_at_param TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  new_profile_id UUID;
BEGIN
  -- Yeni auth user oluştur
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    spotify_email_param,
    crypt(gen_random_uuid()::text, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"spotify","providers":["spotify"]}',
    '{"spotify_user_id":"' || spotify_user_id_param || '","display_name":"' || spotify_display_name_param || '"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Profiles tablosuna kayıt ekle
  INSERT INTO profiles (
    id,
    username,
    full_name,
    avatar_url,
    bio,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    COALESCE(spotify_display_name_param, 'user_' || substr(new_user_id::text, 1, 8)),
    COALESCE(spotify_display_name_param, 'Spotify User'),
    COALESCE((spotify_images_param->0->>'url'), '/assets/user/Image.png'),
    'Spotify ile kayıt olan kullanıcı',
    NOW(),
    NOW()
  );

  -- User Spotify profile ekle
  INSERT INTO user_spotify_profiles (
    user_id,
    spotify_user_id,
    display_name,
    email,
    country,
    product,
    images
  ) VALUES (
    new_user_id,
    spotify_user_id_param,
    spotify_display_name_param,
    spotify_email_param,
    spotify_country_param,
    spotify_product_param,
    spotify_images_param
  );

  -- Spotify connections tablosuna ekle
  INSERT INTO spotify_connections (
    user_id,
    spotify_user_id,
    access_token,
    refresh_token,
    token_expires_at,
    spotify_email,
    spotify_display_name,
    spotify_country,
    spotify_product,
    spotify_images
  ) VALUES (
    new_user_id,
    spotify_user_id_param,
    access_token_param,
    refresh_token_param,
    token_expires_at_param,
    spotify_email_param,
    spotify_display_name_param,
    spotify_country_param,
    spotify_product_param,
    spotify_images_param
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Spotify kullanıcısı var mı kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION check_spotify_user_exists(spotify_user_id_param TEXT)
RETURNS TABLE (
  user_exists BOOLEAN,
  user_id UUID,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as user_exists,
    sc.user_id,
    u.email
  FROM spotify_connections sc
  JOIN auth.users u ON sc.user_id = u.id
  WHERE sc.spotify_user_id = spotify_user_id_param
  LIMIT 1;
  
  -- Eğer kayıt bulunamazsa
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Spotify kullanıcı bilgilerini güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_spotify_user_info(
  user_id_param UUID,
  spotify_email_param TEXT,
  spotify_display_name_param TEXT,
  spotify_country_param TEXT,
  spotify_product_param TEXT,
  spotify_images_param JSONB,
  access_token_param TEXT,
  refresh_token_param TEXT,
  token_expires_at_param TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Spotify connections tablosunu güncelle
  UPDATE spotify_connections SET
    spotify_email = spotify_email_param,
    spotify_display_name = spotify_display_name_param,
    spotify_country = spotify_country_param,
    spotify_product = spotify_product_param,
    spotify_images = spotify_images_param,
    access_token = access_token_param,
    refresh_token = refresh_token_param,
    token_expires_at = token_expires_at_param,
    updated_at = NOW()
  WHERE user_id = user_id_param;

  -- User Spotify profile tablosunu güncelle
  UPDATE user_spotify_profiles SET
    display_name = spotify_display_name_param,
    email = spotify_email_param,
    country = spotify_country_param,
    product = spotify_product_param,
    images = spotify_images_param,
    updated_at = NOW()
  WHERE user_id = user_id_param;

  -- Profiles tablosunu güncelle
  UPDATE profiles SET
    full_name = COALESCE(spotify_display_name_param, full_name),
    avatar_url = COALESCE((spotify_images_param->0->>'url'), avatar_url),
    updated_at = NOW()
  WHERE id = user_id_param;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS politikaları
ALTER TABLE spotify_auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_spotify_profiles ENABLE ROW LEVEL SECURITY;

-- Spotify auth users için RLS politikaları
CREATE POLICY "Users can view their own spotify auth data" ON spotify_auth_users
  FOR SELECT USING (auth.uid()::text = spotify_user_id);

CREATE POLICY "Users can insert their own spotify auth data" ON spotify_auth_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own spotify auth data" ON spotify_auth_users
  FOR UPDATE USING (auth.uid()::text = spotify_user_id);

-- User spotify profiles için RLS politikaları
CREATE POLICY "Users can view their own spotify profile" ON user_spotify_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotify profile" ON user_spotify_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify profile" ON user_spotify_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Fonksiyonlar için izinler
GRANT EXECUTE ON FUNCTION create_user_from_spotify(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_spotify_user_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_spotify_user_info(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_auth_users_spotify_user_id ON spotify_auth_users(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_user_spotify_profiles_user_id ON user_spotify_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_spotify_profiles_spotify_user_id ON user_spotify_profiles(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections(spotify_user_id);

-- Updated at trigger function (eğer yoksa)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_spotify_auth_users_updated_at ON spotify_auth_users;
CREATE TRIGGER update_spotify_auth_users_updated_at 
  BEFORE UPDATE ON spotify_auth_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_spotify_profiles_updated_at ON user_spotify_profiles;
CREATE TRIGGER update_user_spotify_profiles_updated_at 
  BEFORE UPDATE ON user_spotify_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spotify_connections_updated_at ON spotify_connections;
CREATE TRIGGER update_spotify_connections_updated_at 
  BEFORE UPDATE ON spotify_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
