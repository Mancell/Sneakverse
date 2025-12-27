import { db } from '@/lib/db';
import { products, brands, categories, brandCategories, genders } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { assignCategoryForProduct } from '@/lib/utils/category-assignment';

async function updateProductsByBrandCategory() {
  try {
    console.log('[update-products-by-brand-category] Starting...');
    
    // Get all data
    const allProducts = await db.select().from(products);
    const allBrands = await db.select().from(brands);
    const allCategories = await db.select().from(categories);
    const allGenders = await db.select().from(genders);
    
    // Get brand-category relationships
    const brandCategoryRelations = await db.select().from(brandCategories);
    const brandCategoryMap = new Map<string, typeof allCategories>();
    for (const relation of brandCategoryRelations) {
      const brand = allBrands.find(b => b.id === relation.brandId);
      const category = allCategories.find(c => c.id === relation.categoryId);
      if (brand && category) {
        if (!brandCategoryMap.has(brand.slug)) {
          brandCategoryMap.set(brand.slug, []);
        }
        brandCategoryMap.get(brand.slug)!.push(category);
      }
    }
    
    let updated = 0;
    for (const product of allProducts) {
      const brand = allBrands.find(b => b.id === product.brandId);
      const gender = allGenders.find(g => g.id === product.genderId);
      
      if (!brand || !gender) continue;
      
      // Get appropriate category based on brand and gender
      const appropriateCategory = assignCategoryForProduct(
        gender.slug,
        brand.slug,
        allCategories,
        brandCategoryMap
      );
      
      if (appropriateCategory && product.categoryId !== appropriateCategory.id) {
        await db
          .update(products)
          .set({ categoryId: appropriateCategory.id })
          .where(eq(products.id, product.id));
        updated++;
        console.log(`[update-products-by-brand-category] Updated product ${product.name} (${brand.name}, ${gender.slug}) to category ${appropriateCategory.name}`);
      }
    }
    
    console.log(`[update-products-by-brand-category] Updated ${updated} products`);
    process.exit(0);
  } catch (error) {
    console.error('[update-products-by-brand-category] Error:', error);
    process.exit(1);
  }
}

updateProductsByBrandCategory();

