// Basit Vercel Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

// Token'ı localStorage'dan al
const token = localStorage.getItem('sb-ghbsezyszcrzqezoanav-auth-token');
console.log('🔑 Token bulundu:', token ? '✅' : '❌');

if (token) {
  try {
    // Kullanıcı bilgilerini al
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userData = await userResponse.json();
    const user = userData.user;
    
    console.log('👤 Kullanıcı:', user?.id || 'Bulunamadı');
    
    if (user) {
      // Spotify bağlantısını kontrol et
      const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${user.id}&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const connections = await connectionResponse.json();
      console.log('🔗 Spotify bağlantısı:', connections.length > 0 ? '✅ Var' : '❌ Yok');
      
      // Çalma listelerini getir
      const playlistsResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?user_id=eq.${user.id}&select=name,total_tracks`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`
        }
      });
      
      const playlists = await playlistsResponse.json();
      console.log('📋 Çalma listeleri:', playlists.length, 'adet');
      
      if (playlists.length > 0) {
        console.log('🎵 İlk 3 çalma listesi:');
        playlists.slice(0, 3).forEach((p, i) => {
          console.log(`${i+1}. ${p.name} (${p.total_tracks} şarkı)`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
} else {
  console.log('💡 Önce giriş yapın');
}
