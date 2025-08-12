// Detaylı Kullanıcı Testi - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function detailedUserTest() {
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
    console.log('🔑 Token başlangıcı:', accessToken.substring(0, 50) + '...');
    
    // Kullanıcı bilgilerini al
    console.log('🔍 Kullanıcı bilgileri alınıyor...');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('📡 Response status:', userResponse.status);
    console.log('📡 Response headers:', Object.fromEntries(userResponse.headers.entries()));
    
    const userData = await userResponse.json();
    console.log('📄 Tam API yanıtı:', userData);
    
    // Yanıtı detaylı incele
    console.log('🔍 Yanıt analizi:');
    console.log('- user alanı var mı?', 'user' in userData);
    console.log('- user değeri:', userData.user);
    console.log('- user tipi:', typeof userData.user);
    console.log('- Tüm anahtarlar:', Object.keys(userData));
    
    if (userData.user) {
      console.log('✅ Kullanıcı bulundu:', userData.user.id);
      console.log('👤 Kullanıcı detayları:', userData.user);
      
      // Spotify bağlantısını kontrol et
      console.log('🔍 Spotify bağlantısı kontrol ediliyor...');
      const connectionResponse = await fetch(`${supabaseUrl}/rest/v1/spotify_connections?user_id=eq.${userData.user.id}&select=*`, {
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
        }
      } else {
        console.error('❌ Connection API hatası:', connectionResponse.status);
      }
      
    } else {
      console.log('❌ Kullanıcı bulunamadı');
      console.log('💡 Olası nedenler:');
      console.log('1. Token süresi dolmuş olabilir');
      console.log('2. Kullanıcı hesabı silinmiş olabilir');
      console.log('3. Token geçersiz olabilir');
      
      // Token'ın süresini kontrol et
      if (parsed.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = parsed.expires_at;
        console.log('⏰ Token süresi kontrolü:');
        console.log('- Şu anki zaman:', now);
        console.log('- Token bitiş zamanı:', expiresAt);
        console.log('- Süre dolmuş mu?', now > expiresAt ? 'Evet' : 'Hayır');
      }
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
detailedUserTest();
