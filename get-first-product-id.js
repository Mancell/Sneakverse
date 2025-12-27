// Quick script to get first product ID
const { db } = require('./src/lib/db/index.ts');
const { products } = require('./src/lib/db/schema/index.ts');
const { eq } = require('drizzle-orm');

async function getFirstProductId() {
  try {
    const result = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.isPublished, true))
      .limit(1);
    
    if (result.length > 0) {
      console.log(result[0].id);
    } else {
      console.log('No products found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getFirstProductId();

