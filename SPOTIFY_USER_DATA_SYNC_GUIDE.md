# 🎵 Spotify User Data Sync Guide

## 📋 Genel Bakış

Bu dokümantasyon, kullanıcıların Spotify çalma listelerindeki sanatçı ve şarkı verilerini Respect uygulamasının ana veritabanına senkronize eden yeni özelliği açıklar. Bu özellik sayesinde mock veriler yerine kullanıcıların gerçek Spotify playlist verileri kullanılır.

## 🎯 Hedefler

1. **Gerçek Veri Kullanımı**: Mock sanatçı ve şarkı verilerini kullanıcıların Spotify playlist verileriyle değiştirmek
2. **Kişiselleştirilmiş Deneyim**: Her kullanıcı için özel olarak playlist verilerine göre sanatçı ve şarkı sayfalarını doldurmak
3. **Otomatik Senkronizasyon**: Kullanıcıların playlist verilerini kolayca sisteme aktarabilmesi
4. **Veri Tutarlılığı**: Spotify verileri ile kendi veritabanımız arasında tutarlılık sağlamak

## 🏗️ Sistem Mimarisi

### 1. Veri Akışı
```
Spotify API → Supabase Edge Function → Database Tables
     ↓              ↓                    ↓
Playlist Data → Process & Validate → Artists/Songs Tables
```

### 2. Bileşenler
- **Frontend**: ArtistsPage ve SongsPage bileşenleri
- **Backend**: `spotify-sync-user-data` Supabase Edge Function
- **Database**: `artists` ve `songs` tabloları
- **Service**: `spotifyUserDataService.js`

## 📊 Veritabanı Şeması

