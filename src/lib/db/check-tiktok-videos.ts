import { db } from '@/lib/db';
import { products, tiktokVideos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

  // TikTok videolarını getir
  const videos = await db
    .select()
    .from(tiktokVideos)
    .where(eq(tiktokVideos.productId, product.id));

  console.log(`📹 Bulunan video sayısı: ${videos.length}\n`);

  if (videos.length === 0) {
    console.log('❌ Bu ürün için video bulunamadı!');
  } else {
    videos.forEach((video, index) => {
      console.log(`\n📹 Video ${index + 1}:`);
      console.log(`   ID: ${video.id}`);
      console.log(`   URL: ${video.videoUrl}`);
      console.log(`   Title: ${video.title || 'N/A'}`);
      console.log(`   Author: ${video.author || 'N/A'}`);
      console.log(`   Thumbnail: ${video.thumbnailUrl || 'N/A'}`);
      console.log(`   Sort Order: ${video.sortOrder}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Hata:', error);
    process.exit(1);
  });

