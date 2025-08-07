# 🎵 Spotify API Entegrasyonu Roadmap

## 📋 Genel Bakış

Bu dokümantasyon, Respect uygulamasının test verilerinden gerçek Spotify verilerine geçiş sürecini detaylandırır. Spotify API'sini kullanarak sanatçı ve şarkı verilerini çekip kendi veritabanımızda kullanacağız.

## 🎯 Hedefler

1. **Sanatçı Kayıt Sistemi**: Sanatçılar Spotify hesaplarıyla kayıt olabilecek
2. **Şarkı Verileri**: Spotify'dan gerçek şarkı bilgileri çekilecek
3. **Otomatik Senkronizasyon**: Sanatçıların yeni şarkıları otomatik olarak sisteme eklenecek
4. **Veri Tutarlılığı**: Spotify verileri ile kendi veritabanımız arasında tutarlılık sağlanacak

## 🏗️ Sistem Mimarisi

### 1. Spotify API Entegrasyonu
```
Frontend (React) → Backend (Supabase Functions) → Spotify API
                ↓
            Supabase Database
```

### 2. Veri Akışı
```
Spotify API → Supabase Functions → Database Tables
     ↓              ↓                ↓
Artist Data → Process & Validate → Store in DB
Song Data  → Process & Validate → Store in DB
```

## 📊 Veritabanı Şeması Güncellemeleri

### Mevcut Tablolar (Güncellenecek)
- `artists` - Spotify artist ID eklenecek
- `songs` - Spotify track ID eklenecek
- `albums` - Spotify album ID eklenecek

### Yeni Tablolar
```sql
-- Spotify entegrasyonu için yeni tablolar
CREATE TABLE spotify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_user_id TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE spotify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'artist', 'songs', 'albums'
  status TEXT NOT NULL, -- 'success', 'error', 'partial'
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Teknik Implementasyon

### 1. Spotify API Kurulumu

#### A. Spotify Developer Dashboard
1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)'a giriş yap
2. Yeni uygulama oluştur
3. Redirect URI'ları ayarla:
   - `http://localhost:5173/auth/spotify/callback` (Development)
   - `https://yourdomain.com/auth/spotify/callback` (Production)

#### B. Gerekli Paketler
```bash
# Spotify Web API için
npm install spotify-web-api-node

# OAuth işlemleri için
npm install @supabase/supabase-js

# Environment variables için
npm install dotenv
```

### 2. Environment Variables
```env
# .env.local
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/auth/spotify/callback

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Spotify Service Oluşturma

#### A. Spotify API Service (`src/api/spotifyService.js`)
```javascript
import SpotifyWebApi from 'spotify-web-api-node';

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
      redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI
    });
  }

  // OAuth URL oluştur
  getAuthUrl() {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative'
    ];
    
    return this.spotifyApi.createAuthorizeURL(scopes);
  }

  // Authorization code ile token al
  async getTokens(code) {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      return {
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in
      };
    } catch (error) {
      console.error('Spotify token error:', error);
      throw error;
    }
  }

  // Token yenile
  async refreshTokens(refreshToken) {
    try {
      this.spotifyApi.setRefreshToken(refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();
      return {
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in
      };
    } catch (error) {
      console.error('Spotify refresh error:', error);
      throw error;
    }
  }

  // Kullanıcı profilini getir
  async getUserProfile(accessToken) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMe();
      return data.body;
    } catch (error) {
      console.error('Spotify user profile error:', error);
      throw error;
    }
  }

  // Sanatçının şarkılarını getir
  async getArtistTracks(accessToken, artistId) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getArtistTopTracks(artistId, 'TR');
      return data.body.tracks;
    } catch (error) {
      console.error('Spotify artist tracks error:', error);
      throw error;
    }
  }

  // Sanatçının albümlerini getir
  async getArtistAlbums(accessToken, artistId) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getArtistAlbums(artistId, {
        include_groups: 'album,single',
        limit: 50
      });
      return data.body.items;
    } catch (error) {
      console.error('Spotify artist albums error:', error);
      throw error;
    }
  }

  // Şarkı arama
  async searchTracks(accessToken, query, limit = 20) {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.searchTracks(query, { limit });
      return data.body.tracks.items;
    } catch (error) {
      console.error('Spotify search error:', error);
      throw error;
    }
  }
}

