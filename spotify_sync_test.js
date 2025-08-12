// Spotify Senkronizasyon Testi - Browser Console için
// Bu kodu browser console'a kopyalayıp yapıştırın

async function testSpotifySync() {
  try {
    console.log('🔄 Spotify senkronizasyon testi başlatılıyor...');
    
    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Kullanıcı girişi yapılmamış');
      return;
    }
    
    console.log('👤 Kullanıcı:', user.id);
    
    // Spotify bağlantısı kontrolü
    const { data: connection } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!connection) {
      console.error('❌ Spotify bağlantısı bulunamadı');
      console.log('💡 Önce Spotify hesabınızı bağlayın');
      return;
    }
    
    console.log('✅ Spotify bağlantısı bulundu');
    
    // Senkronizasyon başlat
    console.log('🔄 Çalma listeleri senkronize ediliyor...');
    const { data, error } = await supabase.functions.invoke('spotify-sync-playlists', {
      body: { userId: user.id, syncType: 'user_playlists' }
    });
    
    if (error) {
      console.error('❌ Senkronizasyon hatası:', error);
      return;
    }
    
    if (!data || !data.success) {
      console.error('❌ Senkronizasyon başarısız:', data?.error);
      return;
    }
    
    console.log('✅ Senkronizasyon başarılı!');
    console.log('📊 Sonuç:', data);
    
    // Güncel çalma listelerini getir
    const { data: playlists } = await supabase
      .from('spotify_playlists')
      .select('name, total_tracks')
      .eq('user_id', user.id);
    
    console.log('📋 Toplam çalma listesi:', playlists?.length || 0, 'adet');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test fonksiyonunu çalıştır
testSpotifySync();
