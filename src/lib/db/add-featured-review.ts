import { db } from '@/lib/db';
import { featuredReviews, insertFeaturedReviewSchema } from '@/lib/db/schema';
import { products } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Featured Review Ekleme Script'i
 * 
 * Kullanım:
 * 1. Ürün ID'sini bulun (products sayfasından veya veritabanından)
 * 2. Script'i çalıştırın: npm run add-featured-review
 * 
 * Veya direkt bu fonksiyonu çağırın:
 * addFeaturedReview({
 *   productId: 'ürün-uuid',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   rating: 5,
 *   comment: 'Harika bir ürün!',
 *   order: 1
 * })
 */

export async function addFeaturedReview(data: {
  productId: string;
  firstName: string;
  lastName: string;
  rating: number; // 1-5 arası
  comment: string;
  order: number; // 1, 2, veya 3
}) {
  try {
    // Ürünün var olup olmadığını kontrol et
    const product = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (product.length === 0) {
      throw new Error(`Ürün bulunamadı: ${data.productId}`);
    }

    console.log(`[addFeaturedReview] Ürün bulundu: ${product[0].name}`);

    // Aynı order'da başka bir review var mı kontrol et
    const existing = await db
      .select()
      .from(featuredReviews)
      .where(
        and(
          eq(featuredReviews.productId, data.productId),
          eq(featuredReviews.order, data.order)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.warn(`[addFeaturedReview] Uyarı: Bu ürün için order ${data.order} zaten kullanılıyor. Güncelleniyor...`);
      // Mevcut review'u güncelle
      await db
        .update(featuredReviews)
        .set({
          firstName: data.firstName,
          lastName: data.lastName,
          rating: data.rating,
          comment: data.comment,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(featuredReviews.productId, data.productId),
            eq(featuredReviews.order, data.order)
          )
        );
      console.log(`[addFeaturedReview] Review güncellendi!`);
      return;
    }

    // Yeni review ekle
    const reviewData = insertFeaturedReviewSchema.parse(data);
    await db.insert(featuredReviews).values(reviewData);

    console.log(`[addFeaturedReview] Review başarıyla eklendi!`);
    console.log(`  - İsim: ${data.firstName} ${data.lastName}`);
    console.log(`  - Puan: ${data.rating}/5`);
    console.log(`  - Sıra: ${data.order}`);
  } catch (error) {
    console.error('[addFeaturedReview] Hata:', error);
    throw error;
  }
}

// Toplu review ekleme fonksiyonu
export async function addMultipleFeaturedReviews(reviews: Array<{
  productId: string;
  firstName: string;
  lastName: string;
  rating: number;
  comment: string;
  order: number;
}>) {
  for (const review of reviews) {
    await addFeaturedReview(review);
  }
  console.log(`✅ ${reviews.length} review başarıyla eklendi!`);
}

// Eğer script olarak çalıştırılıyorsa
if (require.main === module) {
  async function main() {
    // Önce ürün listesini göster
    console.log('📦 Mevcut ürünler:\n');
    const productList = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.isPublished, true))
      .orderBy(products.createdAt)
      .limit(10);

    if (productList.length === 0) {
      console.error('❌ Hiç yayınlanmış ürün bulunamadı!');
      process.exit(1);
    }

    productList.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}`);
      console.log(`     ID: ${p.id}\n`);
    });

    // Ürün ID'sini al
    const productId = process.env.PRODUCT_ID || productList[0].id; // İlk ürünü varsayılan olarak kullan

    if (!productId) {
      console.error('❌ Ürün ID\'si bulunamadı!');
      console.log('\n💡 İpucu: PRODUCT_ID="ürün-uuid" npm run db:add-featured-review');
      process.exit(1);
    }

    // Seçilen ürünü göster
    const selectedProduct = productList.find(p => p.id === productId) || productList[0];
    console.log(`\n✅ Seçilen ürün: ${selectedProduct.name}`);
    console.log(`   ID: ${productId}\n`);

    // Örnek review verileri
    const reviewsToAdd = [
      {
        productId: productId,
        firstName: 'John',
        lastName: 'Doe',
        rating: 5,
        comment: 'Harika bir ürün! Çok memnun kaldım. Kalitesi mükemmel ve çok rahat. Kesinlikle tavsiye ederim.',
        order: 1,
      },
      {
        productId: productId,
        firstName: 'Jane',
        lastName: 'Smith',
        rating: 5,
        comment: 'Mükemmel kalite! Beklentilerimi aştı. Çok rahat ve şık görünüyor. Herkese öneririm.',
        order: 2,
      },
      {
        productId: productId,
        firstName: 'Bob',
        lastName: 'Johnson',
        rating: 4,
        comment: 'Güzel bir ürün. Fiyatına göre çok iyi. Tek eksik yanı biraz dar gelmesi ama genel olarak memnunum.',
        order: 3,
      },
    ];

    // Tüm review'ları ekle
    await addMultipleFeaturedReviews(reviewsToAdd);
    console.log(`\n✅ Tüm review'lar başarıyla eklendi!`);
    console.log(`   Ürün: ${selectedProduct.name}`);
    console.log(`   Toplam: ${reviewsToAdd.length} review`);
  }

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

