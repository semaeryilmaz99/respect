// Spotify Playlist Sync Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function spotifyPlaylistSyncTest() {
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
    
    console.log('✅ Access token bulundu');
    console.log('👤 Kullanıcı ID:', userId);
    
    // 1. Önce tabloda veri var mı kontrol et
    console.log('🔍 Spotify playlists tablosunda veri kontrol ediliyor...');
    
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?select=count`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Tablo kontrol status:', checkResponse.status);
    
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('📊 Tablo veri sayısı:', checkData.length);
      
      if (checkData.length > 0) {
        console.log('✅ Tabloda veri var, ilk kayıt:', checkData[0]);
      } else {
        console.log('💡 Tabloda veri yok, senkronizasyon gerekli');
      }
    } else {
      console.log('❌ Tablo erişim hatası:', checkResponse.status);
    }
    
    // 2. Spotify API'den çalma listelerini al
    console.log('🎵 Spotify API\'den çalma listeleri alınıyor...');
    
    if (parsed.provider_token) {
      const spotifyResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
        headers: {
          'Authorization': `Bearer ${parsed.provider_token}`
        }
      });
      
      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        console.log('✅ Spotify çalma listeleri:', spotifyData.items.length, 'adet');
        
        spotifyData.items.forEach((playlist, i) => {
          console.log(`${i + 1}. ${playlist.name} (${playlist.tracks.total} şarkı) - ID: ${playlist.id}`);
        });
        
        // 3. İlk çalma listesini manuel olarak eklemeyi dene
        if (spotifyData.items.length > 0) {
          const firstPlaylist = spotifyData.items[0];
          console.log('🔧 İlk çalma listesi manuel olarak ekleniyor...');
          
          const playlistData = {
            spotify_playlist_id: firstPlaylist.id,
            user_id: userId,
            name: firstPlaylist.name,
            description: firstPlaylist.description,
            cover_url: firstPlaylist.images?.[0]?.url,
            is_public: firstPlaylist.public,
            is_collaborative: firstPlaylist.collaborative,
            total_tracks: firstPlaylist.tracks.total,
            spotify_owner_id: firstPlaylist.owner.id,
            spotify_owner_name: firstPlaylist.owner.display_name,
            last_synced_at: new Date().toISOString()
          };
          
          console.log('📋 Eklenecek veri:', playlistData);
          
          const insertResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(playlistData)
          });
          
          console.log('📡 Insert response status:', insertResponse.status);
          
          if (insertResponse.ok) {
            console.log('✅ Çalma listesi başarıyla eklendi!');
            
            // 4. Eklenen veriyi kontrol et
            console.log('🔍 Eklenen veri kontrol ediliyor...');
            const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?spotify_playlist_id=eq.${firstPlaylist.id}&select=*`, {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('✅ Eklenen veri doğrulandı:', verifyData[0]);
            }
          } else {
            const errorText = await insertResponse.text();
            console.log('❌ Insert hatası:', errorText);
          }
        }
        
      } else {
        console.error('❌ Spotify API hatası:', spotifyResponse.status);
      }
    }
    
    // 5. Son durumu kontrol et
    console.log('🔍 Son durum kontrol ediliyor...');
    const finalResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_playlists?user_id=eq.${userId}&select=name,total_tracks,spotify_playlist_id`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log('📋 Veritabanındaki çalma listeleri:', finalData.length, 'adet');
      finalData.forEach((playlist, i) => {
        console.log(`${i + 1}. ${playlist.name} (${playlist.total_tracks} şarkı)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
spotifyPlaylistSyncTest();