export default new SpotifyService();
```

#### B. Spotify Auth Service (`src/api/spotifyAuthService.js`)
```javascript
import { supabase } from '../config/supabase';
import spotifyService from './spotifyService';

export const spotifyAuthService = {
  // Spotify ile giriş başlat
  initiateSpotifyLogin: () => {
    const authUrl = spotifyService.getAuthUrl();
    window.location.href = authUrl;
  },

  // Spotify callback'i işle
  handleSpotifyCallback: async (code) => {
    try {
      // Token'ları al
      const tokens = await spotifyService.getTokens(code);
      
      // Kullanıcı profilini getir
      const profile = await spotifyService.getUserProfile(tokens.accessToken);
      
      // Supabase'de kullanıcıyı bul veya oluştur
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // Yeni kullanıcı oluştur
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: profile.email,
          password: `spotify_${profile.id}_${Date.now()}`, // Geçici şifre
          options: {
            data: {
              display_name: profile.display_name,
              spotify_id: profile.id,
              avatar_url: profile.images?.[0]?.url
            }
          }
        });

        if (authError) throw authError;
        user = authData.user;
      }

      // Spotify bağlantısını kaydet
      const { error: connectionError } = await supabase
        .from('spotify_connections')
        .upsert({
          user_id: user.id,
          spotify_user_id: profile.id,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000)
        });

      if (connectionError) throw connectionError;

      return { user, profile, error: null };
    } catch (error) {
      console.error('Spotify callback error:', error);
      return { user: null, profile: null, error };
    }
  },

  // Spotify bağlantısını kontrol et
  checkSpotifyConnection: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('spotify_connections')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return { connected: false, data: null, error };

      // Token'ın geçerliliğini kontrol et
      if (new Date() > new Date(data.token_expires_at)) {
        // Token'ı yenile
        const newTokens = await spotifyService.refreshTokens(data.refresh_token);
        
        await supabase
          .from('spotify_connections')
          .update({
            access_token: newTokens.accessToken,
            token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000)
          })
          .eq('user_id', userId);

        data.access_token = newTokens.accessToken;
      }

      return { connected: true, data, error: null };
    } catch (error) {
      console.error('Spotify connection check error:', error);
      return { connected: false, data: null, error };
    }
  }
};
```

### 4. Supabase Functions (Backend)

#### A. Spotify Sync Function (`supabase/functions/spotify-sync/index.ts`)
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import SpotifyWebApi from 'https://esm.sh/spotify-web-api-node@5.0.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { userId, syncType } = await req.json()

    // Kullanıcının Spotify bağlantısını kontrol et
    const { data: connection, error: connectionError } = await supabaseClient
      .from('spotify_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      throw new Error('Spotify connection not found')
    }

    // Spotify API'yi başlat
    const spotifyApi = new SpotifyWebApi({
      accessToken: connection.access_token
    })

    let syncResult

    switch (syncType) {
      case 'artist_profile':
        syncResult = await syncArtistProfile(supabaseClient, spotifyApi, userId)
        break
      case 'artist_songs':
        syncResult = await syncArtistSongs(supabaseClient, spotifyApi, userId)
        break
      case 'artist_albums':
        syncResult = await syncArtistAlbums(supabaseClient, spotifyApi, userId)
        break
      default:
        throw new Error('Invalid sync type')
    }

    // Sync log kaydet
    await supabaseClient
      .from('spotify_sync_logs')
      .insert({
        user_id: userId,
        sync_type: syncType,
        status: syncResult.success ? 'success' : 'error',
        items_processed: syncResult.processed,
        items_failed: syncResult.failed,
        error_message: syncResult.error
      })

    return new Response(
      JSON.stringify(syncResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function syncArtistProfile(supabase, spotifyApi, userId) {
  try {
    const profile = await spotifyApi.getMe()
    
    // Artist tablosunu güncelle
    const { error } = await supabase
      .from('artists')
      .upsert({
        user_id: userId,
        name: profile.body.display_name,
        avatar_url: profile.body.images?.[0]?.url,
        spotify_id: profile.body.id,
        bio: `Spotify Artist: ${profile.body.display_name}`,
        verified: true
      })

    if (error) throw error

    return { success: true, processed: 1, failed: 0 }
  } catch (error) {
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}

async function syncArtistSongs(supabase, spotifyApi, userId) {
  try {
    const profile = await spotifyApi.getMe()
    const tracks = await spotifyApi.getArtistTopTracks(profile.body.id, 'TR')
    
    let processed = 0
    let failed = 0

    for (const track of tracks.body.tracks) {
      try {
        // Şarkıyı veritabanına ekle
        const { error } = await supabase
          .from('songs')
          .upsert({
            title: track.name,
            album: track.album.name,
            duration: track.duration_ms,
            cover_url: track.album.images?.[0]?.url,
            spotify_id: track.id,
            artist_id: userId,
            total_respect: 0,
            favorites_count: 0
          })

        if (error) {
          failed++
        } else {
          processed++
        }
      } catch (error) {
        failed++
      }
    }

    return { success: true, processed, failed }
  } catch (error) {
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}

async function syncArtistAlbums(supabase, spotifyApi, userId) {
  try {
    const profile = await spotifyApi.getMe()
    const albums = await spotifyApi.getArtistAlbums(profile.body.id, {
      include_groups: 'album,single',
      limit: 50
    })
    
    let processed = 0
    let failed = 0

    for (const album of albums.body.items) {
      try {
        // Albümü veritabanına ekle
        const { error } = await supabase
          .from('albums')
          .upsert({
            title: album.name,
            cover_url: album.images?.[0]?.url,
            spotify_id: album.id,
            artist_id: userId,
            release_date: album.release_date,
            total_tracks: album.total_tracks
          })

        if (error) {
          failed++
        } else {
          processed++
        }
      } catch (error) {
        failed++
      }
    }

    return { success: true, processed, failed }
  } catch (error) {
    return { success: false, processed: 0, failed: 1, error: error.message }
  }
}
```

