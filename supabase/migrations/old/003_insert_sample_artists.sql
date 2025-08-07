-- Insert sample artists with proper UUIDs
INSERT INTO public.artists (id, name, avatar_url, total_respect, followers_count) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Sezen Aksu',
  '/src/assets/artist/Image.png',
  1345,
  1247
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Ahmet Kaya',
  '/src/assets/artist/Image (1).png',
  892,
  567
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Tarkan',
  '/src/assets/artist/Image (2).png',
  2156,
  1890
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Sertab Erener',
  '/src/assets/artist/Image (3).png',
  987,
  654
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Barış Manço',
  '/src/assets/artist/Image (4).png',
  3456,
  2890
)
ON CONFLICT (id) DO NOTHING; 