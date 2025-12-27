import { db } from '@/lib/db';
import { products, brands } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateProductBrands() {
  try {
    console.log('[update-product-brands] Starting...');
    
    // Get all brands
    const allBrands = await db.select().from(brands);
    
    if (allBrands.length === 0) {
      console.log('[update-product-brands] No brands found. Please run seed script first.');
      process.exit(1);
    }
    
    // Get all products
    const allProducts = await db.select().from(products);
    
    let updated = 0;
    for (const product of allProducts) {
      // Randomly assign a brand
      const randomBrand = allBrands[Math.floor(Math.random() * allBrands.length)];
      
      if (product.brandId !== randomBrand.id) {
        await db
          .update(products)
          .set({ brandId: randomBrand.id })
          .where(eq(products.id, product.id));
        updated++;
        console.log(`[update-product-brands] Updated product ${product.name} to brand ${randomBrand.name}`);
      }
    }
    
    console.log(`[update-product-brands] Updated ${updated} products`);
    process.exit(0);
  } catch (error) {
    console.error('[update-product-brands] Error:', error);
    process.exit(1);
  }
}

updateProductBrands();

