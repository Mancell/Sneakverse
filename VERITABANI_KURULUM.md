# Veritabanı Kurulum Rehberi

## Sorun
Veritabanında ürünler görünmüyor çünkü:
1. Veritabanı tabloları oluşturulmamış olabilir
2. Seed script'i çalıştırılmamış (ürünler eklenmemiş)

## Çözüm Adımları

### 1. Supabase Bağlantısını Ayarlayın

`.env.local` dosyasında `DATABASE_URL` değişkenini ayarlayın:

**Supabase Connection String Alma:**
1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Settings > Database bölümüne gidin
4. "Connection string" sekmesine tıklayın
5. "URI" formatını seçin
6. Connection string'i kopyalayın

**Örnek format:**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**Not:** `[YOUR-PASSWORD]` kısmını Supabase'den aldığınız gerçek şifre ile değiştirin. Şifreyi unuttuysanız, Supabase Dashboard > Settings > Database > Database password bölümünden reset edebilirsiniz.

**Pooler Connection (Önerilen - Daha Hızlı):**
Supabase pooler connection kullanmak için:
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
```

**Direct Connection:**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

**Neon kullanıyorsanız:**
- Neon Dashboard > Connection Details > Connection string
- Connection string'i kopyalayın ve `.env.local` dosyasına ekleyin

### 2. Veritabanı Tablolarını Oluşturun

```bash
npm run db:push
```

Bu komut veritabanı şemasını oluşturur.

### 3. Ürünleri Veritabanına Ekleyin (Seed)

```bash
npm run db:seed
```

Bu komut:
- Gender'ları ekler (Men, Women, Unisex)
- Renkleri ekler (Black, White, Red, Blue, Green, Gray)
- Bedenleri ekler (7, 8, 9, 10, 11, 12)
- Nike markasını ekler
- Kategorileri ekler (Shoes, Running Shoes, Lifestyle)
- 15 ürün ekler (her biri için variant'lar ve görseller)

### 4. Kontrol Edin

Seed script'i başarıyla çalıştıktan sonra:
- `/products` sayfasında ürünler görünmeli
- `/products?gender=men` sayfasında erkek ürünleri görünmeli
- `/products?gender=women` sayfasında kadın ürünleri görünmeli

## Hata Durumunda

Eğer `db:push` veya `db:seed` komutları hata verirse:

1. **Veritabanı bağlantısını kontrol edin:**
   - `.env.local` dosyasında `DATABASE_URL` doğru mu?
   - Veritabanı servisi çalışıyor mu?

2. **SSL hatası alıyorsanız:**
   - Supabase kullanıyorsanız, connection string'de `?sslmode=require` ekleyin
   - Neon kullanıyorsanız, connection string doğru formatta olmalı

3. **Tablolar zaten varsa:**
   - Seed script'i idempotent (güvenli tekrar çalıştırılabilir)
   - Tekrar çalıştırabilirsiniz, mevcut verileri etkilemez

## Manuel Kontrol

Veritabanında ürünlerin olup olmadığını kontrol etmek için:

```bash
npm run db:studio
```

Bu komut Drizzle Studio'yu açar ve veritabanı içeriğini görsel olarak kontrol edebilirsiniz.

