-- Add sample respect transactions for testing
-- This migration adds sample data to demonstrate the user stats functionality

-- First, let's check if we have any existing users and use their IDs
-- If no users exist, we'll create some sample users first

-- Create sample users if they don't exist
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'alex@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Alex Rodriguez"}', false, '', '', '', ''),
  ('550e8400-e29b-41d4-a716-446655440014', 'sarah@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Sarah Johnson"}', false, '', '', '', ''),
  ('550e8400-e29b-41d4-a716-446655440015', 'mike@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Mike Chen"}', false, '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Create sample profiles for these users
INSERT INTO profiles (id, username, full_name, bio, respect_balance, total_respect_sent, total_respect_received)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'alexrodriguez', 'Alex Rodriguez', 'Indie rock tutkunu. Sanatçıları desteklemeyi seven biri.', 1000, 0, 0),
  ('550e8400-e29b-41d4-a716-446655440014', 'sarahjohnson', 'Sarah Johnson', 'Müzik aşığı. Yeni sanatçıları keşfetmeyi seviyorum.', 1000, 0, 0),
  ('550e8400-e29b-41d4-a716-446655440015', 'mikechen', 'Mike Chen', 'Alternatif müzik hayranı.', 1000, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Create sample artists if they don't exist
INSERT INTO artists (id, name, bio, avatar_url, total_respect, followers_count)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', 'Arctic Monkeys', 'İngiliz indie rock grubu', '/assets/artist/Image.png', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440003', 'Tame Impala', 'Avustralyalı psychedelic rock projesi', '/assets/artist/Image (1).png', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440005', 'The Strokes', 'Amerikan indie rock grubu', '/assets/artist/Image (2).png', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440006', 'Mac DeMarco', 'Kanadalı indie rock sanatçısı', '/assets/artist/Image (3).png', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440008', 'King Krule', 'İngiliz indie rock sanatçısı', '/assets/artist/Image (4).png', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440009', 'Radiohead', 'İngiliz alternatif rock grubu', '/assets/artist/Image (5).png', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440011', 'The 1975', 'İngiliz indie pop grubu', '/assets/artist/Image (6).png', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440012', 'Vampire Weekend', 'Amerikan indie rock grubu', '/assets/artist/Image (7).png', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Create sample songs if they don't exist
INSERT INTO songs (id, title, artist_id, album, cover_url, duration, total_respect)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440004', 'Do I Wanna Know?', '550e8400-e29b-41d4-a716-446655440002', 'AM', '/assets/song/Image.png', 272, 0),
  ('550e8400-e29b-41d4-a716-446655440007', 'The Less I Know The Better', '550e8400-e29b-41d4-a716-446655440003', 'Currents', '/assets/song/Image (1).png', 213, 0),
  ('550e8400-e29b-41d4-a716-446655440010', 'Last Nite', '550e8400-e29b-41d4-a716-446655440005', 'Is This It', '/assets/song/Image (2).png', 203, 0),
  ('550e8400-e29b-41d4-a716-446655440013', 'Chamber of Reflection', '550e8400-e29b-41d4-a716-446655440006', 'Salad Days', '/assets/song/Image (3).png', 184, 0)
ON CONFLICT (id) DO NOTHING;

-- Now add sample respect transactions
INSERT INTO respect_transactions (from_user_id, to_artist_id, song_id, amount, message, transaction_type, created_at) VALUES
-- User 1 transactions (Alex Rodriguez)
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NULL, 100, 'Harika müzik!', 'artist', NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 50, 'Bu şarkıyı çok seviyorum', 'song', NOW() - INTERVAL '4 hours'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', NULL, 75, 'Mükemmel!', 'artist', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 25, 'Güzel şarkı', 'song', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440008', NULL, 150, 'Favori sanatçım!', 'artist', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440010', 80, 'Harika!', 'song', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', NULL, 60, 'Çok beğendim', 'artist', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440013', 40, 'Güzel', 'song', NOW() - INTERVAL '6 days'),

-- User 2 transactions (Sarah Johnson)
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', NULL, 200, 'Mükemmel sanatçı!', 'artist', NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 100, 'Harika şarkı!', 'song', NOW() - INTERVAL '3 hours'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', NULL, 120, 'Çok beğendim', 'artist', NOW() - INTERVAL '12 hours'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 80, 'Güzel!', 'song', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440008', NULL, 90, 'Harika!', 'artist', NOW() - INTERVAL '2 days'),

-- User 3 transactions (Mike Chen)
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', NULL, 75, 'Güzel müzik', 'artist', NOW() - INTERVAL '30 minutes'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 45, 'Beğendim', 'song', NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', NULL, 60, 'İyi!', 'artist', NOW() - INTERVAL '6 hours'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 30, 'Güzel şarkı', 'song', NOW() - INTERVAL '1 day');

-- Update user respect balances based on transactions
UPDATE profiles 
SET 
  respect_balance = respect_balance - (
    SELECT COALESCE(SUM(amount), 0) 
    FROM respect_transactions 
    WHERE from_user_id = profiles.id
  ),
  total_respect_sent = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM respect_transactions 
    WHERE from_user_id = profiles.id
  )
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440014', 
  '550e8400-e29b-41d4-a716-446655440015'
); 