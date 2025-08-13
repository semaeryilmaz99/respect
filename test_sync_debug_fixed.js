// Spotify Sync Debug Test - Browser Console için (Düzeltilmiş)
// Bu kodu browser console'a kopyalayıp yapıştırın

async function debugSpotifySync() {
  try {
    console.log('🔍 Spotify Sync Debug Test Başlıyor...');
    
    // Supabase client'ı kontrol et
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase client bulunamadı. Sayfayı yenileyin.');
      return;
    }
    
    const supabase = window.supabase;
    console.log('✅ Supabase client bulundu');
    
    // 1. Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Kullanıcı girişi yapılmamış');
      return;
    }
    
    console.log('👤 Kullanıcı:', user.id);
    
    // 2. Spotify bağlantısı kontrolü
    const { data: connection, error: connectionError } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (connectionError || !connection) {
      console.error('❌ Spotify bağlantısı bulunamadı:', connectionError?.message);
      return;
    }
    
    console.log('✅ Spotify bağlantısı bulundu:', connection.spotify_user_id);
    
    // 3. Son sync loglarını kontrol et
    const { data: syncLogs, error: syncLogsError } = await supabase
      .from('spotify_sync_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('sync_type', 'user_playlist_data')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (syncLogsError) {
      console.error('❌ Sync logları alınamadı:', syncLogsError);
    } else {
      console.log('📊 Sync logları:', syncLogs?.length || 0, 'kayıt');
      if (syncLogs && syncLogs.length > 0) {
        syncLogs.forEach((log, i) => {
          console.log(`   ${i+1}. ${log.status}: ${log.items_processed} işlendi, ${log.items_failed} başarısız (${new Date(log.created_at).toLocaleString()})`);
          if (log.error_message) {
            console.log(`      Hata: ${log.error_message}`);
          }
        });
      }
    }
    
    // 4. Artists tablosunu kontrol et
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, spotify_id, total_respect')
      .not('spotify_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (artistsError) {
      console.error('❌ Artists tablosu alınamadı:', artistsError);
    } else {
      console.log('🎵 Spotify ID\'li sanatçılar:', artists?.length || 0, 'kayıt');
      if (artists && artists.length > 0) {
        artists.forEach((artist, i) => {
          console.log(`   ${i+1}. ${artist.name} (Spotify ID: ${artist.spotify_id}) - ${artist.total_respect} respect`);
        });
      } else {
        console.log('   ⚠️ Spotify ID\'li sanatçı bulunamadı');
      }
    }
    
    // 5. Songs tablosunu kontrol et
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select(`
        id, 
        title, 
        spotify_id, 
        total_respect,
        artists(name)
      `)
      .not('spotify_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (songsError) {
      console.error('❌ Songs tablosu alınamadı:', songsError);
    } else {
      console.log('🎶 Spotify ID\'li şarkılar:', songs?.length || 0, 'kayıt');
      if (songs && songs.length > 0) {
        songs.forEach((song, i) => {
          console.log(`   ${i+1}. ${song.title} - ${song.artists?.name || 'Bilinmeyen Sanatçı'} (Spotify ID: ${song.spotify_id})`);
        });
      } else {
        console.log('   ⚠️ Spotify ID\'li şarkı bulunamadı');
      }
    }
    
    // 6. Sync işlemini tekrar çalıştır
    console.log('\n🔄 Sync işlemini tekrar çalıştırıyor...');
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('spotify-sync-user-data', {
      body: { userId: user.id }
    });
    
    if (syncError) {
      console.error('❌ Sync hatası:', syncError);
    } else {
      console.log('✅ Sync sonucu:', syncResult);
      if (syncResult && syncResult.success) {
        console.log(`   📊 İşlenen: ${syncResult.processed}, Başarısız: ${syncResult.failed}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug test hatası:', error);
  }
}

// Test fonksiyonunu çalıştır
debugSpotifySync();
