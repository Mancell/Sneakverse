# .env.local Dosyası Güncelleme - SON ADIM

## ✅ Kod Hazır
Region `aws-1-eu-central-1` olarak güncellendi.

## 📝 .env.local Dosyasını Güncelleyin

`.env.local` dosyasını açın ve `DATABASE_URL` satırını şu şekilde güncelleyin:

```env
DATABASE_URL="postgresql://postgres.crcaivyntuldqmzcgyvy:69769702Kfmm@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

**Tam .env.local içeriği:**

```env
# Supabase Database Connection (Pooler - EU Central)
DATABASE_URL="postgresql://postgres.crcaivyntuldqmzcgyvy:69769702Kfmm@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://crcaivyntuldqmzcgyvy.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_i0ADj4EUNgDvuOmqCnDtkQ_0T4HP7jH"
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

## 🎉 Başarı Kontrolü

Seed script'i başarıyla çalıştıktan sonra terminal'de şunu görmelisiniz:

```
[seed] Seeding complete
```

Ardından `/products` sayfasında ürünler görünmelidir!

