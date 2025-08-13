// Sync Status Debug Script - Oturum Bazlı Kontrol
// Bu scripti browser console'da çalıştırın

console.log('🔍 Oturum Bazlı Sync Status Debug Başlıyor...')

// 1. Kullanıcı kontrolü
window.supabase.auth.getUser().then(({ data: { user }, error }) => {
  if (error) {
    console.log('❌ Kullanıcı hatası:', error)
    return
  }
  
  console.log('👤 Kullanıcı:', user)
  
  if (!user) {
    console.log('❌ Kullanıcı giriş yapmamış')
    return
  }

  // 2. Spotify bağlantısı kontrolü
  window.supabase
    .from('spotify_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Spotify bağlantısı hatası:', error.message)
        return
      }
      
      console.log('🔗 Spotify Bağlantısı:', data ? '✅ Var' : '❌ Yok')
      
      if (data) {
        // 3. Sync logları kontrolü
        window.supabase
          .from('spotify_sync_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('sync_type', 'user_playlist_data')
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data: syncLogs, error }) => {
            if (error) {
              console.log('❌ Sync logları hatası:', error.message)
              return
            }
            
            console.log('📋 Sync Logları:', syncLogs)
            
            if (syncLogs && syncLogs.length > 0) {
              const lastSync = syncLogs[0]
              const syncTime = new Date(lastSync.created_at)
              
              // Oturum bilgisini al
              window.supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                  const sessionStartTime = new Date(session.created_at)
                  const isRecent = syncTime > sessionStartTime
                  
                  console.log('🕐 Oturum Başlangıcı:', sessionStartTime.toLocaleString('tr-TR'))
                  console.log('🕐 Son Sync:', syncTime.toLocaleString('tr-TR'))
                  console.log('✅ Oturum sonrası sync mi:', isRecent)
                  console.log('📊 Sync durumu:', isRecent ? 'GÜNCEL' : 'YENİ SYNC GEREKLİ')
                  
                  // 4. Spotify ID'li sanatçılar kontrolü
                  window.supabase
                    .from('artists')
                    .select('count')
                    .not('spotify_id', 'is', null)
                    .then(({ count, error }) => {
                      if (!error) {
                        console.log('🎵 Spotify ID\'li Sanatçı Sayısı:', count)
                      }
                    })
                  
                  // 5. Spotify ID'li şarkılar kontrolü
                  window.supabase
                    .from('songs')
                    .select('count')
                    .not('spotify_id', 'is', null)
                    .then(({ count, error }) => {
                      if (!error) {
                        console.log('🎵 Spotify ID\'li Şarkı Sayısı:', count)
                      }
                    })
                }
              })
            } else {
              console.log('❌ Hiç sync logu yok - İlk sync gerekli')
            }
          })
      }
    })
})

console.log('🔍 Debug tamamlandı!')
