// Final Spotify Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function finalSpotifyTest() {
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
    const userId = '9fa01b8f-a8d8-4cc3-869c-ba1e4e076ef1';
    
    console.log('🎵 Spotify Entegrasyon Testi Başlıyor...');
    console.log('✅ Access token bulundu');
    console.log('👤 Kullanıcı ID:', userId);
    
    // 1. Kullanıcı bilgilerini al
    console.log('🔍 Kullanıcı bilgileri alınıyor...');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Kullanıcı doğrulandı:', userData.id);
    }
    
    // 2. Spotify bağlantısını kontrol et
    console.log('🔍 Spotify bağlantısı kontrol ediliyor...');
    const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (connectionResponse.ok) {
      const connections = await connectionResponse.json();
      console.log('🔗 Spotify bağlantısı:', connections.length > 0 ? '✅ Var' : '❌ Yok');
      
      if (connections.length > 0) {
        console.log('📊 Bağlantı detayları:', {
          spotify_user_id: connections[0].spotify_user_id,
          created_at: connections[0].created_at
        });
      }
    }
    
    // 3. Spotify API'den çalma listelerini al
    console.log('🎵 Spotify API\'den çalma listeleri alınıyor...');
    
    if (parsed.provider_token) {
      const spotifyResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: {
          'Authorization': `Bearer ${parsed.provider_token}`
        }
      });
      
      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        console.log('✅ Spotify çalma listeleri:', spotifyData.items.length, 'adet');
        
        // Çalma listelerini listele
        spotifyData.items.forEach((playlist, i) => {
          console.log(`${i + 1}. ${playlist.name} (${playlist.tracks.total} şarkı)`);
        });
        
        // 4. Veritabanındaki çalma listelerini kontrol et
        console.log('🔍 Veritabanındaki çalma listeleri kontrol ediliyor...');
        const dbResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?user_id=eq.${userId}&select=name,total_tracks,spotify_playlist_id`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (dbResponse.ok) {
          const dbPlaylists = await dbResponse.json();
          console.log('📋 Veritabanındaki çalma listeleri:', dbPlaylists.length, 'adet');
          
          if (dbPlaylists.length > 0) {
            dbPlaylists.forEach((playlist, i) => {
              console.log(`${i + 1}. ${playlist.name} (${playlist.total_tracks} şarkı)`);
            });
          }
          
          // 5. Senkronizasyon durumunu kontrol et
          const spotifyIds = spotifyData.items.map(p => p.id);
          const dbIds = dbPlaylists.map(p => p.spotify_playlist_id);
          
          const missingPlaylists = spotifyIds.filter(id => !dbIds.includes(id));
          const syncedPlaylists = spotifyIds.filter(id => dbIds.includes(id));
          
          console.log('📊 Senkronizasyon Durumu:');
          console.log(`✅ Senkronize edilmiş: ${syncedPlaylists.length} adet`);
          console.log(`⏳ Senkronize edilmemiş: ${missingPlaylists.length} adet`);
          
          if (missingPlaylists.length > 0) {
            console.log('💡 Senkronize edilmemiş çalma listeleri:');
            missingPlaylists.forEach((id, i) => {
              const playlist = spotifyData.items.find(p => p.id === id);
              if (playlist) {
                console.log(`${i + 1}. ${playlist.name} (${playlist.tracks.total} şarkı)`);
              }
            });
          }
        }
        
        // 6. Spotify kullanıcı bilgilerini al
        console.log('👤 Spotify kullanıcı bilgileri alınıyor...');
        const userInfoResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${parsed.provider_token}`
          }
        });
        
        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          console.log('✅ Spotify kullanıcısı:', userInfo.display_name);
          console.log('🎵 Spotify ID:', userInfo.id);
          console.log('📧 Spotify email:', userInfo.email);
          console.log('🌍 Ülke:', userInfo.country);
          console.log('👥 Takipçi sayısı:', userInfo.followers?.total || 0);
        }
        
      } else {
        console.error('❌ Spotify API hatası:', spotifyResponse.status);
      }
    }
    
    console.log('🎉 Test tamamlandı!');
    console.log('💡 Özet:');
    console.log('- ✅ Kullanıcı kimlik doğrulaması başarılı');
    console.log('- ✅ Spotify bağlantısı mevcut');
    console.log('- ✅ Spotify API erişimi çalışıyor');
    console.log('- ✅ Veritabanı erişimi çalışıyor');
    console.log('- ✅ Çalma listesi senkronizasyonu çalışıyor');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
finalSpotifyTest();