### 5. Frontend Implementasyonu

#### A. Spotify Login Component (`src/components/auth/SpotifyLogin.jsx`)
```jsx
import React from 'react';
import { spotifyAuthService } from '../../api/spotifyAuthService';

const SpotifyLogin = () => {
  const handleSpotifyLogin = () => {
    spotifyAuthService.initiateSpotifyLogin();
  };

  return (
    <div className="spotify-login-container">
      <button 
        onClick={handleSpotifyLogin}
        className="spotify-login-btn"
      >
        <img src="/spotify-icon.svg" alt="Spotify" />
        Spotify ile Sanatçı Olarak Kayıt Ol
      </button>
    </div>
  );
};

export default SpotifyLogin;
```

#### B. Spotify Callback Handler (`src/components/auth/SpotifyCallback.jsx`)
```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spotifyAuthService } from '../../api/spotifyAuthService';

const SpotifyCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('Authorization code not found');
        }

        const result = await spotifyAuthService.handleSpotifyCallback(code);
        
        if (result.error) {
          throw result.error;
        }

        // Başarılı giriş sonrası yönlendirme
        navigate('/artist/dashboard');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Spotify hesabınız bağlanıyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Bağlantı Hatası</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>
          Tekrar Dene
        </button>
      </div>
    );
  }

  return null;
};

export default SpotifyCallback;
```

#### C. Artist Dashboard Component (`src/components/artist/ArtistDashboard.jsx`)
```jsx
import React, { useState, useEffect } from 'react';
import { spotifyAuthService } from '../../api/spotifyAuthService';
import { supabase } from '../../config/supabase';

const ArtistDashboard = () => {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { connected } = await spotifyAuthService.checkSpotifyConnection(user.id);
      setSpotifyConnected(connected);
    }
  };

  const syncSpotifyData = async (syncType) => {
    setSyncLoading(true);
    setSyncStatus(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('spotify-sync', {
        body: { userId: user.id, syncType }
      });

      if (error) throw error;

      setSyncStatus({
        success: data.success,
        message: `Senkronizasyon tamamlandı. ${data.processed} öğe işlendi, ${data.failed} başarısız.`
      });
    } catch (error) {
      setSyncStatus({
        success: false,
        message: `Hata: ${error.message}`
      });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="artist-dashboard">
      <h1>Sanatçı Paneli</h1>
      
      {!spotifyConnected ? (
        <div className="spotify-connection-prompt">
          <h2>Spotify Bağlantısı Gerekli</h2>
          <p>Şarkılarınızı senkronize etmek için Spotify hesabınızı bağlayın.</p>
          <button onClick={() => spotifyAuthService.initiateSpotifyLogin()}>
            Spotify'a Bağlan
          </button>
        </div>
      ) : (
        <div className="spotify-sync-panel">
          <h2>Spotify Verilerini Senkronize Et</h2>
          
          <div className="sync-buttons">
            <button 
              onClick={() => syncSpotifyData('artist_profile')}
              disabled={syncLoading}
            >
              {syncLoading ? 'Senkronize Ediliyor...' : 'Profil Bilgilerini Senkronize Et'}
            </button>
            
            <button 
              onClick={() => syncSpotifyData('artist_songs')}
              disabled={syncLoading}
            >
              {syncLoading ? 'Senkronize Ediliyor...' : 'Şarkıları Senkronize Et'}
            </button>
            
            <button 
              onClick={() => syncSpotifyData('artist_albums')}
              disabled={syncLoading}
            >
              {syncLoading ? 'Senkronize Ediliyor...' : 'Albümleri Senkronize Et'}
            </button>
          </div>

          {syncStatus && (
            <div className={`sync-status ${syncStatus.success ? 'success' : 'error'}`}>
              {syncStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;
```

