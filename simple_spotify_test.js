// Basit Spotify Test Kodu - Browser Console için
// Bu kodu browser console'a kopyalayıp yapıştırın

// 1. Kullanıcı kontrolü
const { data: { user } } = await supabase.auth.getUser();
console.log('👤 Kullanıcı:', user?.id || 'Giriş yapılmamış');

// 2. Spotify bağlantısı kontrolü
const { data: connection } = await supabase
  .from('spotify_connections')
  .select('*')
  .eq('user_id', user?.id)
  .single();

console.log('🔗 Spotify bağlantısı:', connection ? '✅ Var' : '❌ Yok');

// 3. Çalma listelerini getir
const { data: playlists } = await supabase
  .from('spotify_playlists')
  .select('name, total_tracks')
  .eq('user_id', user?.id);

console.log('📋 Çalma listeleri:', playlists?.length || 0, 'adet');

// 4. İlk 3 çalma listesini göster
if (playlists?.length > 0) {
  console.log('🎵 İlk 3 çalma listesi:');
  playlists.slice(0, 3).forEach((p, i) => {
    console.log(`${i+1}. ${p.name} (${p.total_tracks} şarkı)`);
  });
}
