# 🎯 RESPECT GÖNDERME SİSTEMİ DOKÜMANTASYONU

## 📋 Sistem Genel Bakış

Bu dokümantasyon, Respect uygulamasında sanatçı ve şarkılara respect gönderme sisteminin nasıl çalıştığını açıklar. Sistem şu anda **dummy satın alma** modunda çalışmaktadır.

## 🏗️ Sistem Mimarisi

### **1. Ana Bileşenler**

#### **Frontend Bileşenleri:**
- `PurchasePage.jsx` - Respect satın alma sayfası
- `SendRespectPage.jsx` - Respect gönderme sayfası
- `ArtistProfile.jsx` - Sanatçı profil sayfası (respect butonu)
- `SongPage.jsx` - Şarkı sayfası (respect butonları)

#### **Backend Servisleri:**
- `respectService.js` - Respect işlemleri API servisi
- `process_respect_transaction` - Veritabanı fonksiyonu

### **2. Veritabanı Tabloları**
- `profiles` - Kullanıcı respect balance'ı
- `artists` - Sanatçı bilgileri ve toplam respect
- `songs` - Şarkı bilgileri ve toplam respect
- `respect_transactions` - Respect işlem geçmişi
- `feed_items` - Feed gönderileri

## 🚀 Kullanım Akışı

### **Adım 1: Respect Satın Alma**
1. Kullanıcı herhangi bir sayfadan "Respect Satın Al" butonuna tıklar
2. `/purchase` sayfasına yönlendirilir
3. Respect paketlerinden birini seçer:
   - 100 Respect = ₺10
   - 250 Respect = ₺20 (+25 Bonus)
   - 500 Respect = ₺35 (+75 Bonus) ⭐ En Popüler
   - 1000 Respect = ₺60 (+200 Bonus)
   - 2000 Respect = ₺100 (+500 Bonus)
4. "Satın Al" butonuna tıklar
5. Dummy ödeme simülasyonu (2 saniye bekleme)
6. Balance güncellenir ve başarı mesajı gösterilir

### **Adım 2: Respect Gönderme**
1. Kullanıcı sanatçı veya şarkı sayfasına gider
2. "Respect Gönder" butonuna tıklar
3. `/send-respect` sayfasına yönlendirilir
4. Mevcut balance görüntülenir
5. Respect miktarı seçilir (20, 50, 100, 200, 500, 1000)
6. Balance yetersizse "Yetersiz" göstergesi görünür
7. "Gönder ve Destekle" butonuna tıklar
8. Balance kontrolü yapılır
9. Respect gönderilir ve balance güncellenir

## 💰 Respect Paketleri

| Paket | Respect | Bonus | Toplam | Fiyat |
|-------|---------|-------|--------|-------|
| Başlangıç | 100 | 0 | 100 | ₺10 |
| Standart | 250 | 25 | 275 | ₺20 |
| **Popüler** | **500** | **75** | **575** | **₺35** |
| Premium | 1000 | 200 | 1200 | ₺60 |
| VIP | 2000 | 500 | 2500 | ₺100 |

## 🔧 Teknik Detaylar

### **API Endpoints**

#### **1. Respect Balance Alma**
```javascript
const { data, error } = await respectService.getRespectBalance()
// Returns: { respect_balance, total_respect_sent, total_respect_received }
```

#### **2. Respect Gönderme (Sanatçı)**
```javascript
const { data, error } = await respectService.sendRespectToArtist(artistId, amount, message)
```

#### **3. Respect Gönderme (Şarkı)**
```javascript
const { data, error } = await respectService.sendRespectToSong(songId, amount, message)
```

#### **4. Balance Güncelleme**
```javascript
const { data, error } = await respectService.addRespectToBalance(amount)
```

### **Veritabanı Fonksiyonu**
```sql
process_respect_transaction(
  p_from_user_id uuid,
  p_to_artist_id uuid,
  p_song_id uuid,
  p_amount integer,
  p_message text,
  p_transaction_type text
)
```

Bu fonksiyon şunları yapar:
1. Kullanıcı balance kontrolü
2. Kullanıcıdan respect düşme
3. Sanatçıya respect ekleme
4. Şarkıya respect ekleme (varsa)
5. Transaction kaydı oluşturma
6. Feed item oluşturma

## 🎨 UI/UX Özellikleri

### **PurchasePage Özellikleri:**
- Responsive tasarım
- Paket seçimi animasyonları
- Loading durumları
- Hata mesajları
- Bonus göstergeleri
- Popüler paket vurgusu

### **SendRespectPage Özellikleri:**
- Balance görüntüleme
- Yetersiz balance göstergesi
- Miktar seçimi
- Özel miktar girişi
- Satın alma yönlendirmesi
- Artist/Song ayrımı

## 🧪 Test Senaryoları

### **Test 1: Yeni Kullanıcı Akışı**
1. Yeni kullanıcı kayıt olur
2. Balance'ı 0 olarak başlar
3. Respect göndermeye çalışır
4. "Yetersiz balance" mesajı görür
5. Satın alma sayfasına yönlendirilir
6. Paket satın alır
7. Respect gönderebilir

### **Test 2: Sanatçıya Respect Gönderme**
1. Sanatçı sayfasına gider
2. "Respect Gönder" butonuna tıklar
3. SendRespectPage açılır
4. Miktar seçer
5. "Gönder ve Destekle" butonuna tıklar
6. Respect gönderilir
7. Sanatçı sayfasına geri döner

### **Test 3: Şarkıya Respect Gönderme**
1. Şarkı sayfasına gider
2. "Respect Gönder" butonuna tıklar
3. SendRespectPage açılır
4. Miktar seçer
5. "Gönder ve Destekle" butonuna tıklar
6. Respect gönderilir
7. Şarkı sayfasına geri döner

## 🔮 Gelecek Geliştirmeler

### **Aşama 1: Gerçek Ödeme Sistemi**
- [ ] Stripe entegrasyonu
- [ ] PayPal entegrasyonu
- [ ] Kredi kartı işlemleri
- [ ] Ödeme güvenliği

### **Aşama 2: Gelişmiş Özellikler**
- [ ] Respect hediye etme
- [ ] Respect çekme
- [ ] Respect transferi
- [ ] Respect geçmişi

### **Aşama 3: Sosyal Özellikler**
- [ ] Respect sıralaması
- [ ] Respect rozetleri
- [ ] Respect başarıları
- [ ] Respect toplulukları

## 🐛 Bilinen Sorunlar

1. **Dummy Ödeme:** Şu anda gerçek ödeme sistemi yok
2. **Balance Senkronizasyonu:** Sayfa yenileme gerekiyor
3. **Hata Yönetimi:** Bazı hata durumları eksik
4. **Mobile Optimizasyon:** Bazı ekranlarda iyileştirme gerekli

## 📞 Destek

Sistem ile ilgili sorunlar için:
- GitHub Issues kullanın
- Teknik dokümantasyonu kontrol edin
- Test senaryolarını çalıştırın

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0
**Durum:** Test Aşamasında 