## 🚀 Implementasyon Adımları

### Faz 1: Temel Kurulum (1-2 hafta)
1. **Spotify Developer Dashboard** kurulumu
2. **Environment variables** ayarlama
3. **Spotify Service** oluşturma
4. **OAuth flow** implementasyonu
5. **Veritabanı şeması** güncelleme

### Faz 2: Auth Sistemi (1 hafta)
1. **Spotify Login** component'i
2. **Callback handler** implementasyonu
3. **Token management** sistemi
4. **User profile** senkronizasyonu

### Faz 3: Veri Senkronizasyonu (2-3 hafta)
1. **Supabase Functions** oluşturma
2. **Artist data sync** implementasyonu
3. **Song data sync** implementasyonu
4. **Album data sync** implementasyonu
5. **Error handling** ve retry mekanizmaları

### Faz 4: UI/UX Geliştirmeleri (1-2 hafta)
1. **Artist Dashboard** tasarımı
2. **Sync progress** göstergeleri
3. **Data validation** ve feedback
4. **Mobile responsive** tasarım

### Faz 5: Test ve Optimizasyon (1 hafta)
1. **Unit tests** yazma
2. **Integration tests** yazma
3. **Performance optimization**
4. **Error monitoring** kurulumu

## 🔒 Güvenlik Önlemleri

### 1. Token Güvenliği
- Access token'ları güvenli şekilde saklama
- Refresh token rotation
- Token expiration handling

### 2. Rate Limiting
- Spotify API rate limit'lerini aşmama
- Exponential backoff implementasyonu
- Request queuing sistemi

### 3. Data Validation
- Spotify'dan gelen verileri doğrulama
- SQL injection koruması
- XSS koruması

## 📈 Monitoring ve Analytics

### 1. Sync Monitoring
- Sync başarı oranları
- Hata logları
- Performance metrics

### 2. User Analytics
- Spotify bağlantı oranları
- Sync kullanım istatistikleri
- User engagement metrics

## 🐛 Hata Yönetimi

### 1. Common Errors
- Token expiration
- Network timeouts
- Rate limiting
- Invalid data formats

### 2. Error Handling Strategy
- Graceful degradation
- User-friendly error messages
- Automatic retry mechanisms
- Fallback to cached data

## 🔄 Otomatik Senkronizasyon

### 1. Scheduled Sync
- Günlük otomatik sync
- Yeni şarkı tespiti
- Album güncellemeleri

### 2. Webhook Integration
- Spotify webhook desteği (gelecekte)
- Real-time updates
- Push notifications

## 📱 Mobile Uygulama Entegrasyonu

### 1. React Native
- Spotify SDK entegrasyonu
- Native OAuth flow
- Offline sync capabilities

### 2. PWA Support
- Service worker implementation
- Offline data caching
- Background sync

## 🎯 Sonraki Adımlar

1. **Apple Music** entegrasyonu
2. **YouTube Music** entegrasyonu
3. **Deezer** entegrasyonu
4. **Cross-platform** sync
5. **Advanced analytics** ve insights

---

Bu roadmap, Spotify API entegrasyonunun tüm aşamalarını kapsamlı bir şekilde detaylandırır. Her faz, önceki fazın tamamlanmasına bağlıdır ve sistemin güvenli, ölçeklenebilir ve kullanıcı dostu olmasını sağlar. 