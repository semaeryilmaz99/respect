// Takip Durumu Debug Test
// Bu script'i browser console'da çalıştırın

console.log('🔍 Takip Durumu Debug Test Başlıyor...')

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

// 2. Mevcut takip durumlarını kontrol et
async function checkFollowStatus(user) {
  try {
    console.log('🔍 Mevcut takip durumları kontrol ediliyor...')
    
    const { data, error } = await window.supabase
      .from('artist_follows')
      .select('artist_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ Takip durumu kontrol hatası:', error)
      return []
    }

    const followedIds = data?.map(item => item.artist_id) || []
    console.log('📊 Takip edilen sanatçı sayısı:', followedIds.length)
    console.log('📋 Takip edilen sanatçı ID\'leri:', followedIds)
    
    return followedIds
  } catch (error) {
    console.error('❌ Test hatası:', error)
    return []
  }
}

// 3. Sanatçı kartlarını kontrol et
function checkArtistCards(followedIds) {
  const artistCards = document.querySelectorAll('.artist-card')
  console.log('🎵 Sanatçı kartı sayısı:', artistCards.length)
  
  artistCards.forEach((card, index) => {
    const artistName = card.querySelector('.artist-name')?.textContent || 'Bilinmeyen'
    const followButton = card.querySelector('.follow-button')
    const isFollowing = followButton?.classList.contains('following')
    const buttonText = followButton?.textContent?.trim() || 'Buton bulunamadı'
    
    console.log(`${index + 1}. ${artistName}: ${buttonText} (following: ${isFollowing})`)
  })
}

// 4. Ana test fonksiyonu
async function runTest() {
  console.log('🚀 Test başlıyor...')
  
  const user = await checkUser()
  if (!user) return
  
  const followedIds = await checkFollowStatus(user)
  checkArtistCards(followedIds)
  
  console.log('✅ Test tamamlandı!')
}

// Test'i çalıştır
runTest()

// Manuel test için fonksiyonları global olarak erişilebilir yap
window.checkFollowStatus = checkFollowStatus
window.checkArtistCards = checkArtistCards
