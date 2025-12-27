import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function createPriceHistoryTable() {
  try {
    console.log('📊 Creating price_history table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS price_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        price NUMERIC(10, 2) NOT NULL,
        sale_price NUMERIC(10, 2),
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log('✅ price_history table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

if (require.main === module) {
  createPriceHistoryTable()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Script failed:', err);
      process.exit(1);
    });
}

