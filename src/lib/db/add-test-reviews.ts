import { db } from '@/lib/db';
import { products, reviews, users, insertReviewSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function addTestReviews() {
  try {
    // New Balance 2002R ürününü bul
    console.log('🔍 New Balance 2002R ürünü aranıyor...');
    const product = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.name, 'New Balance 2002R'))
      .limit(1);

    if (product.length === 0) {
      console.error('❌ "New Balance 2002R" ürünü bulunamadı!');
      return;
    }

    const productId = product[0].id;
    console.log(`\n✅ Bulunan ürün: ${product[0].name}`);
    console.log(`   ID: ${productId}\n`);

    // Bir kullanıcı bul veya oluştur
    let userId: string;
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .limit(1);

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log(`✅ Mevcut kullanıcı kullanılıyor: ${userId}`);
    } else {
      // Test kullanıcısı oluştur
      console.log('👤 Test kullanıcısı oluşturuluyor...');
      const newUser = await db
        .insert(users)
        .values({
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
        })
        .returning({ id: users.id });
      
      userId = newUser[0].id;
      console.log(`✅ Test kullanıcısı oluşturuldu: ${userId}`);
    }

    // Test reviews ekle
    console.log('\n📝 Test reviews ekleniyor...');
    const testReviews = [
      {
        productId: productId,
        userId: userId,
        rating: 5,
        comment: 'Excellent quality! Very comfortable and stylish. Highly recommend this product.',
      },
      {
        productId: productId,
        userId: userId,
        rating: 5,
        comment: 'Amazing product! Exceeded my expectations. Very comfortable and looks great.',
      },
      {
        productId: productId,
        userId: userId,
        rating: 4,
        comment: 'Great product. Good value for money. Only minor issue is it runs a bit narrow but overall satisfied.',
      },
      {
        productId: productId,
        userId: userId,
        rating: 5,
        comment: 'Perfect! Exactly what I was looking for. Great quality and fast shipping.',
      },
      {
        productId: productId,
        userId: userId,
        rating: 4,
        comment: 'Very good product. Comfortable and durable. Would buy again.',
      },
    ];

    for (const review of testReviews) {
      const reviewData = insertReviewSchema.parse(review);
      await db.insert(reviews).values(reviewData);
      console.log(`  ✅ ${review.rating}/5 yıldız - Review eklendi`);
    }

    console.log(`\n✅ ${testReviews.length} review başarıyla eklendi!`);
    console.log(`   Ürün: ${product[0].name}`);
    console.log(`   Ortalama puan: ${(testReviews.reduce((sum, r) => sum + r.rating, 0) / testReviews.length).toFixed(1)}/5`);
    console.log(`\n🌐 Şimdi bu ürünün detay sayfasına gidin:\n   http://localhost:3000/products/${productId}`);
  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  }
}

if (require.main === module) {
  addTestReviews()
    .then(() => {
      console.log('\n✅ İşlem tamamlandı!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Hata:', err);
      process.exit(1);
    });
}

export { addTestReviews };

