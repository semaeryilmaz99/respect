-- Insert sample songs for existing artists
INSERT INTO public.songs (title, artist_id, album, duration, cover_url, total_respect, favorites_count, plays_count, release_date) VALUES
-- Drake songs
('God''s Plan', (SELECT id FROM artists WHERE name = 'Drake' LIMIT 1), 'Scorpion', 198, '/assets/song/Image (1).png', 15000, 2500, 5000000, '2018-01-19'),
('Hotline Bling', (SELECT id FROM artists WHERE name = 'Drake' LIMIT 1), 'Views', 267, '/assets/song/Image (2).png', 12000, 2000, 4000000, '2015-07-31'),
('One Dance', (SELECT id FROM artists WHERE name = 'Drake' LIMIT 1), 'Views', 173, '/assets/song/Image (3).png', 18000, 3000, 6000000, '2016-04-05'),

-- Taylor Swift songs
('Shake It Off', (SELECT id FROM artists WHERE name = 'Taylor Swift' LIMIT 1), '1989', 219, '/assets/song/Image (4).png', 14000, 2200, 4500000, '2014-08-18'),
('Blank Space', (SELECT id FROM artists WHERE name = 'Taylor Swift' LIMIT 1), '1989', 231, '/assets/song/Image (5).png', 16000, 2800, 5500000, '2014-11-10'),
('Anti-Hero', (SELECT id FROM artists WHERE name = 'Taylor Swift' LIMIT 1), 'Midnights', 200, '/assets/song/Image (6).png', 20000, 3500, 7000000, '2022-10-21'),

-- The Weeknd songs
('Blinding Lights', (SELECT id FROM artists WHERE name = 'The Weeknd' LIMIT 1), 'After Hours', 200, '/assets/song/Image (7).png', 25000, 4000, 8000000, '2019-11-29'),
('Starboy', (SELECT id FROM artists WHERE name = 'The Weeknd' LIMIT 1), 'Starboy', 230, '/assets/song/Image (8).png', 18000, 3000, 6000000, '2016-09-21'),
('Die For You', (SELECT id FROM artists WHERE name = 'The Weeknd' LIMIT 1), 'Starboy', 260, '/assets/song/Image (9).png', 22000, 3800, 7500000, '2016-11-25'),

-- Ed Sheeran songs
('Shape of You', (SELECT id FROM artists WHERE name = 'Ed Sheeran' LIMIT 1), '÷ (Divide)', 233, '/assets/song/Image (10).png', 30000, 5000, 10000000, '2017-01-06'),
('Perfect', (SELECT id FROM artists WHERE name = 'Ed Sheeran' LIMIT 1), '÷ (Divide)', 263, '/assets/song/Image (11).png', 28000, 4500, 9000000, '2017-09-26'),
('Bad Habits', (SELECT id FROM artists WHERE name = 'Ed Sheeran' LIMIT 1), '= (Equals)', 230, '/assets/song/Image (12).png', 24000, 4200, 8500000, '2021-06-25'),

-- Ariana Grande songs
('Thank U, Next', (SELECT id FROM artists WHERE name = 'Ariana Grande' LIMIT 1), 'Thank U, Next', 207, '/assets/song/Image (13).png', 22000, 3800, 7500000, '2018-11-03'),
('7 rings', (SELECT id FROM artists WHERE name = 'Ariana Grande' LIMIT 1), 'Thank U, Next', 178, '/assets/song/Image.png', 26000, 4400, 8800000, '2019-01-18'),
('positions', (SELECT id FROM artists WHERE name = 'Ariana Grande' LIMIT 1), 'positions', 172, '/assets/song/Image (1).png', 20000, 3600, 7200000, '2020-10-23'),

-- Post Malone songs
('Rockstar', (SELECT id FROM artists WHERE name = 'Post Malone' LIMIT 1), 'beerbongs & bentleys', 218, '/assets/song/Image (2).png', 19000, 3200, 6400000, '2017-09-15'),
('Circles', (SELECT id FROM artists WHERE name = 'Post Malone' LIMIT 1), 'Hollywood''s Bleeding', 215, '/assets/song/Image (3).png', 21000, 3700, 7400000, '2019-08-30'),
('Sunflower', (SELECT id FROM artists WHERE name = 'Post Malone' LIMIT 1), 'Spider-Man: Into the Spider-Verse', 158, '/assets/song/Image (4).png', 23000, 3900, 7800000, '2018-10-18'),

-- Billie Eilish songs
('bad guy', (SELECT id FROM artists WHERE name = 'Billie Eilish' LIMIT 1), 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?', 194, '/assets/song/Image (5).png', 27000, 4600, 9200000, '2019-03-29'),
('everything i wanted', (SELECT id FROM artists WHERE name = 'Billie Eilish' LIMIT 1), 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?', 274, '/assets/song/Image (6).png', 24000, 4100, 8200000, '2019-11-13'),
('Happier Than Ever', (SELECT id FROM artists WHERE name = 'Billie Eilish' LIMIT 1), 'Happier Than Ever', 298, '/assets/song/Image (7).png', 25000, 4300, 8600000, '2021-07-30'),

-- Dua Lipa songs
('New Rules', (SELECT id FROM artists WHERE name = 'Dua Lipa' LIMIT 1), 'Dua Lipa', 193, '/assets/song/Image (8).png', 20000, 3500, 7000000, '2017-07-07'),
('Don''t Start Now', (SELECT id FROM artists WHERE name = 'Dua Lipa' LIMIT 1), 'Future Nostalgia', 183, '/assets/song/Image (9).png', 23000, 4000, 8000000, '2019-10-31'),
('Levitating', (SELECT id FROM artists WHERE name = 'Dua Lipa' LIMIT 1), 'Future Nostalgia', 203, '/assets/song/Image (10).png', 26000, 4500, 9000000, '2020-03-27'),

-- Justin Bieber songs
('Sorry', (SELECT id FROM artists WHERE name = 'Justin Bieber' LIMIT 1), 'Purpose', 200, '/assets/song/Image (11).png', 22000, 3800, 7600000, '2015-10-22'),
('Love Yourself', (SELECT id FROM artists WHERE name = 'Justin Bieber' LIMIT 1), 'Purpose', 233, '/assets/song/Image (12).png', 24000, 4200, 8400000, '2015-11-09'),
('Stay', (SELECT id FROM artists WHERE name = 'Justin Bieber' LIMIT 1), 'Justice', 141, '/assets/song/Image (13).png', 28000, 4800, 9600000, '2021-07-09'),

-- BTS songs
('Dynamite', (SELECT id FROM artists WHERE name = 'BTS' LIMIT 1), 'Dynamite (DayTime Version)', 199, '/assets/song/Image.png', 32000, 5500, 11000000, '2020-08-21'),
('Butter', (SELECT id FROM artists WHERE name = 'BTS' LIMIT 1), 'Butter', 164, '/assets/song/Image (1).png', 30000, 5200, 10400000, '2021-05-21'),
('Permission to Dance', (SELECT id FROM artists WHERE name = 'BTS' LIMIT 1), 'Permission to Dance', 187, '/assets/song/Image (2).png', 29000, 5000, 10000000, '2021-07-09')

ON CONFLICT (title, artist_id) DO NOTHING; 