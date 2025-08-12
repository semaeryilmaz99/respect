// Browser Console Test - Supabase Client ile
// Bu kodu browser console'a kopyalayıp yapıştırın

// 1. Supabase client'ını oluştur
const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

// Supabase client'ını oluştur
const supabase = window.supabase || createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('🔧 Supabase client oluşturuldu');

// 2. Kullanıcı kontrolü
const { data: { user } } = await supabase.auth.getUser();
console.log('👤 Kullanıcı:', user?.id || 'Giriş yapılmamış');

// 3. Spotify bağlantısı kontrolü
const { data: connection } = await supabase
  .from('spotify_connections')
  .select('*')
  .eq('user_id', user?.id)
  .single();

console.log('🔗 Spotify bağlantısı:', connection ? '✅ Var' : '❌ Yok');

// 4. Çalma listelerini getir
const { data: playlists } = await supabase
  .from('spotify_playlists')
  .select('name, total_tracks')
  .eq('user_id', user?.id);

console.log('📋 Çalma listeleri:', playlists?.length || 0, 'adet');

// 5. İlk 3 çalma listesini göster
if (playlists?.length > 0) {
  console.log('🎵 İlk 3 çalma listesi:');
  playlists.slice(0, 3).forEach((p, i) => {
    console.log(`${i+1}. ${p.name} (${p.total_tracks} şarkı)`);
  });
}
