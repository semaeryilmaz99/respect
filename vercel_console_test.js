// Vercel Deploy için Console Test - Bu kodu browser console'a kopyalayıp yapıştırın

// 1. Supabase client'ını doğrudan oluştur
const supabaseUrl = 'https://ghbsezyszcrzqezoanav.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc';

// Supabase client'ını oluştur
const supabase = window.supabase || (() => {
  // Eğer window.supabase yoksa, basit bir client oluştur
  return {
    auth: {
      getUser: async () => {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${localStorage.getItem('sb-ghbsezyszcrzqezoanav-auth-token')}`
          }
        });
        return response.json();
      }
    },
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          single: async () => {
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}&select=${columns}`, {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${localStorage.getItem('sb-ghbsezyszcrzqezoanav-auth-token')}`
              }
            });
            return response.json();
          }
        })
      })
    }),
    functions: {
      invoke: async (functionName, options) => {
        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sb-ghbsezyszcrzqezoanav-auth-token')}`
          },
          body: JSON.stringify(options.body)
        });
        return response.json();
      }
    }
  };
})();

console.log('🔧 Supabase client hazırlandı');

// 2. Kullanıcı kontrolü
try {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('👤 Kullanıcı:', user?.id || 'Giriş yapılmamış');
  
  if (user) {
    // 3. Spotify bağlantısı kontrolü
    const { data: connection } = await supabase
      .from('spotify_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    console.log('🔗 Spotify bağlantısı:', connection ? '✅ Var' : '❌ Yok');
    
    // 4. Çalma listelerini getir
    const { data: playlists } = await supabase
      .from('spotify_playlists')
      .select('name, total_tracks')
      .eq('user_id', user.id);
    
    console.log('📋 Çalma listeleri:', playlists?.length || 0, 'adet');
    
    if (playlists?.length > 0) {
      console.log('🎵 İlk 3 çalma listesi:');
      playlists.slice(0, 3).forEach((p, i) => {
        console.log(`${i+1}. ${p.name} (${p.total_tracks} şarkı)`);
      });
    }
  }
} catch (error) {
  console.error('❌ Test hatası:', error);
}
