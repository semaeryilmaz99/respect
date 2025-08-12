// Token Debug Test - Bu kodu browser console'a kopyalayıp yapıştırın

// 1. Tüm localStorage'ı kontrol et
console.log('🔍 localStorage içeriği:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}:`, value ? value.substring(0, 50) + '...' : 'null');
}

// 2. Supabase token'larını bul
const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-'));
console.log('🔑 Supabase ile ilgili key\'ler:', supabaseKeys);

// 3. Token'ı doğru şekilde al
let accessToken = null;

// Farklı token formatlarını dene
const possibleTokens = [
  localStorage.getItem('sb-ghbsezyszcrzqezoanav-auth-token'),
  localStorage.getItem('supabase.auth.token'),
  localStorage.getItem('sb-auth-token')
];

console.log('🎫 Bulunan token\'lar:', possibleTokens.map(t => t ? 'Var' : 'Yok'));

// JSON formatındaki token'ı parse et
for (const token of possibleTokens) {
  if (token) {
    try {
      const parsed = JSON.parse(token);
      console.log('📄 Parsed token:', parsed);
      
      if (parsed.access_token) {
        accessToken = parsed.access_token;
        console.log('✅ Access token bulundu:', accessToken.substring(0, 20) + '...');
        break;
      }
    } catch (e) {
      // Token JSON değil, doğrudan string olabilir
      accessToken = token;
      console.log('✅ String token bulundu:', accessToken.substring(0, 20) + '...');
      break;
    }
  }
}

if (accessToken) {
  console.log('🔧 Access token hazır, test ediliyor...');
  
  const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';
  
  // Kullanıcı bilgilerini al
  fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`
    }
  })
  .then(response => {
    console.log('📡 Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('👤 User data:', data);
    if (data.user) {
      console.log('✅ Kullanıcı bulundu:', data.user.id);
    } else {
      console.log('❌ Kullanıcı bulunamadı');
    }
  })
  .catch(error => {
    console.error('❌ API hatası:', error);
  });
  
} else {
  console.log('❌ Geçerli token bulunamadı');
  console.log('💡 Sayfayı yenileyin ve tekrar giriş yapın');
}
