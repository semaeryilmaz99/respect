// Spotify Sync Fixed Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function spotifySyncFixedTest() {
  try {
    console.log('🔧 Spotify Sync Fixed Test Başlıyor...');
    
    // 1. Token'ı al
    const tokenKey = 'sb-ghbsezyszcrzqezoanav-auth-token';
    const tokenData = localStorage.getItem(tokenKey);
    
    if (!tokenData) {
      console.log('❌ Token bulunamadı');
      return;
    }
    
    const parsed = JSON.parse(tokenData);
    const accessToken = parsed.access_token;
    const userId = '9fa01b8f-a8d8-4cc3-869c-ba1e4e076ef1';
    
    console.log('✅ Access token bulundu');
    console.log('👤 Kullanıcı ID:', userId);
    
    // 2. Kullanıcı kimlik doğrulaması
    console.log('🔍 Kullanıcı kimlik doğrulaması kontrol ediliyor...');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userResponse.ok) {
      console.error('❌ Kullanıcı kimlik doğrulaması başarısız:', userResponse.status);
      return;
    }
    
    const userData = await userResponse.json();
    console.log('✅ Kullanıcı kimlik doğrulaması başarılı:', userData.id);
    
    // 3. Spotify bağlantısını kontrol et
    console.log('🔍 Spotify bağlantısı kontrol ediliyor...');
    const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!connectionResponse.ok) {
      console.error('❌ Spotify bağlantısı bulunamadı');
      return;
    }
    
    const connections = await connectionResponse.json();
    console.log('✅ Spotify bağlantısı bulundu:', connections.length, 'adet');
    
    // 4. Düzeltilmiş Edge Function'ı test et
    console.log('🔧 Düzeltilmiş Edge Function test ediliyor...');
    const functionResponse = await fetch(`${supabaseUrl}/functions/v1/spotify-sync-playlists`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        syncType: 'user_playlists'
      })
    });
    
    console.log('📡 Function response status:', functionResponse.status);
    
    if (functionResponse.ok) {
      const functionData = await functionResponse.json();
      console.log('📊 Function response:', functionData);
      
      if (functionData.success) {
        console.log('✅ Spotify sync başarılı!');
        console.log('📊 İşlenen:', functionData.processed, 'adet');
        console.log('❌ Başarısız:', functionData.failed, 'adet');
        
        // 5. Senkronize edilen çalma listelerini kontrol et
        console.log('🔍 Senkronize edilen çalma listeleri kontrol ediliyor...');
        const playlistsResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?user_id=eq.${userId}&select=name,total_tracks,last_synced_at`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (playlistsResponse.ok) {
          const playlists = await playlistsResponse.json();
          console.log('📋 Senkronize edilen çalma listeleri:', playlists.length, 'adet');
          playlists.forEach((playlist, index) => {
            console.log(`${index + 1}. ${playlist.name} (${playlist.total_tracks} şarkı)`);
          });
        }
        
      } else {
        console.log('❌ Spotify sync başarısız:', functionData.error);
      }
    } else {
      const errorText = await functionResponse.text();
      console.log('❌ Function error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
spotifySyncFixedTest();
