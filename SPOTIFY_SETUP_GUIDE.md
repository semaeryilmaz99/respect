# 🎵 Spotify API Entegrasyonu Kurulum Rehberi

Bu rehber, Respect uygulamasına Spotify API entegrasyonunu nasıl kuracağınızı adım adım açıklar.

## 📋 Ön Gereksinimler

- Node.js 16+ yüklü
- Supabase hesabı
- Spotify Developer hesabı

## 🚀 Kurulum Adımları

### 1. Spotify Developer Dashboard Kurulumu

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)'a gidin
2. Spotify hesabınızla giriş yapın
3. "Create App" butonuna tıklayın
4. Uygulama bilgilerini doldurun:
   - **App name**: `Respect App`
   - **App description**: `Music respect platform with Spotify integration`
   - **Website**: `http://localhost:5173` (development)
   - **Redirect URI**: `http://localhost:5173/auth/spotify/callback`
5. "Save" butonuna tıklayın

### 2. Spotify API Bilgilerini Alma

1. Oluşturduğunuz uygulamaya tıklayın
2. **Client ID** ve **Client Secret** değerlerini kopyalayın
3. Bu bilgileri güvenli bir yerde saklayın

### 3. Environment Variables Ayarlama

Proje kök dizininde `.env.local` dosyası oluşturun:

```env
# Spotify API Configuration
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/spotify/callback

# Supabase Configuration (zaten mevcut)
VITE_SUPABASE_URL=https://ghbsezyszcrzqezoanav.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnNlenlzemNyenFlem9hbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzk2MDMsImV4cCI6MjA2OTM1NTYwM30.sH27celBpFC48xPV5S3oDfY4yvJs59QNd_3qQKHp3Oc

# Development Settings
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

### 4. Veritabanı Şeması Güncelleme

Supabase Dashboard'da SQL Editor'ü açın ve aşağıdaki migration'ı çalıştırın:

```sql
-- Spotify Integration Database Schema Updates
-- Run this migration to add Spotify support to your database

-- 1. Add Spotify ID columns to existing tables
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;

-- 2. Create Spotify connections table
CREATE TABLE IF NOT EXISTS spotify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_user_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Spotify sync logs table
CREATE TABLE IF NOT EXISTS spotify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spotify_connections_user_id ON spotify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_connections_spotify_user_id ON spotify_connections(spotify_user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_user_id ON spotify_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_sync_logs_created_at ON spotify_sync_logs(created_at);

-- 5. Enable RLS and create policies
ALTER TABLE spotify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for spotify_connections
CREATE POLICY "Users can view their own spotify connections" ON spotify_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spotify connections" ON spotify_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spotify connections" ON spotify_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spotify connections" ON spotify_connections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for spotify_sync_logs
CREATE POLICY "Users can view their own sync logs" ON spotify_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" ON spotify_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. Supabase Functions Deployment

1. Supabase CLI'yi yükleyin (eğer yüklü değilse):
```bash
npm install -g supabase
```

2. Supabase projenize bağlanın:
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Spotify sync function'ını deploy edin:
```bash
supabase functions deploy spotify-sync
```

### 6. Uygulamayı Başlatma

1. Gerekli paketleri yükleyin:
```bash
npm install
```

2. Development server'ı başlatın:
```bash
npm run dev
```

3. Tarayıcıda `http://localhost:5173` adresine gidin

## 🧪 Test Etme

### 1. Spotify Login Testi

1. Uygulamada "Spotify ile Sanatçı Olarak Kayıt Ol" butonuna tıklayın
2. Spotify'da giriş yapın ve izinleri onaylayın
3. Callback sayfasında başarılı bir şekilde yönlendirildiğinizi kontrol edin

### 2. Veri Senkronizasyonu Testi

1. Sanatçı paneline gidin
2. "Profil Bilgilerini Senkronize Et" butonuna tıklayın
3. Başarılı bir şekilde senkronize edildiğini kontrol edin
4. Şarkı ve albüm senkronizasyonunu da test edin

## 🔧 Sorun Giderme

### Yaygın Hatalar ve Çözümleri

#### 1. "Invalid redirect URI" Hatası
- Spotify Dashboard'da redirect URI'nın doğru olduğundan emin olun
- URI'nın tam olarak `http://localhost:5173/auth/spotify/callback` olduğunu kontrol edin

#### 2. "Missing required parameters" Hatası
- Environment variables'ların doğru ayarlandığından emin olun
- `.env.local` dosyasının proje kök dizininde olduğunu kontrol edin

#### 3. "Spotify connection not found" Hatası
- Kullanıcının Spotify ile giriş yaptığından emin olun
- Veritabanında `spotify_connections` tablosunun oluşturulduğunu kontrol edin

#### 4. "Function not found" Hatası
- Supabase Function'ın deploy edildiğinden emin olun
- Function adının `spotify-sync` olduğunu kontrol edin

### Debug İpuçları

1. **Browser Console**: Tarayıcı geliştirici araçlarında console'u kontrol edin
2. **Network Tab**: Network isteklerini ve yanıtlarını inceleyin
3. **Supabase Logs**: Supabase Dashboard'da Function loglarını kontrol edin
4. **Spotify API**: Spotify Developer Dashboard'da API kullanımını kontrol edin

## 📱 Production Deployment

### 1. Environment Variables Güncelleme

Production için environment variables'ları güncelleyin:

```env
VITE_SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/spotify/callback
VITE_APP_URL=https://yourdomain.com
```

### 2. Spotify Dashboard Güncelleme

1. Spotify Developer Dashboard'da redirect URI'ları güncelleyin
2. Production domain'inizi ekleyin: `https://yourdomain.com/auth/spotify/callback`

### 3. Supabase Functions Deployment

Production environment'ında function'ı tekrar deploy edin:

```bash
supabase functions deploy spotify-sync --project-ref your-production-project-ref
```

## 🔒 Güvenlik Notları

1. **Client Secret**: Client secret'ı asla frontend kodunda kullanmayın
2. **Token Storage**: Access token'ları güvenli bir şekilde saklayın
3. **Rate Limiting**: Spotify API rate limit'lerini aşmamaya dikkat edin
4. **Error Handling**: Hata durumlarını uygun şekilde handle edin

## 📚 Ek Kaynaklar

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [Supabase Functions Documentation](https://supabase.com/docs/guides/functions)
- [OAuth 2.0 Flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/)

## 🆘 Destek

Eğer sorun yaşıyorsanız:

1. Bu rehberi tekrar gözden geçirin
2. Console hatalarını kontrol edin
3. Network isteklerini inceleyin
4. Supabase ve Spotify loglarını kontrol edin

---

Bu rehber ile Spotify API entegrasyonunu başarıyla kurabilirsiniz. Herhangi bir sorun yaşarsanız, yukarıdaki sorun giderme bölümünü kontrol edin. 