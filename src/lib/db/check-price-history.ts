import { db } from '@/lib/db';
import { products, priceHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkPriceHistory() {
  try {
    console.log('🔍 New Balance 2002R ürünü aranıyor...');
    const targetProduct = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.name, 'New Balance 2002R'))
      .limit(1);

    if (targetProduct.length === 0) {
      console.error('❌ "New Balance 2002R" ürünü bulunamadı!');
      return;
    }

    const productId = targetProduct[0].id;
    console.log(`\n✅ Bulunan ürün: ${targetProduct[0].name}`);
    console.log(`   ID: ${productId}\n`);

    // Tüm fiyat geçmişi kayıtlarını kontrol et
    const allHistory = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, productId))
      .orderBy(priceHistory.recordedAt);

    console.log(`📊 Toplam ${allHistory.length} kayıt bulundu:\n`);

    if (allHistory.length === 0) {
      console.log('❌ Veritabanında fiyat geçmişi kaydı yok!');
      return;
    }

    allHistory.forEach((record, index) => {
      console.log(`${index + 1}. Tarih: ${record.recordedAt.toLocaleDateString('tr-TR')}`);
      console.log(`   Normal Fiyat: $${record.price}`);
      console.log(`   İndirimli Fiyat: ${record.salePrice ? '$' + record.salePrice : 'Yok'}`);
      console.log(`   ID: ${record.id}\n`);
    });

    // Son 12 ay kontrolü
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    console.log(`\n📅 Son 12 ay kontrolü:`);
    console.log(`   Şu an: ${now.toLocaleDateString('tr-TR')}`);
    console.log(`   12 ay önce: ${twelveMonthsAgo.toLocaleDateString('tr-TR')}\n`);

    const recentHistory = allHistory.filter(record => 
      new Date(record.recordedAt) >= twelveMonthsAgo
    );

    console.log(`✅ Son 12 ay içinde ${recentHistory.length} kayıt var`);
    
    if (recentHistory.length === 0) {
      console.log('⚠️  UYARI: Son 12 ay içinde kayıt yok! Tarihler çok eski olabilir.');
    }
  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  }
}

if (require.main === module) {
  checkPriceHistory()
    .then(() => {
      console.log('\n✅ Kontrol tamamlandı!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Script başarısız:', err);
      process.exit(1);
    });
}

