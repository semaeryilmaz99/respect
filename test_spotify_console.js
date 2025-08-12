// Browser Console için Spotify Playlist Test Kodu
// Bu kodu browser console'a kopyalayıp yapıştırın

async function testSpotifyPlaylistSync() {
  try {
    console.log('🧪 Spotify playlist sync test başlatılıyor...');
    
    // Supabase client'ı kontrol et
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client bulunamadı. Sayfayı yenileyin.');
      return;
    }
    
    // Kullanıcı kontrolü
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Kullanıcı girişi yapılmamış:', userError?.message || 'Kullanıcı bulunamadı');
      console.log('💡 Önce giriş yapın');
      return;
    }
    
    console.log('👤 Kullanıcı:', user.id);
    
    // Spotify bağlantısını kontrol et
    console.log('🔍 Spotify bağlantısı kontrol ediliyor...');
    const { data: connection, error: connectionError } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (connectionError || !connection) {
      console.error('❌ Spotify bağlantısı bulunamadı:', connectionError?.message || 'Bağlantı yok');
      console.log('💡 Önce Spotify hesabınızı bağlayın');
      return;
    }
    
    console.log('✅ Spotify bağlantısı bulundu');
    
    // Token geçerliliğini kontrol et
    if (new Date() > new Date(connection.token_expires_at)) {
      console.warn('⚠️ Spotify token süresi dolmuş, yenilenmeye çalışılıyor...');
    } else {
      console.log('✅ Spotify token geçerli');
    }
    
    // Çalma listelerini senkronize et
    console.log('🔄 Çalma listeleri senkronize ediliyor...');
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('spotify-sync-playlists', {
      body: { userId: user.id, syncType: 'user_playlists' }
    });
    
    if (syncError) {
      console.error('❌ Senkronizasyon hatası:', syncError);
      return;
    }
    
    if (!syncResult || !syncResult.success) {
      console.error('❌ Senkronizasyon başarısız:', syncResult?.error);
      return;
    }
    
    console.log('✅ Senkronizasyon başarılı:', syncResult);
    
    // Çalma listelerini getir
    console.log('📋 Çalma listeleri getiriliyor...');
    const { data: playlists, error: playlistError } = await supabase
      .from('spotify_playlists')
      .select(`
        id,
        name,
        total_tracks,
        is_public,
        user_playlist_preferences(
          is_favorite,
          is_visible,
          sort_order
        )
      `)
      .eq('user_id', user.id);
    
    if (playlistError) {
      console.error('❌ Çalma listesi getirme hatası:', playlistError);
      return;
    }
    
    // Görünür çalma listelerini filtrele
    const visiblePlaylists = playlists?.filter(playlist => {
      const prefs = playlist.user_playlist_preferences?.[0];
      return prefs?.is_visible !== false;
    }) || [];
    
    console.log('✅ Çalma listeleri:', visiblePlaylists.length, 'adet bulundu');
    
    // İstatistikleri hesapla
    const stats = {
      total_playlists: visiblePlaylists.length,
      total_tracks: visiblePlaylists.reduce((sum, playlist) => sum + (playlist.total_tracks || 0), 0),
      favorite_playlists: visiblePlaylists.filter(p => p.user_playlist_preferences?.[0]?.is_favorite).length,
      public_playlists: visiblePlaylists.filter(p => p.is_public).length
    };
    
    console.log('📊 İstatistikler:', stats);
    
    // İlk 5 çalma listesini göster
    console.log('🎵 İlk 5 çalma listesi:');
    visiblePlaylists.slice(0, 5).forEach((playlist, index) => {
      console.log(`${index + 1}. ${playlist.name} (${playlist.total_tracks} şarkı)`);
    });
    
    console.log('🎉 Test tamamlandı!');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test fonksiyonunu global scope'a ekle
window.testSpotifyPlaylistSync = testSpotifyPlaylistSync;

console.log('🧪 Test fonksiyonu hazır! Kullanmak için: testSpotifyPlaylistSync()');
console.log('📋 Kopyalayıp yapıştırmak için:');
console.log('testSpotifyPlaylistSync()');
