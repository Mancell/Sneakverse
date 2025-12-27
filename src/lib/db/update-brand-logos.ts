import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Logo dosya adlarından marka adlarını eşleştir
const logoMapping: Record<string, string> = {
  'nike-4-2.svg': 'Nike',
  'adidas-13.svg': 'Adidas',
  'puma-logo.svg': 'Puma',
  'new-balance-2.svg': 'New Balance',
  'reebok-5.svg': 'Reebok',
  'asics-6.svg': 'ASICS',
  'under-armour-logo.svg': 'Under Armour',
  'vans-3.svg': 'Vans',
  'converse': 'Converse', // Dosya adı yok ama eklenebilir
  'salomon-logo.svg': 'Salomon',
  'merrell.svg': 'Merrell',
  'columbia-sportswear-co-1.svg': 'Columbia',
  'The North Face®_idag8zcHyV_0.svg': 'The North Face',
  'logo-jack-wolfskin-1.svg': 'Jack Wolfskin',
  'lotto-5.svg': 'Lotto',
  'kappa-3.svg': 'Kappa',
  'hummel-international-logo-.svg': 'Hummel',
  'slazenger.svg': 'Slazenger',
  'lumberjack.svg': 'Lumberjack',
  'dockers.svg': 'Dockers',
  'jack-jones.svg': 'Jack & Jones',
  'tommy-hilfiger-3.svg': 'Tommy Hilfiger',
  'calvin-klein-1.svg': 'Calvin Klein',
  'benetton-21547.svg': 'Benetton',
  'camper-1.svg': 'Camper',
  'de-facto-1.svg': 'De Facto',
  'letao.svg': 'Letao',
  'logo-crocs.svg': 'Crocs',
  'Superga_idM1lgsbbj_1.svg': 'Superga',
};

async function main() {
  console.log('🔍 Marka logoları güncelleniyor...\n');
  
  // Tüm markaları getir
  const allBrands = await db.select().from(brands);
  
  console.log(`📋 Bulunan marka sayısı: ${allBrands.length}\n`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const brand of allBrands) {
    // Marka adına göre logo dosyasını bul
    let logoFile: string | null = null;
    
    // Önce direkt eşleşme kontrol et
    for (const [file, brandName] of Object.entries(logoMapping)) {
      if (brandName.toLowerCase() === brand.name.toLowerCase()) {
        logoFile = file;
        break;
      }
    }
    
    // Eğer bulunamadıysa, marka adından slug oluştur ve dosya adlarında ara
    if (!logoFile) {
      const brandSlug = brand.name.toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Dosya adlarında marka adını ara (kısmi eşleşme)
      for (const file of Object.keys(logoMapping)) {
        const fileLower = file.toLowerCase();
        if (fileLower.includes(brandSlug) || brandSlug.includes(fileLower.replace('.svg', '').replace(/-/g, ''))) {
          logoFile = file;
          break;
        }
      }
    }
    
    if (logoFile) {
      const logoUrl = `/logobrands/${logoFile}`;
      
      // Sadece farklıysa güncelle
      if (brand.logoUrl !== logoUrl) {
        await db
          .update(brands)
          .set({ logoUrl })
          .where(eq(brands.id, brand.id));
        
        console.log(`  ✅ ${brand.name} -> ${logoFile}`);
        updated++;
      } else {
        console.log(`  ⏭️  ${brand.name} (zaten güncel)`);
      }
    } else {
      console.log(`  ❌ ${brand.name} (logo bulunamadı)`);
      notFound++;
    }
  }
  
  console.log(`\n✅ ${updated} marka logosu güncellendi`);
  if (notFound > 0) {
    console.log(`⚠️  ${notFound} marka için logo bulunamadı`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Hata:', error);
    process.exit(1);
  });

