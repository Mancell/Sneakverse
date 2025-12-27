import { db } from '@/lib/db';
import { products, tiktokVideos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  // New Balance 2002R ürününü bul
  console.log('🔍 New Balance 2002R ürünü aranıyor...\n');
  
  const productList = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.name, 'New Balance 2002R'))
    .limit(1);

  if (productList.length === 0) {
    console.error('❌ "New Balance 2002R" ürünü bulunamadı!');
    process.exit(1);
  }

  const product = productList[0];
  
  console.log(`✅ Bulunan ürün: ${product.name}`);
  console.log(`   ID: ${product.id}\n`);

  // YouTube videolarını sil (eski test videoları)
  const { sql } = await import('drizzle-orm');
  
  const result = await db.execute(
    sql`DELETE FROM tiktok_videos WHERE product_id = ${product.id} AND video_url LIKE 'https://www.youtube.com%'`
  );
  
  console.log(`🗑️  Eski YouTube videoları silindi (${result.rowCount || 0} video)`);

  console.log(`🗑️  Eski YouTube videoları silindi\n`);

  // Kalan videoları kontrol et
  const remainingVideos = await db
    .select()
    .from(tiktokVideos)
    .where(eq(tiktokVideos.productId, product.id));

  console.log(`📹 Kalan video sayısı: ${remainingVideos.length}\n`);

  if (remainingVideos.length > 0) {
    // Sort order'ları düzelt
    for (let i = 0; i < remainingVideos.length; i++) {
      await db
        .update(tiktokVideos)
        .set({ sortOrder: i })
        .where(eq(tiktokVideos.id, remainingVideos[i].id));
      
      console.log(`  ✅ ${remainingVideos[i].title || 'Video'} - Sort Order: ${i}`);
    }
  }

  console.log(`\n✅ Tamamlandı!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Hata:', error);
    process.exit(1);
  });

