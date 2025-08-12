// Düzeltilmiş Spotify Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function fixedSpotifyTest() {
  try {
    // Token'ı al
    const tokenKey = 'sb-ghbsezyszcrzqezoanav-auth-token';
    const tokenData = localStorage.getItem(tokenKey);
    
    if (!tokenData) {
      console.log('❌ Token bulunamadı');
      return;
    }
    
    const parsed = JSON.parse(tokenData);
    const accessToken = parsed.access_token;
    
    console.log('✅ Access token bulundu');
    
    // Kullanıcı bilgilerini al
    console.log('🔍 Kullanıcı bilgileri alınıyor...');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userResponse.ok) {
      console.error('❌ User API hatası:', userResponse.status);
      return;
    }
    
    const userData = await userResponse.json();
    console.log('📄 API yanıtı:', userData);
    
    // Kullanıcı ID'sini doğru şekilde al
    const userId = userData.id || userData.user?.id;
    
    if (!userId) {
      console.log('❌ Kullanıcı ID bulunamadı');
      console.log('📋 Mevcut alanlar:', Object.keys(userData));
      return;
    }
    
    console.log('✅ Kullanıcı bulundu:', userId);
    console.log('👤 Kullanıcı detayları:', {
      id: userId,
      email: userData.email,
      role: userData.role,
      created_at: userData.created_at
    });
    
    // Spotify bağlantısını kontrol et
    console.log('🔍 Spotify bağlantısı kontrol ediliyor...');
    const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('📡 Connection response status:', connectionResponse.status);
    
    if (connectionResponse.ok) {
      const connections = await connectionResponse.json();
      console.log('🔗 Spotify bağlantısı:', connections.length > 0 ? '✅ Var' : '❌ Yok');
      console.log('📊 Bağlantı sayısı:', connections.length);
      
      if (connections.length > 0) {
        console.log('📋 Bağlantı detayları:', connections[0]);
        
        // Çalma listelerini getir
        console.log('🔍 Çalma listeleri alınıyor...');
        const playlistsResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?user_id=eq.${userId}&select=name,total_tracks,playlist_id`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (playlistsResponse.ok) {
          const playlists = await playlistsResponse.json();
          console.log('📋 Çalma listeleri:', playlists.length, 'adet');
          
          if (playlists.length > 0) {
            console.log('🎵 İlk 5 çalma listesi:');
            playlists.slice(0, 5).forEach((p, i) => {
              console.log(`${i+1}. ${p.name} (${p.total_tracks} şarkı)`);
            });
          }
        } else {
          console.error('❌ Playlists API hatası:', playlistsResponse.status);
        }
      } else {
        console.log('💡 Spotify bağlantısı yok. Önce Spotify ile giriş yapın.');
      }
    } else {
      console.error('❌ Connection API hatası:', connectionResponse.status);
    }
    
    // Provider token ile Spotify API'sini test et
    if (parsed.provider_token) {
      console.log('🎵 Spotify API test ediliyor...');
      const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${parsed.provider_token}`
        }
      });
      
      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        console.log('✅ Spotify kullanıcısı:', spotifyData.display_name);
        console.log('🎵 Spotify ID:', spotifyData.id);
        console.log('📧 Spotify email:', spotifyData.email);
      } else {
        console.error('❌ Spotify API hatası:', spotifyResponse.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
fixedSpotifyTest();
