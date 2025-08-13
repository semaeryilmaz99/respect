// FollowButton Debug Test
// Bu script'i browser console'da çalıştırın

console.log('🔍 FollowButton Debug Test Başlıyor...')

// 1. Kullanıcı kontrolü
const user = window.supabase.auth.getUser()
console.log('👤 Kullanıcı:', user)

// 2. Test için bir sanatçı ID'si (gerçek bir sanatçı ID'si kullanın)
const testArtistId = '550e8400-e29b-41d4-a716-446655440000' // Örnek UUID

// 3. Takip durumu kontrolü
async function testFollowStatus() {
  try {
    console.log('🔍 Takip durumu kontrol ediliyor...')
    
    const { data: { user }, error: userError } = await window.supabase.auth.getUser()
    if (userError || !user) {
      console.log('❌ Kullanıcı giriş yapmamış')
      return
    }
    
    console.log('✅ Kullanıcı giriş yapmış:', user.id)
    
    const { data, error } = await window.supabase
      .from('artist_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('artist_id', testArtistId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Takip durumu kontrol hatası:', error)
      return
    }

    const isFollowing = !!data
    console.log('📊 Takip durumu:', isFollowing)
    console.log('📋 Veri:', data)
    
    return isFollowing
  } catch (error) {
    console.error('❌ Test hatası:', error)
  }
}

// 4. Sanatçı takipçi sayısı kontrolü
async function testFollowersCount() {
  try {
    console.log('🔍 Takipçi sayısı kontrol ediliyor...')
    
    const { data, error } = await window.supabase
      .from('artists')
      .select('followers_count')
      .eq('id', testArtistId)
      .single()

    if (error) {
      console.error('❌ Takipçi sayısı hatası:', error)
      return 0
    }

    console.log('📊 Takipçi sayısı:', data?.followers_count || 0)
    return data?.followers_count || 0
  } catch (error) {
    console.error('❌ Test hatası:', error)
    return 0
  }
}

// 5. Test çalıştır
async function runTest() {
  console.log('🚀 Test başlıyor...')
  
  await testFollowStatus()
  await testFollowersCount()
  
  console.log('✅ Test tamamlandı!')
}

// Test'i çalıştır
runTest()

// Manuel test için fonksiyonları global olarak erişilebilir yap
window.testFollowStatus = testFollowStatus
window.testFollowersCount = testFollowersCount
