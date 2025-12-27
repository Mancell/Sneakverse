# .env.local Dosyası Güncelleme

## ⚠️ ÖNEMLİ: Manuel Güncelleme Gerekli

`.env.local` dosyası güvenlik nedeniyle otomatik olarak yazılamaz. Lütfen manuel olarak güncelleyin.

## 📝 Yapılacaklar

1. Proje kök dizininde `.env.local` dosyasını açın
2. `DATABASE_URL` satırını bulun
3. Şu şekilde güncelleyin:

```env
DATABASE_URL="postgresql://postgres:69769702Kfmm@db.crcaivyntuldqmzcgyvy.supabase.co:5432/postgres?sslmode=require"
```

**VEYA** Pooler connection kullanın (daha güvenilir, SSL sorunları yaşamaz):

```env
DATABASE_URL="postgresql://postgres.crcaivyntuldqmzcgyvy:69769702Kfmm@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

## 🔧 Tam .env.local İçeriği

```env
# Supabase Database Connection (Pooler - Önerilen)
DATABASE_URL="postgresql://postgres.crcaivyntuldqmzcgyvy:69769702Kfmm@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://crcaivyntuldqmzcgyvy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_i0ADj4EUNgDvuOmqCnDtkQ_0T4HP7jH"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_ZobO-CtYJRslcU45bopYxQ_snLYZHRL"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here-change-this"
BETTER_AUTH_URL="http://localhost:3000"
```

## ✅ Güncelleme Sonrası

1. Dosyayı kaydedin
2. Terminal'de şu komutları çalıştırın:

```bash
# Tabloları oluştur
npm run db:push

# Ürünleri ekle
npm run db:seed
```

## 🔍 Pooler vs Direct Connection

- **Pooler Connection (Önerilen):** Daha güvenilir, SSL sorunları yaşamaz, daha hızlı
- **Direct Connection:** Bazen SSL sertifika hataları verebilir

Pooler connection kullanmanızı öneririm.

