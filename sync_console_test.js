// Spotify Senkronizasyon Testi - Uygulamayı yeniledikten sonra çalıştırın
// Bu kodu browser console'a kopyalayıp yapıştırın

async function testSync() {
  try {
    // Supabase client kontrolü
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase client bulunamadı. Sayfayı yenileyin.');
      return;
    }
    
    console.log('✅ Supabase client bulundu');
    
    // Kullanıcı kontrolü
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Kullanıcı girişi yapılmamış');
      return;
    }
    
    console.log('👤 Kullanıcı:', user.id);
    
    // Spotify bağlantısı kontrolü
    const { data: connection } = await window.supabase
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
    const { data, error } = await window.supabase.functions.invoke('spotify-sync-playlists', {
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
    const { data: playlists } = await window.supabase
      .from('spotify_playlists')
      .select('name, total_tracks')
      .eq('user_id', user.id);
    
    console.log('📋 Toplam çalma listesi:', playlists?.length || 0, 'adet');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test fonksiyonunu çalıştır
testSync();
