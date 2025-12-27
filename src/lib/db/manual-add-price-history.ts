import { db } from '@/lib/db';
import { products, priceHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function addManualPriceHistory() {
  try {
    // New Balance 2002R ürününü bul
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

    // Manuel olarak eklemek istediğiniz fiyat geçmişi verileri
    // Tarihleri bugünden geriye doğru ayarlayın
    const now = new Date();
    const priceHistoryData = [
      // Son 12 ayın verileri (aylık)
      {
        productId,
        price: '120.00',
        salePrice: '100.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 12, 15), // 12 ay önce
      },
      {
        productId,
        price: '125.00',
        salePrice: '105.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 11, 15), // 11 ay önce
      },
      {
        productId,
        price: '118.00',
        salePrice: '98.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 10, 15), // 10 ay önce
      },
      {
        productId,
        price: '122.00',
        salePrice: '102.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 9, 15), // 9 ay önce
      },
      {
        productId,
        price: '120.00',
        salePrice: null, // İndirim yok
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 8, 15), // 8 ay önce
      },
      {
        productId,
        price: '128.00',
        salePrice: '108.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 7, 15), // 7 ay önce
      },
      {
        productId,
        price: '115.00',
        salePrice: '95.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 6, 15), // 6 ay önce
      },
      {
        productId,
        price: '130.00',
        salePrice: '110.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 5, 15), // 5 ay önce
      },
      {
        productId,
        price: '125.00',
        salePrice: '105.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 4, 15), // 4 ay önce
      },
      {
        productId,
        price: '118.00',
        salePrice: null, // İndirim yok
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 3, 15), // 3 ay önce
      },
      {
        productId,
        price: '122.00',
        salePrice: '102.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 2, 15), // 2 ay önce
      },
      {
        productId,
        price: '120.00',
        salePrice: '100.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15), // 1 ay önce
      },
      {
        productId,
        price: '125.00',
        salePrice: '105.00',
        recordedAt: new Date(now.getFullYear(), now.getMonth(), 1), // Bu ay
      },
    ];

    // Mevcut kayıtları sil
    const existingHistory = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, productId));

    if (existingHistory.length > 0) {
      console.log(`⚠️  Mevcut ${existingHistory.length} kayıt siliniyor...`);
      await db.delete(priceHistory).where(eq(priceHistory.productId, productId));
      console.log('   ✅ Eski kayıtlar silindi.');
    }

    // Yeni kayıtları ekle
    console.log('\n📊 Fiyat geçmişi ekleniyor...');
    await db.insert(priceHistory).values(priceHistoryData);

    console.log(`✅ ${priceHistoryData.length} fiyat geçmişi kaydı başarıyla eklendi!`);
    console.log(`\n🌐 Şimdi bu ürünün detay sayfasına gidin:\n   http://localhost:3000/products/${productId}`);
    
    // Eklenen verileri göster
    console.log('\n📋 Eklenen veriler:');
    priceHistoryData.forEach((data, index) => {
      console.log(`   ${index + 1}. ${data.recordedAt.toLocaleDateString('tr-TR')} - Normal: $${data.price}, İndirimli: ${data.salePrice ? '$' + data.salePrice : 'Yok'}`);
    });
  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  }
}

if (require.main === module) {
  addManualPriceHistory()
    .then(() => {
      console.log('\n✅ Tamamlandı!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Script başarısız:', err);
      process.exit(1);
    });
}

