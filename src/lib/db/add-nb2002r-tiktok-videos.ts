import { db } from '@/lib/db';
import { products, tiktokVideos, insertTikTokVideoSchema } from '@/lib/db/schema';
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

  // TikTok videoları ekle
  const videosToAdd = [
    {
      productId: product.id,
      videoUrl: '/ssstik.io_@joehughesshoes_1766837389237.mp4',
      thumbnailUrl: null,
      title: 'New Balance 2002R Review',
      author: 'joehughesshoes',
      sortOrder: 0,
    },
    {
      productId: product.id,
      videoUrl: '/ssstik.io_@theforumstore_1766837443138.mp4',
      thumbnailUrl: null,
      title: 'New Balance 2002R Style',
      author: 'theforumstore',
      sortOrder: 1,
    },
    {
      productId: product.id,
      videoUrl: '/ssstik.io_@usera37048920_1766837466279.mp4',
      thumbnailUrl: null,
      title: 'New Balance 2002R Unboxing',
      author: 'usera37048920',
      sortOrder: 2,
    },
  ];

  console.log('📹 TikTok videoları ekleniyor...\n');
  
  let successCount = 0;
  for (const video of videosToAdd) {
    try {
      // YouTube URL'sini embed formatına çevir
      let finalVideoUrl = video.videoUrl;
      if (video.videoUrl.includes('youtube.com/watch?v=')) {
        const videoId = video.videoUrl.split('v=')[1]?.split('&')[0];
        if (videoId) {
          finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
          // Thumbnail URL'si yoksa otomatik oluştur
          if (!video.thumbnailUrl) {
            video.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      }

      const videoData = insertTikTokVideoSchema.parse({
        ...video,
        videoUrl: finalVideoUrl,
        thumbnailUrl: video.thumbnailUrl || null,
      });
      
      await db.insert(tiktokVideos).values(videoData);
      console.log(`  ✅ ${video.title || 'Video'} eklendi`);
      console.log(`     URL: ${finalVideoUrl}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Hata: ${video.title || 'Video'}`, error);
    }
  }

  console.log(`\n✅ ${successCount} video başarıyla eklendi!`);
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

