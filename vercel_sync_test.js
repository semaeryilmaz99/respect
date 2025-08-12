// Vercel Senkronizasyon Testi - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function testVercelSync() {
  try {
    // Token'ı localStorage'dan al
    const token = localStorage.getItem('sb-ghbsezyszcrzqezoanav-auth-token');
    console.log('🔑 Token bulundu:', token ? '✅' : '❌');
    
    if (!token) {
      console.log('💡 Önce giriş yapın');
      return;
    }
    
    // Kullanıcı bilgilerini al
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userData = await userResponse.json();
    const user = userData.user;
    
    if (!user) {
      console.error('❌ Kullanıcı bulunamadı');
      return;
    }
    
    console.log('👤 Kullanıcı:', user.id);
    
    // Spotify bağlantısını kontrol et
    const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${user.id}&select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    const connections = await connectionResponse.json();
    
    if (connections.length === 0) {
      console.error('❌ Spotify bağlantısı bulunamadı');
      console.log('💡 Önce Spotify hesabınızı bağlayın');
      return;
    }
    
    console.log('✅ Spotify bağlantısı bulundu');
    
    // Senkronizasyon başlat
    console.log('🔄 Çalma listeleri senkronize ediliyor...');
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/spotify-sync-playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: user.id,
        syncType: 'user_playlists'
      })
    });
    
    const syncResult = await syncResponse.json();
    
    if (syncResult.error) {
      console.error('❌ Senkronizasyon hatası:', syncResult.error);
      return;
    }
    
    if (!syncResult.success) {
      console.error('❌ Senkronizasyon başarısız:', syncResult.error);
      return;
    }
    
    console.log('✅ Senkronizasyon başarılı!');
    console.log('📊 Sonuç:', syncResult);
    
    // Güncel çalma listelerini getir
    const playlistsResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?user_id=eq.${user.id}&select=name,total_tracks`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    const playlists = await playlistsResponse.json();
    console.log('📋 Toplam çalma listesi:', playlists.length, 'adet');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test fonksiyonunu çalıştır
testVercelSync();