### Mevcut Tablolar (Güncellenmiş)
```sql
-- Artists tablosu (spotify_id kolonu eklendi)
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  total_respect BIGINT DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  spotify_id TEXT UNIQUE, -- YENİ: Spotify artist ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Songs tablosu (spotify_id kolonu eklendi)
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  album TEXT,
  duration INTEGER,
  cover_url TEXT,
  spotify_id TEXT UNIQUE, -- YENİ: Spotify track ID
  total_respect BIGINT DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Teknik Uygulama

### 1. Supabase Edge Function: `spotify-sync-user-data`

**Dosya**: `supabase/functions/spotify-sync-user-data/index.ts`

**Fonksiyonlar**:
- `syncUserData()`: Kullanıcının playlist verilerini işler
- Rate limiting ile Spotify API çağrılarını yönetir
- Benzersiz sanatçı ve şarkıları toplar
- Veritabanına ekler/günceller

**İşlem Adımları**:
1. Kullanıcının Spotify bağlantısını kontrol eder
2. Tüm playlistlerini çeker
3. Her playlist'teki şarkıları işler
4. Benzersiz sanatçıları toplar
5. Benzersiz şarkıları toplar
6. Sanatçıları veritabanına ekler
7. Şarkıları veritabanına ekler

### 2. Frontend Service: `spotifyUserDataService.js`

**Dosya**: `src/api/spotifyUserDataService.js`

**Fonksiyonlar**:
- `syncUserSpotifyData(userId)`: Ana senkronizasyon fonksiyonu
- `checkSpotifyConnection(userId)`: Spotify bağlantısını kontrol eder
- `getSyncStatus(userId)`: Senkronizasyon durumunu kontrol eder

### 3. UI Bileşenleri

**ArtistsPage.jsx**:
- Spotify senkronizasyon butonu
- Senkronizasyon durumu gösterimi
- Gerçek verilerle sanatçı listesi

**SongsPage.jsx**:
- Spotify senkronizasyon butonu
- Senkronizasyon durumu gösterimi
- Gerçek verilerle şarkı listesi

## 🎨 Kullanıcı Arayüzü

### Spotify Sync Section
```jsx
{user && hasSpotifyConnection && (
  <div className="spotify-sync-section">
    {!syncStatus?.hasSyncHistory || !syncStatus?.isRecent ? (
      <div className="sync-prompt">
        <p>🎵 Spotify çalma listelerinizden sanatçıları senkronize edin</p>
        <button 
          className="sync-button"
          onClick={handleSyncSpotifyData}
          disabled={syncing}
        >
          {syncing ? 'Senkronize ediliyor...' : 'Spotify Verilerini Senkronize Et'}
        </button>
      </div>
    ) : (
      <div className="sync-status">
        <p>✅ Spotify verileriniz güncel</p>
        <small>Son senkronizasyon: {lastSyncTime}</small>
      </div>
    )}
  </div>
)}
```

### CSS Stilleri
```css
.spotify-sync-section {
  margin: 20px 0;
  padding: 16px;
  background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(29, 185, 84, 0.2);
}
```

## 🚀 Kullanım Adımları

### Kullanıcı İçin:
1. **Spotify Bağlantısı**: Spotify hesabını bağla
2. **Sayfa Ziyareti**: Artists veya Songs sayfasına git
3. **Senkronizasyon**: "Spotify Verilerini Senkronize Et" butonuna tıkla
4. **Bekleme**: Senkronizasyon tamamlanana kadar bekle
5. **Görüntüleme**: Gerçek playlist verilerini gör

### Geliştirici İçin:
1. **Fonksiyon Deploy**: `npx supabase functions deploy spotify-sync-user-data`
2. **Frontend Güncelleme**: ArtistsPage ve SongsPage bileşenlerini güncelle
3. **Service Ekleme**: `spotifyUserDataService.js` dosyasını ekle
4. **CSS Ekleme**: Spotify sync stillerini ekle

## 📈 Veri İşleme

### Sanatçı Verileri
```javascript
const artistData = {
  name: spotifyArtist.name,
  bio: spotifyArtist.bio || '',
  avatar_url: spotifyArtist.images?.[0]?.url,
  cover_url: spotifyArtist.images?.[1]?.url,
  spotify_id: spotifyArtist.id,
  total_respect: 0,
  followers_count: spotifyArtist.followers?.total || 0
}
```

### Şarkı Verileri
```javascript
const songData = {
  title: track.name,
  artist_id: artist.id, // Veritabanındaki artist ID
  album: track.album?.name,
  duration: track.duration_ms,
  cover_url: track.album?.images?.[0]?.url,
  spotify_id: track.id,
  total_respect: 0,
  favorites_count: 0
}
```

## 🔍 Hata Yönetimi

### Yaygın Hatalar:
1. **Spotify Bağlantısı Yok**: Kullanıcının Spotify hesabı bağlı değil
2. **Token Süresi Dolmuş**: Spotify access token'ı yenilenmeli
3. **Rate Limiting**: Spotify API limitleri aşıldı
4. **Veritabanı Hatası**: Veritabanı işlemleri başarısız

### Hata Mesajları:
- "Spotify connection not found"
- "Authentication failed"
- "Rate limit exceeded"
- "Failed to sync Spotify data"

## 📊 Performans Optimizasyonu

### Rate Limiting:
- Spotify API çağrıları arasında 1 saniye bekleme
- Benzersiz sanatçı/şarkı toplama
- Batch işlemler

### Veritabanı Optimizasyonu:
- `spotify_id` üzerinde unique index
- Mevcut kayıtları kontrol etme
- Sadece yeni kayıtları ekleme

## 🧪 Test Etme

### Test Senaryoları:
1. **Spotify Bağlantısı Yok**: Mock veriler gösterilmeli
2. **İlk Senkronizasyon**: Yeni veriler eklenmeli
3. **Tekrar Senkronizasyon**: Mevcut veriler güncellenmeli
4. **Hata Durumları**: Uygun hata mesajları gösterilmeli

### Test Komutu:
```bash
node test_spotify_user_data_sync.js
```

## 🔄 Gelecek Geliştirmeler

### Planlanan Özellikler:
1. **Otomatik Senkronizasyon**: Belirli aralıklarla otomatik sync
2. **Seçici Senkronizasyon**: Belirli playlistleri seçme
3. **Senkronizasyon Geçmişi**: Detaylı sync logları
4. **Veri Güncelleme**: Mevcut verileri güncelleme
5. **Çoklu Platform**: Apple Music, YouTube Music desteği

## 📝 Notlar

### Önemli Noktalar:
- Kullanıcılar önce Spotify hesaplarını bağlamalı
- Senkronizasyon işlemi zaman alabilir
- Rate limiting nedeniyle büyük playlistler için daha uzun sürebilir
- Veriler kullanıcıya özeldir ve güvenlidir

### Güvenlik:
- Spotify token'ları güvenli şekilde saklanır
- Kullanıcı sadece kendi verilerini senkronize edebilir
- RLS (Row Level Security) politikaları aktif

---

Bu dokümantasyon, Spotify user data sync özelliğinin tam implementasyonunu açıklar. Herhangi bir sorunuz varsa, lütfen geliştirme ekibiyle iletişime geçin.
