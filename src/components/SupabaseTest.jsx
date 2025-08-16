import React, { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import userService from '../api/userService'

const SupabaseTest = () => {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // Mevcut kullanıcıyı al
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getCurrentUser()
  }, [])

  const runTests = async () => {
    setLoading(true)
    const results = {}

    try {
      // Test 1: Supabase bağlantısı
      console.log('🧪 Test 1: Supabase bağlantısı')
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(1)
      
      if (error) {
        results.connection = `❌ Hata: ${error.message}`
        console.error('❌ Supabase bağlantı hatası:', error)
      } else {
        results.connection = `✅ Başarılı - ${data?.length || 0} kayıt`
        console.log('✅ Supabase bağlantısı başarılı:', data)
      }

      // Test 2: Artists tablosu
      console.log('🧪 Test 2: Artists tablosu')
      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .limit(5)
      
      if (artistsError) {
        results.artists = `❌ Hata: ${artistsError.message}`
        console.error('❌ Artists tablosu hatası:', artistsError)
      } else {
        results.artists = `✅ Başarılı - ${artists?.length || 0} sanatçı`
        console.log('✅ Artists verisi:', artists)
      }

      // Test 3: Songs tablosu
      console.log('🧪 Test 3: Songs tablosu')
      const { data: songs, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .limit(5)
      
      if (songsError) {
        results.songs = `❌ Hata: ${songsError.message}`
        console.error('❌ Songs tablosu hatası:', songsError)
      } else {
        results.songs = `✅ Başarılı - ${songs?.length || 0} şarkı`
        console.log('✅ Songs verisi:', songs)
      }

      // Test 4: Spotify connections
      console.log('🧪 Test 4: Spotify connections')
      const { data: connections, error: connectionsError } = await supabase
        .from('spotify_connections')
        .select('*')
        .limit(5)
      
      if (connectionsError) {
        results.connections = `❌ Hata: ${connectionsError.message}`
        console.error('❌ Spotify connections hatası:', connectionsError)
      } else {
        results.connections = `✅ Başarılı - ${connections?.length || 0} bağlantı`
        console.log('✅ Spotify connections:', connections)
      }

      // Test 5: RPC fonksiyonları (eğer currentUser varsa)
      if (currentUser) {
        console.log('🧪 Test 5: RPC fonksiyonları')
        
        try {
          const isArtist = await userService.isUserArtist(currentUser.id)
          results.rpc_isArtist = `✅ Başarılı - ${isArtist}`
          console.log('✅ is_user_artist RPC:', isArtist)
        } catch (rpcError) {
          results.rpc_isArtist = `❌ Hata: ${rpcError.message}`
          console.error('❌ is_user_artist RPC hatası:', rpcError)
        }

        try {
          const artistSongs = await userService.getUserArtistSongs(currentUser.id, 5)
          results.rpc_artistSongs = `✅ Başarılı - ${artistSongs?.length || 0} şarkı`
          console.log('✅ get_user_artist_songs RPC:', artistSongs)
        } catch (rpcError) {
          results.rpc_artistSongs = `❌ Hata: ${rpcError.message}`
          console.error('❌ get_user_artist_songs RPC hatası:', rpcError)
        }
      } else {
        results.rpc = '⚠️ Kullanıcı giriş yapmamış'
      }

    } catch (error) {
      console.error('❌ Genel test hatası:', error)
      results.general = `❌ Genel hata: ${error.message}`
    }

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Supabase Bağlantı Testi</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Mevcut Kullanıcı:</strong> {currentUser ? currentUser.email : 'Giriş yapılmamış'}</p>
        <button 
          onClick={runTests} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Test ediliyor...' : 'Testleri Çalıştır'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h3>Test Sonuçları:</h3>
          {Object.entries(testResults).map(([test, result]) => (
            <div key={test} style={{ marginBottom: '10px' }}>
              <strong>{test}:</strong> {result}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>🔍 Manuel Test Komutları</h3>
        <p>Console'da bu komutları çalıştırabilirsiniz:</p>
        <pre style={{ 
          backgroundColor: '#f1f3f4', 
          padding: '10px', 
          borderRadius: '5px',
          overflow: 'auto'
        }}>
{`// Supabase bağlantısını test et
supabase.from('profiles').select('*').limit(1)

// Artists tablosunu test et
supabase.from('artists').select('*').limit(5)

// Songs tablosunu test et
supabase.from('songs').select('*').limit(5)

// RPC fonksiyonlarını test et (eğer giriş yapmışsanız)
supabase.rpc('is_user_artist', { user_uuid: 'YOUR_USER_ID' })
supabase.rpc('get_user_artist_songs', { user_uuid: 'YOUR_USER_ID' })`}
        </pre>
      </div>
    </div>
  )
}

export default SupabaseTest 