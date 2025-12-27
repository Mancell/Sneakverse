import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { isNull, eq } from 'drizzle-orm';

const log = (...args: unknown[]) => console.log('[update-amazon-urls]', ...args);
const err = (...args: unknown[]) => console.error('[update-amazon-urls:error]', ...args);

async function updateAmazonUrls() {
  try {
    log('Fetching products without Amazon URLs...');
    
    // Get all products that don't have an Amazon URL
    const productsWithoutUrl = await db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(isNull(products.amazonUrl));

    log(`Found ${productsWithoutUrl.length} products without Amazon URLs`);

    if (productsWithoutUrl.length === 0) {
      log('All products already have Amazon URLs');
      return;
    }

    // Update each product with a search URL
    for (const product of productsWithoutUrl) {
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(product.name)}&ref=sr_pg_1`;
      
      await db
        .update(products)
        .set({ amazonUrl })
        .where(eq(products.id, product.id));

      log(`Updated ${product.name} with Amazon URL`);
    }

    log('Update complete!');
  } catch (error) {
    err('Error updating Amazon URLs:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateAmazonUrls()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export { updateAmazonUrls };

