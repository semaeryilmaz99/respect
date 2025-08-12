// Playlist Debug Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function playlistDebugTest() {
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
    const userId = '9fa01b8f-a8d8-4cc3-869c-ba1e4e076ef1'; // Test sonucundan aldığımız ID
    
    console.log('✅ Access token bulundu');
    console.log('👤 Test kullanıcı ID:', userId);
    
    // 1. Tablo yapısını kontrol et
    console.log('🔍 Tablo yapısı kontrol ediliyor...');
    
    // Farklı endpoint'leri dene
    const endpoints = [
      '/rest/v1/spotify_playlists',
      '/rest/v1/spotify_playlists?select=*',
      '/rest/v1/spotify_playlists?select=name',
      '/rest/v1/spotify_playlists?limit=1',
      '/rest/v1/spotify_playlists?user_id=eq.' + userId,
      '/rest/v1/spotify_playlists?user_id=eq.' + userId + '&select=name,total_tracks',
      '/rest/v1/spotify_playlists?user_id=eq.' + userId + '&select=*'
    ];
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`📡 Test ${i + 1}: ${endpoint}`);
      
      try {
        const response = await fetch(`${supabaseUrl}${endpoint}`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Başarılı - ${Array.isArray(data) ? data.length : 'object'} sonuç`);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`   📋 İlk sonuç:`, data[0]);
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Hata: ${errorText.substring(0, 200)}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
      }
      
      console.log(''); // Boş satır
    }
    
    // 2. Diğer tabloları da test et
    console.log('🔍 Diğer tablolar test ediliyor...');
    
    const otherTables = [
      '/rest/v1/profiles',
      '/rest/v1/spotify_connections',
      '/rest/v1/songs',
      '/rest/v1/artists'
    ];
    
    for (const table of otherTables) {
      console.log(`📡 Test: ${table}`);
      
      try {
        const response = await fetch(`${supabaseUrl}${table}?select=*&limit=1`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Erişilebilir - ${Array.isArray(data) ? data.length : 'object'} sonuç`);
        } else {
          console.log(`   ❌ Erişilemez`);
        }
        
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
      }
    }
    
    // 3. Spotify API'den çalma listelerini al
    console.log('🎵 Spotify API\'den çalma listeleri alınıyor...');
    
    if (parsed.provider_token) {
      try {
        const spotifyResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=5', {
          headers: {
            'Authorization': `Bearer ${parsed.provider_token}`
          }
        });
        
        if (spotifyResponse.ok) {
          const spotifyData = await spotifyResponse.json();
          console.log('✅ Spotify çalma listeleri:', spotifyData.items.length, 'adet');
          
          spotifyData.items.forEach((playlist, i) => {
            console.log(`${i + 1}. ${playlist.name} (${playlist.tracks.total} şarkı)`);
          });
        } else {
          console.error('❌ Spotify API hatası:', spotifyResponse.status);
        }
      } catch (error) {
        console.error('❌ Spotify API exception:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
playlistDebugTest();
