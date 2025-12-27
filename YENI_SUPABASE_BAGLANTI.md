# Yeni Supabase Bağlantısı

## .env.local Dosyasını Güncelleyin

`.env.local` dosyasını şu şekilde güncelleyin:

```env
# Supabase Database Connection (Pooler - Önerilen)
DATABASE_URL="postgresql://postgres.rnbljlryipwhrucvwicx:Mahmut-oncel1091@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://rnbljlryipwhrucvwicx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_tMx-Fej_AovwhdX22sFY4A_A4wDm1b2"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_tMx-Fej_AovwhdX22sFY4A_A4wDm1b2"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_ZobO-CtYJRslcU45bopYxQ_snLYZHRL"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here-change-this"
BETTER_AUTH_URL="http://localhost:3000"
```

**ÖNEMLİ:** 
- Pooler connection kullanıyoruz (IPv6 sorunlarını önler)
- Kullanıcı adı: `postgres.rnbljlryipwhrucvwicx` (nokta ile)
- Şifre: `Mahmut-oncel1091`
- Region: `aws-1-eu-central-1` (Avrupa)

## Güncelleme Sonrası

```bash
# Tabloları oluştur
npm run db:push

# Ürünleri ekle
npm run db:seed
```

