// User Recent Respects Debug Test
// Bu script'i browser console'da çalıştırın

console.log('🔍 User Recent Respects Debug Test Başlıyor...')
console.log('📱 Mevcut URL:', window.location.href)
console.log('🔍 URL\'den user ID var mı:', window.location.pathname.includes('/user/'))

// 1. Kullanıcı kontrolü
async function checkUser() {
  const { data: { user }, error } = await window.supabase.auth.getUser()
  if (error || !user) {
    console.log('❌ Kullanıcı giriş yapmamış')
    return null
  }
  console.log('✅ Kullanıcı giriş yapmış:', user.id)
  return user
}

// 2. Mevcut respect gönderimlerini kontrol et
async function checkRecentRespects(user) {
  try {
    console.log('🔍 Son respect gönderimleri kontrol ediliyor...')
    
    const { data, error } = await window.supabase
      .from('respect_transactions')
      .select(`
        *,
        artists (
          id,
          name,
          avatar_url
        ),
        songs (
          id,
          title,
          cover_url,
          artists (
            id,
            name
          )
        )
      `)
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('❌ Respect gönderimleri kontrol hatası:', error)
      return []
    }

    console.log('📊 Son respect gönderimleri:', data?.length || 0)
    console.log('📋 Respect detayları:', data)
    
    return data || []
  } catch (error) {
    console.error('❌ Test hatası:', error)
    return []
  }
}

// 3. User Recent Respects bileşenini kontrol et
function checkUserRecentRespectsComponent() {
  const component = document.querySelector('.user-recent-respects')
  if (!component) {
    console.log('❌ User Recent Respects bileşeni bulunamadı')
    return
  }
  
  console.log('✅ User Recent Respects bileşeni bulundu')
  
  const title = component.querySelector('.section-title')?.textContent
  console.log('📝 Başlık:', title)
  
  const respectItems = component.querySelectorAll('.recent-respect-item')
  console.log('🎵 Respect item sayısı:', respectItems.length)
  
  respectItems.forEach((item, index) => {
    const recipientName = item.querySelector('.recent-respect-recipient')?.textContent
    const amount = item.querySelector('.respect-amount')?.textContent
    const time = item.querySelector('.recent-respect-time')?.textContent
    
    console.log(`${index + 1}. ${recipientName} - ${amount} - ${time}`)
  })
}

// 4. Ana test fonksiyonu
async function runTest() {
  console.log('🚀 Test başlıyor...')
  
  const user = await checkUser()
  if (!user) return
  
  const recentRespects = await checkRecentRespects(user)
  checkUserRecentRespectsComponent()
  
  console.log('✅ Test tamamlandı!')
}

// Test'i çalıştır
runTest()

// Manuel test için fonksiyonları global olarak erişilebilir yap
window.checkRecentRespects = checkRecentRespects
window.checkUserRecentRespectsComponent = checkUserRecentRespectsComponent
