// Spotify Bağlantı Debug Testi - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function spotifyConnectionDebug() {
  try {
    console.log('🔍 Spotify Bağlantı Debug Testi Başlıyor...');
    
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
    
    // 3. Spotify bağlantısını doğrudan kontrol et
    console.log('🔍 Spotify bağlantısı doğrudan kontrol ediliyor...');
    const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('📡 Connection response status:', connectionResponse.status);
    
    if (connectionResponse.ok) {
      const connections = await connectionResponse.json();
      console.log('📊 Spotify bağlantıları:', connections.length, 'adet');
      
      if (connections.length > 0) {
        console.log('✅ Spotify bağlantısı bulundu:', connections[0]);
        
        // 4. Uygulama kodunun kullandığı yöntemi test et
        console.log('🔍 Uygulama kodunun kullandığı yöntemi test ediliyor...');
        const singleConnectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${userId}&select=*&limit=1`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log('📡 Single connection response status:', singleConnectionResponse.status);
        
        if (singleConnectionResponse.ok) {
          const singleConnection = await singleConnectionResponse.json();
          console.log('📊 Single connection result:', singleConnection);
        }
        
        // 5. Supabase Edge Function'ı test et
        console.log('🔍 Supabase Edge Function test ediliyor...');
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
        } else {
          const errorText = await functionResponse.text();
          console.log('❌ Function error:', errorText);
        }
        
      } else {
        console.log('❌ Spotify bağlantısı bulunamadı');
      }
    } else {
      const errorText = await connectionResponse.text();
      console.log('❌ Connection API hatası:', errorText);
    }
    
    // 6. RLS politikalarını test et
    console.log('🔍 RLS politikaları test ediliyor...');
    
    // Farklı kullanıcı ID'leri ile test et
    const testUserIds = [
      userId,
      '9fa01b8f-a8d8-4cc3-869c-ba1e4e076ef1', // Tam ID
      userId.replace(/-/g, ''), // Tire olmadan
      userId.toUpperCase(), // Büyük harf
      userId.toLowerCase() // Küçük harf
    ];
    
    for (const testUserId of testUserIds) {
      console.log(`🔍 Test user ID: ${testUserId}`);
      
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${testUserId}&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`✅ ${testUserId} için bağlantı sayısı:`, testData.length);
      } else {
        console.log(`❌ ${testUserId} için hata:`, testResponse.status);
      }
    }
    
    // 7. Tüm spotify_connections tablosunu kontrol et
    console.log('🔍 Tüm spotify_connections tablosu kontrol ediliyor...');
    const allConnectionsResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?select=user_id,spotify_user_id,created_at`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (allConnectionsResponse.ok) {
      const allConnections = await allConnectionsResponse.json();
      console.log('📊 Tüm bağlantılar:', allConnections);
      
      // Kullanıcımızın bağlantısını bul
      const ourConnection = allConnections.find(conn => conn.user_id === userId);
      if (ourConnection) {
        console.log('✅ Kullanıcımızın bağlantısı bulundu:', ourConnection);
      } else {
        console.log('❌ Kullanıcımızın bağlantısı bulunamadı');
        console.log('💡 Mevcut bağlantılar:', allConnections.map(c => c.user_id));
      }
    }
    
  } catch (error) {
    console.error('❌ Debug hatası:', error);
  }
}

// Test'i çalıştır
spotifyConnectionDebug();
