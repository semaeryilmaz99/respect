// Basit Console Test - Uygulamayı yeniledikten sonra çalıştırın
// Bu kodu browser console'a kopyalayıp yapıştırın

// Supabase client kontrolü
if (typeof window.supabase === 'undefined') {
  console.error('❌ Supabase client bulunamadı. Sayfayı yenileyin.');
} else {
  console.log('✅ Supabase client bulundu');
  
  // Kullanıcı kontrolü
  const { data: { user } } = await window.supabase.auth.getUser();
  console.log('👤 Kullanıcı:', user?.id || 'Giriş yapılmamış');
  
  if (user) {
    // Spotify bağlantısı kontrolü
    const { data: connection } = await window.supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log('🔗 Spotify bağlantısı:', connection ? '✅ Var' : '❌ Yok');
    
    // Çalma listelerini getir
    const { data: playlists } = await window.supabase
      .from('spotify_playlists')
      .select('name, total_tracks')
      .eq('user_id', user.id);
    
    console.log('📋 Çalma listeleri:', playlists?.length || 0, 'adet');
    
    if (playlists?.length > 0) {
      console.log('🎵 İlk 3 çalma listesi:');
      playlists.slice(0, 3).forEach((p, i) => {
        console.log(`${i+1}. ${p.name} (${p.total_tracks} şarkı)`);
      });
    }
  }
}
