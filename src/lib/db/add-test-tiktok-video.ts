import { db } from '@/lib/db';
import { products, tiktokVideos, insertTikTokVideoSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  // İlk yayınlanmış ürünü bul
  console.log('🔍 Ürün aranıyor...\n');
  
  const productList = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.isPublished, true))
    .limit(1);

  if (productList.length === 0) {
    console.error('❌ Yayınlanmış ürün bulunamadı!');
    process.exit(1);
  }

  const product = productList[0];
  
  console.log(`✅ Bulunan ürün: ${product.name}`);
  console.log(`   ID: ${product.id}\n`);

  // Örnek TikTok videoları ekle
  const videosToAdd = [
    {
      productId: product.id,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      title: 'Product Review - Amazing Quality!',
      author: 'shoereviewer',
      sortOrder: 0,
    },
    {
      productId: product.id,
      videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      title: 'Unboxing Video - First Look',
      author: 'unboxmaster',
      sortOrder: 1,
    },
    {
      productId: product.id,
      videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
      thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      title: 'Style Tips & Outfit Ideas',
      author: 'styleguru',
      sortOrder: 2,
    },
  ];

  console.log('📹 TikTok videoları ekleniyor...');
  for (const video of videosToAdd) {
    try {
      const videoData = insertTikTokVideoSchema.parse(video);
      await db.insert(tiktokVideos).values(videoData);
      console.log(`  ✅ ${video.title}`);
    } catch (error) {
      console.error(`  ❌ Hata: ${video.title}`, error);
    }
  }

  console.log(`\n✅ ${videosToAdd.length} video başarıyla eklendi!`);
  console.log(`   Ürün: ${product.name}`);
  console.log(`\n🌐 Şimdi bu ürünün detay sayfasına gidin:`);
  console.log(`   http://localhost:3000/products/${product.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Hata:', error);
    process.exit(1);
  });

