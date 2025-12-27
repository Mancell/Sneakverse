/**
 * Helper function to assign appropriate category to a product based on gender and brand
 * This ensures categories are correctly matched to gender and brand when products are added
 */

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Gender = {
  id: string;
  slug: string;
};

type Brand = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Get appropriate categories for a given gender
 */
export function getCategoriesForGender(
  genderSlug: string,
  allCategories: Category[]
): Category[] {
  const categoryMap = new Map(allCategories.map(c => [c.slug, c]));

  if (genderSlug === 'women') {
    return [
      'closed-toe-slippers',
      'boots',
      'flat-shoes',
      'house-slippers',
      'sandals-and-slippers',
      'sneakers',
      'sports-and-outdoor-shoes',
      'heeled-shoes',
    ]
      .map(slug => categoryMap.get(slug))
      .filter((cat): cat is Category => cat !== undefined);
  } else if (genderSlug === 'men') {
    return [
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
    ]
      .map(slug => categoryMap.get(slug))
      .filter((cat): cat is Category => cat !== undefined);
  } else if (genderSlug === 'unisex') {
    return [
      'boots',
      'flat-shoes',
      'house-slippers',
      'sneakers',
      'sports-and-outdoor-shoes',
    ]
      .map(slug => categoryMap.get(slug))
      .filter((cat): cat is Category => cat !== undefined);
  }

  // Fallback: return common categories
  return [
    'sneakers',
    'boots',
    'sports-and-outdoor-shoes',
  ]
    .map(slug => categoryMap.get(slug))
    .filter((cat): cat is Category => cat !== undefined);
}

/**
 * Get categories for a brand from brand-categories relationship
 * This should be called with data from database
 */
export function getCategoriesForBrand(
  brandSlug: string,
  brandCategoryMap: Map<string, Category[]>
): Category[] {
  return brandCategoryMap.get(brandSlug) || [];
}

/**
 * Assign a category to a product based on its gender and brand
 * Priority: brand categories that match gender > gender categories > fallback
 */
export function assignCategoryForProduct(
  genderSlug: string,
  brandSlug: string | null,
  allCategories: Category[],
  brandCategoryMap?: Map<string, Category[]>
): Category | null {
  // If brand is specified and we have brand-category mapping
  if (brandSlug && brandCategoryMap) {
    const brandCategories = getCategoriesForBrand(brandSlug, brandCategoryMap);
    const genderCategories = getCategoriesForGender(genderSlug, allCategories);
    
    // Find categories that match both brand and gender
    const matchingCategories = brandCategories.filter(bc => 
      genderCategories.some(gc => gc.id === bc.id)
    );
    
    if (matchingCategories.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingCategories.length);
      return matchingCategories[randomIndex];
    }
    
    // If no match, use brand categories (at least one should match gender)
    if (brandCategories.length > 0) {
      const randomIndex = Math.floor(Math.random() * brandCategories.length);
      return brandCategories[randomIndex];
    }
  }
  
  // Fallback to gender-based assignment
  return assignCategoryForGender(genderSlug, allCategories);
}

/**
 * Assign a random category to a product based on its gender
 * Returns null if no suitable category is found
 */
export function assignCategoryForGender(
  genderSlug: string,
  allCategories: Category[]
): Category | null {
  const validCategories = getCategoriesForGender(genderSlug, allCategories);
  
  if (validCategories.length === 0) {
    // Fallback to any available category
    return allCategories.length > 0 ? allCategories[0] : null;
  }

  // Return a random category from the valid list
  const randomIndex = Math.floor(Math.random() * validCategories.length);
  return validCategories[randomIndex];
}
