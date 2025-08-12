// Düzeltilmiş Vercel Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

// Token'ı doğru şekilde al
function getAccessToken() {
  const tokenKey = 'sb-ghbsezyszcrzqezoanav-auth-token';
  const tokenData = localStorage.getItem(tokenKey);
  
  if (!tokenData) {
    console.log('❌ Token bulunamadı');
    return null;
  }
  
  try {
    const parsed = JSON.parse(tokenData);
    console.log('📄 Token formatı:', typeof parsed);
    
    if (parsed.access_token) {
      console.log('✅ Access token bulundu');
      return parsed.access_token;
    } else {
      console.log('❌ Access token yok');
      return null;
    }
  } catch (e) {
    console.log('❌ Token parse hatası:', e.message);
    return null;
  }
}

async function testSpotifyConnection() {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    console.log('💡 Önce giriş yapın');
    return;
  }
  
  try {
    // Kullanıcı bilgilerini al
    console.log('🔍 Kullanıcı bilgileri alınıyor...');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('📡 User response status:', userResponse.status);
    
    if (!userResponse.ok) {
      console.error('❌ User API hatası:', userResponse.status, userResponse.statusText);
      return;
    }
    
    const userData = await userResponse.json();
    const user = userData.user;
    
    if (!user) {
      console.log('❌ Kullanıcı bulunamadı');
      return;
    }
    
    console.log('👤 Kullanıcı:', user.id);
    
    // Spotify bağlantısını kontrol et
    console.log('🔍 Spotify bağlantısı kontrol ediliyor...');
    const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${user.id}&select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('📡 Connection response status:', connectionResponse.status);
    
    if (!connectionResponse.ok) {
      console.error('❌ Connection API hatası:', connectionResponse.status);
      return;
    }
    
    const connections = await connectionResponse.json();
    console.log('🔗 Spotify bağlantısı:', connections.length > 0 ? '✅ Var' : '❌ Yok');
    
    if (connections.length > 0) {
      console.log('📊 Bağlantı detayları:', connections[0]);
    }
    
    // Çalma listelerini getir
    console.log('🔍 Çalma listeleri alınıyor...');
    const playlistsResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?user_id=eq.${user.id}&select=name,total_tracks`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('📡 Playlists response status:', playlistsResponse.status);
    
    if (!playlistsResponse.ok) {
      console.error('❌ Playlists API hatası:', playlistsResponse.status);
      return;
    }
    
    const playlists = await playlistsResponse.json();
    console.log('📋 Çalma listeleri:', playlists.length, 'adet');
    
    if (playlists.length > 0) {
      console.log('🎵 İlk 3 çalma listesi:');
      playlists.slice(0, 3).forEach((p, i) => {
        console.log(`${i+1}. ${p.name} (${p.total_tracks} şarkı)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
testSpotifyConnection();
