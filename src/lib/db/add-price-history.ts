import { db } from '@/lib/db';
import { products, priceHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function addPriceHistoryForProduct(productId: string) {
  try {
    // Son 12 ay için fiyat geçmişi oluştur
    const now = new Date();
    const priceHistoryData = [];

    // Başlangıç fiyatı (12 ay önce)
    const basePrice = 120;
    const baseSalePrice = 100;

    for (let i = 12; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Fiyat dalgalanması simüle et (rastgele ±10%)
      const variation = (Math.random() - 0.5) * 0.2; // -10% to +10%
      const currentPrice = basePrice * (1 + variation);
      const currentSalePrice = baseSalePrice * (1 + variation);

      // Bazen indirimli fiyat olmasın
      const hasSale = Math.random() > 0.3; // %70 ihtimalle indirim var

      priceHistoryData.push({
        productId,
        price: currentPrice.toFixed(2),
        salePrice: hasSale ? currentSalePrice.toFixed(2) : null,
        recordedAt: date,
      });
    }

    // Veritabanına ekle
    await db.insert(priceHistory).values(priceHistoryData);

    console.log(`✅ ${priceHistoryData.length} fiyat geçmişi kaydı eklendi`);
    return priceHistoryData.length;
  } catch (error) {
    console.error('[addPriceHistoryForProduct] Hata:', error);
    throw error;
  }
}

if (require.main === module) {
  async function main() {
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

    // Mevcut fiyat geçmişini kontrol et
    const existingHistory = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, productId));

    if (existingHistory.length > 0) {
      console.log(`⚠️  Bu ürün için zaten ${existingHistory.length} fiyat geçmişi kaydı var.`);
      console.log('   Mevcut kayıtlar silinip yenileri eklenecek...');
      
      await db.delete(priceHistory).where(eq(priceHistory.productId, productId));
      console.log('   ✅ Eski kayıtlar silindi.');
    }

    console.log('\n📊 Fiyat geçmişi ekleniyor...');
    await addPriceHistoryForProduct(productId);

    console.log(`\n✅ Fiyat geçmişi başarıyla eklendi!`);
    console.log(`\n🌐 Şimdi bu ürünün detay sayfasına gidin:\n   http://localhost:3000/products/${productId}`);
  }

  main().catch((err) => {
    console.error('Script çalıştırılırken hata oluştu:', err);
    process.exit(1);
  });
}

