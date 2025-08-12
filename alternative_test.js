// Alternatif Test - Bu kodu browser console'a kopyalayıp yapıştırın

const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

async function alternativeTest() {
  try {
    // 1. Token'ı al
    const tokenKey = 'sb-ghbsezyszcrzqezoanav-auth-token';
    const tokenData = localStorage.getItem(tokenKey);
    
    if (!tokenData) {
      console.log('❌ Token bulunamadı');
      return;
    }
    
    const parsed = JSON.parse(tokenData);
    const accessToken = parsed.access_token;
    
    console.log('✅ Access token bulundu');
    
    // 2. Farklı endpoint'leri dene
    console.log('🔍 Farklı endpoint\'ler deneniyor...');
    
    // Endpoint 1: /auth/v1/user
    console.log('📡 Test 1: /auth/v1/user');
    const userResponse1 = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const userData1 = await userResponse1.json();
    console.log('Yanıt 1:', userData1);
    
    // Endpoint 2: /auth/v1/user (farklı header)
    console.log('📡 Test 2: /auth/v1/user (farklı header)');
    const userResponse2 = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const userData2 = await userResponse2.json();
    console.log('Yanıt 2:', userData2);
    
    // Endpoint 3: /rest/v1/profiles (kullanıcı profili)
    console.log('📡 Test 3: /rest/v1/profiles');
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const profileData = await profileResponse.json();
    console.log('Profil yanıtı:', profileData);
    
    // 3. Token'ı yenilemeyi dene
    console.log('🔄 Token yenileme deneniyor...');
    if (parsed.refresh_token) {
      const refreshResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: parsed.refresh_token
        })
      });
      
      const refreshData = await refreshResponse.json();
      console.log('Token yenileme yanıtı:', refreshData);
      
      if (refreshData.access_token) {
        console.log('✅ Token yenilendi, yeni token ile test ediliyor...');
        
        const newUserResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${refreshData.access_token}`
          }
        });
        
        const newUserData = await newUserResponse.json();
        console.log('Yeni token ile kullanıcı yanıtı:', newUserData);
      }
    }
    
    // 4. Provider token'ı dene (Spotify token)
    console.log('🎵 Provider token test ediliyor...');
    if (parsed.provider_token) {
      console.log('Spotify provider token bulundu:', parsed.provider_token.substring(0, 20) + '...');
      
      // Spotify API'sini test et
      const spotifyResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${parsed.provider_token}`
        }
      });
      
      const spotifyData = await spotifyResponse.json();
      console.log('Spotify kullanıcı bilgisi:', spotifyData);
    }
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  }
}

// Test'i çalıştır
alternativeTest();
