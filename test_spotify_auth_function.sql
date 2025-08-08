-- Test Spotify Auth Function
-- Bu sorgu ile function'ın environment variables'ları doğru alıp almadığını test edebilirsiniz

-- Function'ı test etmek için örnek çağrı
-- Not: Gerçek bir authorization code ile test etmeniz gerekiyor

-- 1. Function'ın mevcut olup olmadığını kontrol et
SELECT 
    'spotify-auth' as function_name,
    EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'spotify-auth'
    ) as function_exists;

-- 2. Function'ın parametrelerini kontrol et
SELECT 
    proname as function_name,
    proargnames as parameter_names,
    proargtypes as parameter_types
FROM pg_proc 
WHERE proname = 'spotify-auth';

-- 3. Function'ın environment variables'ları doğru alıp almadığını test et
-- Bu test için gerçek bir authorization code gerekli
-- Supabase Dashboard'da Function'ın "Invoke" sekmesini kullanın

-- Test verisi:
-- {
--   "code": "test_authorization_code_here"
-- }
