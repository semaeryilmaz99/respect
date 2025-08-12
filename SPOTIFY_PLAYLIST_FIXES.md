# Spotify Playlist Sync Fixes

## Sorunlar ve Çözümler

### 1. PostgREST Order Clause Hatası

**Sorun:** `user_playlist_preferences.sort_order.asc,name.asc` order clause'u PostgREST tarafından parse edilemiyordu.

**Hata:** `PGRST100 - Failed to Parse Order: unexpected "s" expecting "asc", "desc", "nullsfirst" or "nullslast"`

**Çözüm:**
- Karmaşık order clause'u kaldırdık
- Verileri JavaScript'te filtreleme ve sıralama yapıyoruz
- `!inner` join yerine normal join kullanıyoruz

```javascript
// Önceki kod (hatalı):
.order('user_playlist_preferences.sort_order', { ascending: true })
.order('name', { ascending: true });

// Yeni kod (düzeltilmiş):
// JavaScript'te sıralama yapıyoruz
const visiblePlaylists = data
  ?.filter(playlist => {
    const prefs = playlist.user_playlist_preferences?.[0];
    return prefs?.is_visible !== false;
  })
  ?.sort((a, b) => {
    const orderA = prefsA?.sort_order || 0;
    const orderB = prefsB?.sort_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name || '').localeCompare(b.name || '');
  });
```

### 2. Spotify Connection Not Found Hatası

**Sorun:** Kullanıcı giriş yapmış ama Spotify bağlantısı bulunamıyordu.

**Hata:** `Spotify connection not found`

**Çözüm:**
- Sync işleminden önce Spotify bağlantısını kontrol ediyoruz
- Daha açıklayıcı hata mesajları eklendi
- Bağlantı durumunu kontrol eden helper fonksiyon eklendi

```javascript
// Yeni helper fonksiyon:
_ensureSpotifyConnection: async (userId) => {
  const { data: connection, error: connectionError } = await supabase
    .from('spotify_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (connectionError || !connection) {
    throw new Error('Spotify bağlantısı bulunamadı. Lütfen önce Spotify hesabınızı bağlayın.');
  }

  return connection;
}
```

## Yapılan Değişiklikler

### 1. `src/api/playlistService.js`
- `getUserPlaylists()` fonksiyonu düzeltildi
- `getPlaylistStats()` fonksiyonu düzeltildi
- `syncUserPlaylists()` ve `syncPlaylistTracks()` fonksiyonlarına bağlantı kontrolü eklendi
- `_ensureSpotifyConnection()` helper fonksiyonu eklendi
- `checkSpotifyConnection()` fonksiyonu eklendi

### 2. `src/components/SpotifyConnectionStatus.jsx`
- Spotify bağlantı durumunu gösteren yeni component
- Bağlantı kurma ve senkronizasyon butonları
- Gerçek zamanlı durum güncellemeleri

### 3. `test_spotify_playlist_fix.js`
- Test fonksiyonu eklendi
- Browser console'da çalıştırılabilir

## Kullanım

### 1. Spotify Bağlantısını Kontrol Etme
```javascript
import { playlistService } from './src/api/playlistService';

const status = await playlistService.checkSpotifyConnection(userId);
if (status.connected) {
  console.log('Spotify bağlı');
} else {
  console.log('Spotify bağlı değil:', status.error);
}
```

### 2. Çalma Listelerini Senkronize Etme
```javascript
try {
  await playlistService.syncUserPlaylists(userId);
  console.log('Senkronizasyon başarılı');
} catch (error) {
  console.error('Senkronizasyon hatası:', error.message);
}
```

### 3. Component Kullanımı
```jsx
import SpotifyConnectionStatus from './src/components/SpotifyConnectionStatus';

// Sayfanızda kullanın:
<SpotifyConnectionStatus />
```

## Test Etme

1. Uygulamayı başlatın
2. Spotify ile giriş yapın
3. `SpotifyConnectionStatus` component'ini kullanın
4. Veya browser console'da `testSpotifyPlaylistSync()` fonksiyonunu çalıştırın

## Hata Durumları

### Spotify Bağlı Değil
- Kullanıcıya "Spotify'a Bağlan" butonu gösterilir
- Açıklayıcı hata mesajı verilir

### Token Süresi Dolmuş
- Otomatik token yenileme denemesi yapılır
- Başarısız olursa kullanıcıya bildirilir

### Senkronizasyon Hatası
- Detaylı hata mesajı gösterilir
- Kullanıcıya tekrar deneme seçeneği verilir

## Gelecek İyileştirmeler

1. Otomatik token yenileme
2. Batch senkronizasyon
3. Progress göstergesi
4. Offline senkronizasyon desteği
5. Çalma listesi değişikliklerini takip etme
