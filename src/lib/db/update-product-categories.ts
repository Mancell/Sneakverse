import { db } from '@/lib/db';
import { products, categories, genders } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function updateProductCategories() {
  try {
    console.log('[update-product-categories] Starting...');
    
    // Get all categories
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(c => [c.slug, c]));
    
    // Women's categories
    const womenCategories = [
      'closed-toe-slippers',
      'boots',
      'flat-shoes',
      'house-slippers',
      'sandals-and-slippers',
      'sneakers',
      'sports-and-outdoor-shoes',
      'heeled-shoes',
    ].map(slug => categoryMap.get(slug)).filter(Boolean);
    
    // Men's categories
    const menCategories = [
      'lace-up-shoes',
      'boots',
      'flat-shoes',
      'espadrilles',
      'house-slippers',
      'flip-flops',
      'sabots-and-slippers',
      'sandals',
      'sneakers',
      'sports-and-outdoor-shoes',
      'boat-shoes',
    ].map(slug => categoryMap.get(slug)).filter(Boolean);
    
    // Unisex categories (common ones)
    const unisexCategories = [
      'boots',
      'flat-shoes',
      'house-slippers',
      'sneakers',
      'sports-and-outdoor-shoes',
    ].map(slug => categoryMap.get(slug)).filter(Boolean);
    
    // Get all genders
    const allGenders = await db.select().from(genders);
    const womenGender = allGenders.find(g => g.slug === 'women');
    const menGender = allGenders.find(g => g.slug === 'men');
    const unisexGender = allGenders.find(g => g.slug === 'unisex');
    
    // Get all products
    const allProducts = await db.select().from(products);
    
    let updated = 0;
    for (const product of allProducts) {
      let categoryToAssign = null;
      
      if (product.genderId === womenGender?.id && womenCategories.length > 0) {
        categoryToAssign = womenCategories[Math.floor(Math.random() * womenCategories.length)];
      } else if (product.genderId === menGender?.id && menCategories.length > 0) {
        categoryToAssign = menCategories[Math.floor(Math.random() * menCategories.length)];
      } else if (product.genderId === unisexGender?.id && unisexCategories.length > 0) {
        categoryToAssign = unisexCategories[Math.floor(Math.random() * unisexCategories.length)];
      }
      
      if (categoryToAssign && product.categoryId !== categoryToAssign.id) {
        await db
          .update(products)
          .set({ categoryId: categoryToAssign.id })
          .where(eq(products.id, product.id));
        updated++;
        console.log(`[update-product-categories] Updated product ${product.name} to category ${categoryToAssign.name}`);
      }
    }
    
    console.log(`[update-product-categories] Updated ${updated} products`);
    process.exit(0);
  } catch (error) {
    console.error('[update-product-categories] Error:', error);
    process.exit(1);
  }
}

updateProductCategories();

