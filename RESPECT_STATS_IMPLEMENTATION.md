# Real-time Respect Statistics Implementation

Bu dokümantasyon, kullanıcı sayfasındaki respect istatistiklerinin real-time olarak güncellenmesi için oluşturulan sistemin detaylarını içerir.

## 🎯 Amaç

- Kullanıcıların respect bakiyesi, gönderilen respect ve alınan respect verilerini real-time olarak göstermek
- Respect gönderildiğinde veritabanında ve kullanıcı arayüzünde anında güncelleme yapmak
- Supabase real-time subscriptions kullanarak performanslı bir sistem oluşturmak

## 📊 Veritabanı Yapısı

### Profiles Tablosu
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_respect_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_respect_received integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS respect_balance integer DEFAULT 1000;
```

### Respect Transactions Tablosu
```sql
CREATE TABLE public.respect_transactions (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references auth.users(id) on delete cascade,
  to_artist_id uuid references artists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  amount integer not null check (amount > 0),
  message text,
  transaction_type text check (transaction_type in ('artist', 'song')),
  is_anonymous boolean default false,
  created_at timestamp default now()
);
```

## 🔧 Uygulanan Dosyalar

### 1. Database Migrations
- `supabase/migrations/017_enhance_respect_stats_realtime.sql` - Real-time istatistikler için gerekli kolonlar ve view'lar
- `supabase/migrations/018_add_respect_stats_summary_function.sql` - İstatistik özeti için fonksiyon

### 2. API Services
- `src/api/respectStatsService.js` - Respect istatistikleri için API servisi
- `src/api/respectService.js` - Mevcut respect servisi (güncellendi)

### 3. React Hooks
- `src/hooks/useRespectStats.js` - Real-time respect istatistikleri için custom hook

### 4. Components
- `src/components/UserStats.jsx` - Güncellenmiş kullanıcı istatistikleri komponenti
- `src/components/RespectStatsDemo.jsx` - Test ve demo komponenti

### 5. Styles
- `src/index.css` - Yeni stat kartları için CSS stilleri

## 🚀 Kullanım

### UserStats Komponenti
```jsx
import UserStats from './components/UserStats'

// Kullanım
<UserStats userId={userId} userData={fallbackData} />
```

### useRespectStats Hook
```jsx
import { useRespectStats } from './hooks/useRespectStats'

const { 
  stats, 
  isLoading, 
  error, 
  respectBalance, 
  totalRespectSent, 
  totalRespectReceived,
  totalRespectActivity,
  refreshStats 
} = useRespectStats(userId)
```

## 🔄 Real-time Güncelleme Sistemi

### 1. Supabase Subscription
```javascript
const subscription = supabase
  .channel(`respect-stats-${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`
    },
    (payload) => {
      // Real-time güncelleme işlemi
      callback(payload.new)
    }
  )
  .subscribe()
```

### 2. Database Function
```sql
CREATE OR REPLACE FUNCTION process_respect_transaction(
  p_from_user_id uuid,
  p_to_artist_id uuid,
  p_song_id uuid,
  p_amount integer,
  p_message text,
  p_transaction_type text
) RETURNS void AS $$
BEGIN
  -- Kullanıcıdan respect düş
  UPDATE profiles 
  SET 
    respect_balance = respect_balance - p_amount,
    total_respect_sent = total_respect_sent + p_amount
  WHERE id = p_from_user_id;
  
  -- Transaction kaydı oluştur
  INSERT INTO respect_transactions (...)
  VALUES (...);
END;
$$ LANGUAGE plpgsql;
```

## 📈 İstatistik Türleri

1. **Respect Bakiyesi** - Kullanıcının mevcut respect miktarı
2. **Gönderilen Respect** - Kullanıcının toplam gönderdiği respect miktarı
3. **Alınan Respect** - Kullanıcının aldığı respect miktarı (gelecekte implement edilecek)
4. **Toplam Aktivite** - Gönderilen + Alınan respect toplamı

## 🧪 Test Etme

### RespectStatsDemo Komponenti
Demo komponenti ile şu işlemleri test edebilirsiniz:
- Respect bakiyesi ekleme
- Manuel bakiye güncelleme
- Test respect gönderimi
- İstatistikleri yenileme

### Kullanım
```jsx
import RespectStatsDemo from './components/RespectStatsDemo'

// Test sayfasına ekleyin
<RespectStatsDemo />
```

## 🔧 Kurulum Adımları

1. **Database Migration'ları Çalıştırın:**
```bash
supabase db push
```

2. **Real-time Subscription'ları Etkinleştirin:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

3. **Komponentleri Güncelleyin:**
- UserPage.jsx'te UserStats komponentini kullanın
- Gerekli import'ları ekleyin

## 🎨 CSS Sınıfları

### Stat Cards
- `.user-stats` - Ana container
- `.stat-card` - İstatistik kartı
- `.stat-label` - Etiket
- `.stat-value` - Değer
- `.stat-icon` - İkon

### Responsive Design
- Mobile: 2x2 grid
- Desktop: 4x1 grid
- Hover efektleri
- Loading states

## 🔍 Debug ve Monitoring

### Console Logları
- `📊 Getting respect stats for user:` - İstatistik çekme
- `🔔 Subscribing to respect stats for user:` - Subscription kurma
- `📊 Real-time respect stats update:` - Real-time güncelleme

### Error Handling
- Network hataları
- Database hataları
- Subscription hataları
- Fallback değerler

## 🚀 Performans Optimizasyonları

1. **React Query Caching** - 5 dakika stale time
2. **Selective Updates** - Sadece değişen alanları güncelle
3. **Debounced Updates** - Çok sık güncellemeleri önle
4. **Indexes** - Database performansı için indexler

## 🔮 Gelecek Geliştirmeler

1. **Alınan Respect Tracking** - Sanatçılar için respect alma sistemi
2. **Respect History** - Detaylı geçmiş görüntüleme
3. **Analytics Dashboard** - Gelişmiş analitik
4. **Notifications** - Real-time bildirimler
5. **Leaderboards** - En çok respect gönderenler listesi

## 📝 Notlar

- Tüm respect işlemleri `process_respect_transaction` fonksiyonu üzerinden yapılır
- Real-time güncellemeler otomatik olarak tüm bağlı client'larda görünür
- Error durumlarında fallback değerler kullanılır
- Subscription'lar component unmount olduğunda otomatik temizlenir 