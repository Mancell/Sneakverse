"use server";

import { getAllProducts, getAllBrands } from "./product";
import type { ProductListItem } from "./product";

export async function searchProducts(query: string, limit: number = 10): Promise<ProductListItem[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const { products } = await getAllProducts({
      search: query.trim(),
      genderSlugs: [],
      brandSlugs: [],
      categorySlugs: [],
      sizeSlugs: [],
      colorSlugs: [],
      priceMin: undefined,
      priceMax: undefined,
      priceRanges: [],
      sort: "newest",
      page: 1,
      limit,
    });

    return products;
  } catch (error) {
    console.error("[searchProducts] Error:", error);
    return [];
  }
}

export async function searchBrands(query: string): Promise<Array<{ id: string; name: string; slug: string; logoUrl: string | null }>> {
  try {
    const allBrands = await getAllBrands();
    console.log("[searchBrands] All brands fetched:", allBrands.length);
    
    if (!query || query.trim().length === 0) {
      const result = allBrands.slice(0, 8);
      console.log("[searchBrands] Returning first 8 brands:", result.length, result.map(b => b.name));
      return result; // Return first 8 brands when no query
    }

    const normalizedQuery = query.toLowerCase().trim();
    const filtered = allBrands.filter((brand) =>
      brand.name.toLowerCase().includes(normalizedQuery)
    ).slice(0, 8);
    console.log("[searchBrands] Filtered brands:", filtered.length, filtered.map(b => b.name));
    return filtered;
  } catch (error) {
    console.error("[searchBrands] Error:", error);
    return [];
  }
}
