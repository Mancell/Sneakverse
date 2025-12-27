# Featured Reviews Ekleme Rehberi

## 🎯 Hızlı Başlangıç

### Yöntem 1: Script ile (Önerilen)

1. **Ürün ID'sini bulun:**
   - Products sayfasına gidin: http://localhost:3000/products
   - Bir ürün linkine tıklayın
   - URL'deki ID'yi kopyalayın: `/products/[id]`
   - Örnek: `http://localhost:3000/products/123e4567-e89b-12d3-a456-426614174000`

2. **Script'i düzenleyin:**
   - `src/lib/db/add-featured-review.ts` dosyasını açın
   - `reviewsToAdd` array'indeki `productId` değerlerini güncelleyin
   - İsim, soyisim, puan ve yorumları düzenleyin

3. **Script'i çalıştırın:**
```bash
npm run db:add-featured-review
```

### Yöntem 2: Environment Variable ile

```bash
PRODUCT_ID="ürün-uuid-buraya" npm run db:add-featured-review
```

### Yöntem 3: SQL ile (Supabase Dashboard)

1. Supabase Dashboard'a gidin
2. SQL Editor'ı açın
3. Şu sorguyu çalıştırın:

```sql
-- Önce ürün ID'sini bulun
SELECT id, name FROM products WHERE is_published = true LIMIT 10;

-- Sonra featured review ekleyin
INSERT INTO featured_reviews (
  product_id,
  first_name,
  last_name,
  rating,
  comment,
  "order"
) VALUES 
  -- 1. Review
  (
    'ürün-uuid-1',  -- Ürün ID'si
    'John',
    'Doe',
    5,
    'Harika bir ürün! Çok memnun kaldım. Kalitesi mükemmel ve çok rahat.',
    1
  ),
  -- 2. Review
  (
    'ürün-uuid-1',  -- Aynı ürün
    'Jane',
    'Smith',
    5,
    'Mükemmel kalite! Beklentilerimi aştı. Çok rahat ve şık görünüyor.',
    2
  ),
  -- 3. Review
  (
    'ürün-uuid-1',  -- Aynı ürün
    'Bob',
    'Johnson',
    4,
    'Güzel bir ürün. Fiyatına göre çok iyi. Tek eksik yanı biraz dar gelmesi.',
    3
  );
```

## 📋 Örnek Veriler

```typescript
{
  productId: '123e4567-e89b-12d3-a456-426614174000',
  firstName: 'Ahmet',
  lastName: 'Yılmaz',
  rating: 5,
  comment: 'Çok kaliteli bir ürün. Ayakkabılar çok rahat ve dayanıklı. Kesinlikle tavsiye ederim!',
  order: 1
}
```

## ⚠️ Önemli Notlar

- Her ürün için **en fazla 3 featured review** olabilir (order: 1, 2, 3)
- Aynı order'da review varsa, script mevcut review'u **günceller**
- Rating **1-5** arası olmalı
- Order **1, 2, veya 3** olmalı

## 🔍 Ürün ID'si Nasıl Bulunur?

### Yöntem 1: Tarayıcıdan
1. Products sayfasına gidin
2. Bir ürün linkine tıklayın
3. URL'deki ID'yi kopyalayın

### Yöntem 2: SQL ile
```sql
SELECT id, name FROM products WHERE is_published = true ORDER BY created_at DESC LIMIT 10;
```

### Yöntem 3: Drizzle Studio
```bash
npm run db:studio
```
Drizzle Studio'da products tablosunu açıp ID'leri görebilirsiniz.

