import { db } from '@/lib/db';
import { products, brands } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Marka bazlı ürün isim örnekleri
const brandProductNames: Record<string, string[]> = {
  'nike': ['Air Max', 'Air Force', 'Dunk', 'React', 'Zoom'],
  'adidas': ['Ultraboost', 'Stan Smith', 'Superstar', 'Yeezy', 'NMD'],
  'puma': ['Suede Classic', 'RS-X', 'Clyde', 'Thunder', 'Future'],
  'new-balance': ['574', '990', '550', '327', '2002R'],
  'reebok': ['Classic Leather', 'Club C', 'Instapump', 'Question', 'Answer'],
  'asics': ['Gel-Kayano', 'Gel-Nimbus', 'GT-2000', 'Gel-Lyte', 'Metaspeed'],
  'under-armour': ['HOVR', 'Charged', 'Curry', 'Project Rock', 'Speedform'],
  'skechers': ['D\'Lites', 'Go Walk', 'Relaxed Fit', 'Memory Foam', 'Arch Fit'],
  'vans': ['Old Skool', 'Authentic', 'Sk8-Hi', 'Era', 'Slip-On'],
  'converse': ['Chuck Taylor', 'One Star', 'Jack Purcell', 'Run Star', 'Platform'],
  'tommy-hilfiger': ['Classic', 'Sport', 'Premium', 'Heritage', 'Signature'],
  'tommy-jeans': ['Retro', 'Vintage', 'Street', 'Classic', 'Modern'],
  'calvin-klein': ['Minimalist', 'Classic', 'Modern', 'Essential', 'Signature'],
  'jack-jones': ['Urban', 'Classic', 'Premium', 'Essential', 'Modern'],
  'kappa': ['Sport', 'Classic', 'Retro', 'Modern', 'Heritage'],
  'crocs': ['Classic Clog', 'Literide', 'Bistro', 'Crocsband', 'Swiftwater'],
  'camper': ['Peu', 'Pelotas', 'Right', 'Twins', 'Camaleon'],
  'superga': ['2750', '2790', 'Classic', 'CotU', 'Platform'],
  'slazenger': ['Heritage', 'Classic', 'Sport', 'Premium', 'Modern'],
  'red-tape': ['Classic', 'Sport', 'Premium', 'Heritage', 'Modern'],
  'ducavelli': ['Classic', 'Premium', 'Heritage', 'Modern', 'Sport'],
  'defacto': ['Essential', 'Classic', 'Modern', 'Premium', 'Sport'],
  'muggo': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
  'lumberjack': ['Outdoor', 'Work', 'Classic', 'Premium', 'Heritage'],
  'jump': ['Sport', 'Classic', 'Modern', 'Premium', 'Essential'],
  'salomon': ['Speedcross', 'XT-6', 'XA Pro', 'Quest', 'Sense'],
  'columbia': ['Bugaboot', 'Trail', 'Outdry', 'Sport', 'Classic'],
  'merrell': ['Moab', 'Trail', 'Jungle', 'Vapor', 'Accent'],
  'the-north-face': ['Vectiv', 'Trail', 'Ultra', 'Endurance', 'Flight'],
  'jack-wolfskin': ['Texapore', 'Trail', 'Outdoor', 'Premium', 'Classic'],
  'hummel': ['Classic', 'Sport', 'Heritage', 'Modern', 'Premium'],
  'lotto': ['Stadio', 'Primo', 'Classic', 'Sport', 'Modern'],
  'peak': ['Flash', 'Classic', 'Sport', 'Modern', 'Premium'],
  'on': ['Cloud', 'Cloudrunner', 'Cloudflow', 'Cloudstratus', 'Cloudflyer'],
  'inci': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
  'dockers-by-gerli': ['Classic', 'Premium', 'Heritage', 'Modern', 'Essential'],
  'united-colors-of-benetton': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
  'gönderir': ['Classic', 'Sport', 'Modern', 'Premium', 'Heritage'],
  'letao': ['Classic', 'Modern', 'Premium', 'Sport', 'Essential'],
  'tonny-black': ['Classic', 'Premium', 'Modern', 'Heritage', 'Sport'],
  'scooter': ['Classic', 'Modern', 'Sport', 'Premium', 'Essential'],
};

async function updateProductNames() {
  try {
    console.log('[update-product-names] Starting...');
    
    // Get all brands
    const allBrands = await db.select().from(brands);
    const brandMap = new Map(allBrands.map(b => [b.id, b]));
    
    // Get all products
    const allProducts = await db.select().from(products);
    
    let updated = 0;
    for (const product of allProducts) {
      if (!product.brandId) continue;
      
      const brand = brandMap.get(product.brandId);
      if (!brand) continue;
      
      // Get product name templates for this brand
      const nameTemplates = brandProductNames[brand.slug] || ['Classic', 'Premium', 'Sport', 'Modern', 'Essential'];
      
      // Generate a new name based on brand
      const template = nameTemplates[Math.floor(Math.random() * nameTemplates.length)];
      const newName = `${brand.name} ${template}`;
      
      // Add a number if needed to make it unique (optional)
      const finalName = newName;
      
      if (product.name !== finalName) {
        await db
          .update(products)
          .set({ name: finalName })
          .where(eq(products.id, product.id));
        updated++;
        console.log(`[update-product-names] Updated product "${product.name}" to "${finalName}" (${brand.name})`);
      }
    }
    
    console.log(`[update-product-names] Updated ${updated} products`);
    process.exit(0);
  } catch (error) {
    console.error('[update-product-names] Error:', error);
    process.exit(1);
  }
}

updateProductNames();

