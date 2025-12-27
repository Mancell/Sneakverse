import { db } from '@/lib/db';
import { brands, categories, brandCategories } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Marka-kategori eşleştirmeleri
const brandCategoryMap: Record<string, string[]> = {
  // Spor markaları - sneakers ve sports
  'nike': ['sneakers', 'sports-and-outdoor-shoes', 'boots'],
  'adidas': ['sneakers', 'sports-and-outdoor-shoes', 'boots'],
  'puma': ['sneakers', 'sports-and-outdoor-shoes', 'boots'],
  'new-balance': ['sneakers', 'sports-and-outdoor-shoes', 'boots'],
  'reebok': ['sneakers', 'sports-and-outdoor-shoes', 'boots'],
  'asics': ['sneakers', 'sports-and-outdoor-shoes'],
  'under-armour': ['sneakers', 'sports-and-outdoor-shoes', 'boots'],
  'skechers': ['sneakers', 'sports-and-outdoor-shoes', 'flat-shoes'],
  'salomon': ['sports-and-outdoor-shoes', 'boots', 'sneakers'],
  'columbia': ['sports-and-outdoor-shoes', 'boots'],
  'merrell': ['sports-and-outdoor-shoes', 'boots'],
  'the-north-face': ['sports-and-outdoor-shoes', 'boots'],
  'jack-wolfskin': ['sports-and-outdoor-shoes', 'boots'],
  'hummel': ['sneakers', 'sports-and-outdoor-shoes'],
  'lotto': ['sneakers', 'sports-and-outdoor-shoes'],
  'peak': ['sneakers', 'sports-and-outdoor-shoes'],
  'on': ['sneakers', 'sports-and-outdoor-shoes'],
  
  // Klasik ve moda markaları
  'vans': ['sneakers', 'flat-shoes', 'boots'],
  'converse': ['sneakers', 'flat-shoes'],
  'tommy-hilfiger': ['sneakers', 'boots', 'flat-shoes', 'lace-up-shoes'],
  'tommy-jeans': ['sneakers', 'boots', 'flat-shoes'],
  'calvin-klein': ['sneakers', 'boots', 'flat-shoes', 'heeled-shoes'],
  'jack-jones': ['sneakers', 'boots', 'lace-up-shoes', 'flat-shoes'],
  'kappa': ['sneakers', 'sports-and-outdoor-shoes'],
  
  // Özel kategoriler
  'crocs': ['sandals', 'house-slippers', 'flip-flops'],
  'camper': ['sneakers', 'flat-shoes', 'boots', 'espadrilles'],
  'superga': ['sneakers', 'flat-shoes'],
  'slazenger': ['sneakers', 'sports-and-outdoor-shoes'],
  'red-tape': ['sneakers', 'boots', 'lace-up-shoes'],
  'ducavelli': ['sneakers', 'boots', 'lace-up-shoes'],
  'defacto': ['sneakers', 'boots', 'flat-shoes'],
  'muggo': ['sneakers', 'boots', 'flat-shoes'],
  'lumberjack': ['boots', 'sports-and-outdoor-shoes'],
  'jump': ['sneakers', 'sports-and-outdoor-shoes'],
  'inci': ['sneakers', 'boots', 'flat-shoes'],
  'dockers-by-gerli': ['lace-up-shoes', 'boots', 'flat-shoes'],
  'united-colors-of-benetton': ['sneakers', 'boots', 'flat-shoes'],
  'gönderir': ['sneakers', 'boots', 'sports-and-outdoor-shoes'],
  'letao': ['sneakers', 'boots', 'flat-shoes'],
  'tonny-black': ['sneakers', 'boots', 'lace-up-shoes'],
  'scooter': ['sneakers', 'flat-shoes', 'boots'],
};

async function seedBrandCategories() {
  try {
    console.log('[seed-brand-categories] Starting...');
    
    // Get all brands and categories
    const allBrands = await db.select().from(brands);
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(c => [c.slug, c]));
    
    let added = 0;
    let skipped = 0;
    
    for (const brand of allBrands) {
      const categorySlugs = brandCategoryMap[brand.slug];
      
      if (!categorySlugs || categorySlugs.length === 0) {
        // Default categories for brands without specific mapping
        const defaultCategories = ['sneakers', 'boots', 'sports-and-outdoor-shoes'];
        for (const slug of defaultCategories) {
          const category = categoryMap.get(slug);
          if (category) {
            try {
              // Check if relationship already exists
              const exists = await db
                .select()
                .from(brandCategories)
                .where(
                  sql`${brandCategories.brandId} = ${brand.id} AND ${brandCategories.categoryId} = ${category.id}`
                )
                .limit(1);
              
              if (exists.length === 0) {
                await db.insert(brandCategories).values({
                  brandId: brand.id,
                  categoryId: category.id,
                });
                added++;
              } else {
                skipped++;
              }
            } catch (error) {
              console.error(`Error adding ${brand.name} - ${category.name}:`, error);
              skipped++;
            }
          }
        }
      } else {
        for (const slug of categorySlugs) {
          const category = categoryMap.get(slug);
          if (category) {
            try {
              // Check if relationship already exists
              const exists = await db
                .select()
                .from(brandCategories)
                .where(
                  sql`${brandCategories.brandId} = ${brand.id} AND ${brandCategories.categoryId} = ${category.id}`
                )
                .limit(1);
              
              if (exists.length === 0) {
                await db.insert(brandCategories).values({
                  brandId: brand.id,
                  categoryId: category.id,
                });
                added++;
              } else {
                skipped++;
              }
            } catch (error) {
              console.error(`Error adding ${brand.name} - ${category.name}:`, error);
              skipped++;
            }
          }
        }
      }
    }
    
    console.log(`[seed-brand-categories] Added ${added} brand-category relationships, ${skipped} already existed`);
    process.exit(0);
  } catch (error) {
    console.error('[seed-brand-categories] Error:', error);
    process.exit(1);
  }
}

seedBrandCategories();

