# Supabase Bağlantı Rehberi

## ✅ Kod Hazır
Supabase bağlantısı için kod hazır. Şimdi sadece connection string'i ayarlamanız gerekiyor.

## 🔧 Adım Adım Kurulum

### 1. Supabase Connection String Alın

1. **Supabase Dashboard'a gidin:** https://supabase.com/dashboard
2. **Projenizi seçin** (veya yeni proje oluşturun)
3. **Settings** (Sol menüden) > **Database** bölümüne gidin
4. **Connection string** sekmesine tıklayın
5. **URI** formatını seçin
6. **Connection string'i kopyalayın**

### 2. `.env.local` Dosyasını Oluşturun/Güncelleyin

Proje kök dizininde `.env.local` dosyası oluşturun:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**Önemli:** 
- `[YOUR-PASSWORD]` → Supabase database şifreniz (Settings > Database > Database password)
- `[PROJECT-REF]` → Proje referansınız (URL'de görünür, örn: `crcaivyntuldqmzcgyvy`)

**Örnek:**
```env
DATABASE_URL="postgresql://postgres:MySecurePassword123@db.crcaivyntuldqmzcgyvy.supabase.co:5432/postgres"
```

### 3. Bağlantıyı Test Edin

```bash
npm run db:push
```

Bu komut başarılı olursa, bağlantı çalışıyor demektir.

### 4. Tabloları Oluşturun ve Ürünleri Ekleyin

```bash
# Tabloları oluştur
npm run db:push

# Ürünleri ekle
npm run db:seed
```

## 🔍 Sorun Giderme

### SSL Hatası Alıyorsanız

Connection string'e `?sslmode=require` ekleyin:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

**Not:** Kod otomatik olarak ekler, ama manuel eklemek de çalışır.

### WebSocket Hatası Alıyorsanız

Bu normaldir - Neon serverless driver WebSocket kullanır. Supabase ile çalışır, sadece uyarı verir.

### Şifreyi Unuttuysanız

1. Supabase Dashboard > Settings > Database
2. "Database password" bölümünde "Reset database password" butonuna tıklayın
3. Yeni şifreyi kopyalayın ve `.env.local` dosyasına ekleyin

## ✅ Başarı Kontrolü

Seed script'i başarıyla çalıştıktan sonra terminal'de şunu görmelisiniz:

```
[seed] Seeding complete
```

Ardından `/products` sayfasında ürünler görünmelidir.

