"use server";

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brands,
  categories,
  featuredReviews,
  genders,
  productImages,
  productVariants,
  products,
  sizes,
  colors,
  users,
  reviews,
  priceHistory,
  type SelectProduct,
  type SelectVariant,
  type SelectProductImage,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
  type SelectColor,
  type SelectSize,
} from "@/lib/db/schema";

import { NormalizedProductFilters } from "@/lib/utils/query";

type ProductListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  createdAt: Date;
  subtitle?: string | null;
  brandName?: string | null;
  brandLogoUrl?: string | null;
};

export type GetAllProductsResult = {
  products: ProductListItem[];
  totalCount: number;
};

export async function getAllProducts(filters: NormalizedProductFilters): Promise<GetAllProductsResult> {
  try {
    console.log("[getAllProducts] Starting with filters:", JSON.stringify(filters));
    const conds: SQL[] = [eq(products.isPublished, true)];

    if (filters.search) {
      // Normalize search query: remove spaces, convert to lowercase for better matching
      const normalizedSearch = filters.search.trim().toLowerCase().replace(/\s+/g, '');
      const searchPattern = `%${filters.search.trim()}%`;
      
      // Search in multiple fields with case-insensitive matching
      // Also search in normalized form (without spaces) for better results
      conds.push(
        or(
          ilike(products.name, searchPattern),
          ilike(products.description, searchPattern),
          // Search in brand name via join
          ilike(brands.name, searchPattern),
          // Normalized search (without spaces) - for "newbalance" to match "New Balance"
          sql`LOWER(REPLACE(${products.name}, ' ', '')) LIKE ${`%${normalizedSearch}%`}`,
          sql`LOWER(REPLACE(${brands.name}, ' ', '')) LIKE ${`%${normalizedSearch}%`}`
        )!
      );
    }

    // Pre-fetch IDs for filters to use in queries (more reliable than subqueries)
    let genderIds: string[] = [];
    let brandIds: string[] = [];
    let categoryIds: string[] = [];
    
    if (filters.genderSlugs.length) {
      const genderResults = await db
        .select({ id: genders.id })
        .from(genders)
        .where(inArray(genders.slug, filters.genderSlugs));
      genderIds = genderResults.map(g => g.id);
      console.log("[getAllProducts] Gender slugs:", filters.genderSlugs, "-> IDs:", genderIds);
      if (genderIds.length > 0) {
        conds.push(inArray(products.genderId, genderIds));
      }
    }

    if (filters.brandSlugs.length) {
      const brandResults = await db
        .select({ id: brands.id })
        .from(brands)
        .where(inArray(brands.slug, filters.brandSlugs));
      brandIds = brandResults.map(b => b.id);
      if (brandIds.length > 0) {
        conds.push(inArray(products.brandId, brandIds));
      }
    }

    if (filters.categorySlugs.length) {
      const categoryResults = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.slug, filters.categorySlugs));
      categoryIds = categoryResults.map(c => c.id);
      if (categoryIds.length > 0) {
        conds.push(inArray(products.categoryId, categoryIds));
      }
    }

    const hasSize = filters.sizeSlugs.length > 0;
    const hasColor = filters.colorSlugs.length > 0;
    const hasPrice = !!(filters.priceMin !== undefined || filters.priceMax !== undefined || filters.priceRanges.length);

    // Pre-fetch IDs for variant filters to use in subqueries
    let sizeIds: string[] = [];
    let colorIds: string[] = [];
    
    if (hasSize) {
      const sizeResults = await db
        .select({ id: sizes.id })
        .from(sizes)
        .where(inArray(sizes.slug, filters.sizeSlugs));
      sizeIds = sizeResults.map(s => s.id);
    }
    
    if (hasColor) {
      const colorResults = await db
        .select({ id: colors.id })
        .from(colors)
        .where(inArray(colors.slug, filters.colorSlugs));
      colorIds = colorResults.map(c => c.id);
    }

    // Build variant filter SQL string for subqueries
    // Note: We use sql.raw() here because we need to embed SQL fragments in subqueries
    // The IDs are pre-fetched and validated, so this is safe
    const variantFilterParts: string[] = [];
    if (sizeIds.length > 0) {
      const sizeIdsStr = sizeIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      variantFilterParts.push(`pv.size_id IN (${sizeIdsStr})`);
    }
    if (colorIds.length > 0) {
      const colorIdsStr = colorIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      variantFilterParts.push(`pv.color_id IN (${colorIdsStr})`);
    }
    if (hasPrice) {
      const priceBounds: string[] = [];
      if (filters.priceRanges.length) {
        for (const [min, max] of filters.priceRanges) {
          const subConds: string[] = [];
          if (min !== undefined) {
            subConds.push(`pv.price::numeric >= ${min}`);
          }
          if (max !== undefined) {
            subConds.push(`pv.price::numeric <= ${max}`);
          }
          if (subConds.length) priceBounds.push(`(${subConds.join(' AND ')})`);
        }
      }
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        const subConds: string[] = [];
        if (filters.priceMin !== undefined) subConds.push(`pv.price::numeric >= ${filters.priceMin}`);
        if (filters.priceMax !== undefined) subConds.push(`pv.price::numeric <= ${filters.priceMax}`);
        if (subConds.length) priceBounds.push(`(${subConds.join(' AND ')})`);
      }
      if (priceBounds.length) {
        variantFilterParts.push(`(${priceBounds.join(' OR ')})`);
      }
    }

    const baseWhere = conds.length ? and(...conds) : undefined;

    // Use subqueries directly in SQL for aggregation
    // Build variant filter SQL string
    const variantFilterSQL = variantFilterParts.length > 0
      ? ` AND ${variantFilterParts.join(' AND ')}`
      : '';

    // Simplified price aggregation - use direct subquery without variant filters first
    const priceAgg = variantFilterSQL
      ? {
          minPrice: sql<number | null>`(
            SELECT MIN(pv.price::numeric)
            FROM product_variants pv
            WHERE pv.product_id = ${products.id}
            ${sql.raw(variantFilterSQL)}
          )`,
          maxPrice: sql<number | null>`(
            SELECT MAX(pv.price::numeric)
            FROM product_variants pv
            WHERE pv.product_id = ${products.id}
            ${sql.raw(variantFilterSQL)}
          )`,
        }
      : {
          minPrice: sql<number | null>`(
            SELECT MIN(price::numeric)
            FROM product_variants
            WHERE product_id = ${products.id}
          )`,
          maxPrice: sql<number | null>`(
            SELECT MAX(price::numeric)
            FROM product_variants
            WHERE product_id = ${products.id}
          )`,
        };

    // Build image subquery
    const imageAgg = hasColor && filters.colorSlugs.length > 0
      ? sql<string | null>`(
          SELECT pi.url
          FROM product_images pi
          INNER JOIN product_variants pv ON pv.id = pi.variant_id
          WHERE pi.product_id = ${products.id}
          AND pv.color_id IN (
            SELECT id FROM colors WHERE slug = ANY(${sql.raw(`ARRAY[${filters.colorSlugs.map(s => `'${s.replace(/'/g, "''")}'`).join(',')}]`)})
          )
          ORDER BY pi.is_primary DESC, pi.sort_order ASC
          LIMIT 1
        )`
      : sql<string | null>`(
          SELECT url
          FROM product_images
          WHERE product_id = ${products.id}
          AND variant_id IS NULL
          ORDER BY is_primary DESC, sort_order ASC
          LIMIT 1
        )`;

    // Handle sorting: featured (default), newest, price_asc, price_desc, most_popular
    // For most_popular, we'll use review count (if reviews table exists) or fallback to createdAt
    let primaryOrder;
    if (filters.sort === "price_asc") {
      primaryOrder = asc(priceAgg.minPrice);
    } else if (filters.sort === "price_desc") {
      primaryOrder = desc(priceAgg.maxPrice);
    } else if (filters.sort === "most_popular") {
      // Sort by review count (most reviewed = most popular)
      // We'll use a subquery to count reviews per product
      const reviewCountAgg = sql<number>`(
        SELECT COUNT(*)::int
        FROM ${reviews}
        WHERE ${reviews.productId} = ${products.id}
      )`;
      primaryOrder = desc(reviewCountAgg);
    } else {
      // newest or featured (default)
      primaryOrder = desc(products.createdAt);
    }

    const page = Math.max(1, filters.page);
    const limit = Math.max(1, Math.min(filters.limit, 60));
    const offset = (page - 1) * limit;

    // First, try a simple query without subqueries to see if products exist
    const testRows = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.isPublished, true))
      .limit(5);
    
    console.log("[getAllProducts] Test query found", testRows.length, "published products");
    
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        createdAt: products.createdAt,
        subtitle: genders.label,
        brandName: brands.name,
        brandLogoUrl: brands.logoUrl,
        minPrice: priceAgg.minPrice,
        maxPrice: priceAgg.maxPrice,
        imageUrl: imageAgg,
      })
      .from(products)
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(baseWhere)
      .groupBy(products.id, products.name, products.createdAt, genders.id, genders.label, brands.id, brands.name, brands.logoUrl)
      .orderBy(primaryOrder, desc(products.createdAt), asc(products.id))
      .limit(limit)
      .offset(offset);
    
    console.log("[getAllProducts] Query executed, rows:", rows.length);
    // Optimize count query: Only join variant if we have variant filters
    const countBaseQuery = db
      .select({
        cnt: count(sql<number>`distinct ${products.id}`),
      })
      .from(products)
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId));

    // Count query
    const countRows = await countBaseQuery.where(baseWhere);

    const productsOut: ProductListItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl,
      minPrice: r.minPrice === null ? null : Number(r.minPrice),
      maxPrice: r.maxPrice === null ? null : Number(r.maxPrice),
      createdAt: r.createdAt,
      subtitle: r.subtitle ? `${r.subtitle} Shoes` : null,
      brandName: r.brandName ?? null,
      brandLogoUrl: r.brandLogoUrl ?? null,
    }));

    const totalCount = countRows[0]?.cnt ?? 0;

    console.log("[getAllProducts] Total count:", totalCount, "Products:", productsOut.length);

    return { products: productsOut, totalCount };
  } catch (error) {
    console.error("[getAllProducts] Error:", error);
    if (error instanceof Error) {
      console.error("[getAllProducts] Error message:", error.message);
      console.error("[getAllProducts] Error stack:", error.stack);
    }
    // Return empty result instead of throwing to prevent page crash
    return { products: [], totalCount: 0 };
  }
}

export type FullProduct = {
  product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
  };
  variants: Array<
    SelectVariant & {
      color?: SelectColor | null;
      size?: SelectSize | null;
    }
  >;
  images: SelectProductImage[];
};

export async function getProduct(productId: string): Promise<FullProduct | null> {
  try {
    // Validate productId is a valid UUID
    if (!productId || typeof productId !== 'string') {
      console.error("[getProduct] Invalid productId:", productId);
      return null;
    }

    console.log("[getProduct] Fetching product with ID:", productId);

    const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productBrandId: products.brandId,
      productCategoryId: products.categoryId,
      productGenderId: products.genderId,
      isPublished: products.isPublished,
      defaultVariantId: products.defaultVariantId,
      productAmazonUrl: products.amazonUrl,
      productCreatedAt: products.createdAt,
      productUpdatedAt: products.updatedAt,

      brandId: brands.id,
      brandName: brands.name,
      brandSlug: brands.slug,
      brandLogoUrl: brands.logoUrl,

      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,

      genderId: genders.id,
      genderLabel: genders.label,
      genderSlug: genders.slug,

      variantId: productVariants.id,
      variantSku: productVariants.sku,
      variantPrice: sql<number | null>`${productVariants.price}::numeric`,
      variantSalePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
      variantColorId: productVariants.colorId,
      variantSizeId: productVariants.sizeId,
      variantInStock: productVariants.inStock,
      variantWeight: productVariants.weight,
      variantDimensions: productVariants.dimensions,
      variantCreatedAt: productVariants.createdAt,

      colorId: colors.id,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHex: colors.hexCode,

      sizeId: sizes.id,
      sizeName: sizes.name,
      sizeSlug: sizes.slug,
      sizeSortOrder: sizes.sortOrder,

      imageId: productImages.id,
      imageUrl: productImages.url,
      imageIsPrimary: productImages.isPrimary,
      imageSortOrder: productImages.sortOrder,
      imageVariantId: productImages.variantId,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(colors, eq(colors.id, productVariants.colorId))
    .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.id, productId));

  if (!rows.length) return null;

  const head = rows[0];

  const product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
    amazonUrl?: string | null;
  } = {
    id: head.productId,
    name: head.productName,
    description: head.productDescription,
    brandId: head.productBrandId ?? null,
    categoryId: head.productCategoryId ?? null,
    genderId: head.productGenderId ?? null,
    isPublished: head.isPublished,
    defaultVariantId: head.defaultVariantId ?? null,
    amazonUrl: head.productAmazonUrl ?? null,
    createdAt: head.productCreatedAt,
    updatedAt: head.productUpdatedAt,
    brand: head.brandId
      ? {
          id: head.brandId,
          name: head.brandName ?? "Unknown Brand",
          slug: head.brandSlug ?? "",
          logoUrl: head.brandLogoUrl ?? null,
        }
      : null,
    category: head.categoryId
      ? {
          id: head.categoryId,
          name: head.categoryName ?? "Uncategorized",
          slug: head.categorySlug ?? "",
          parentId: null,
        }
      : null,
    gender: head.genderId
      ? {
          id: head.genderId,
          label: head.genderLabel ?? "Unisex",
          slug: head.genderSlug ?? "unisex",
        }
      : null,
  };

  const variantsMap = new Map<string, FullProduct["variants"][number]>();
  const imagesMap = new Map<string, SelectProductImage>();

  for (const r of rows) {
    if (r.variantId && !variantsMap.has(r.variantId)) {
      variantsMap.set(r.variantId, {
        id: r.variantId,
        productId: head.productId,
        sku: r.variantSku ?? "",
        price: r.variantPrice !== null ? String(r.variantPrice) : "0",
        salePrice: r.variantSalePrice !== null ? String(r.variantSalePrice) : null,
        colorId: r.variantColorId ?? "",
        sizeId: r.variantSizeId ?? "",
        inStock: r.variantInStock ?? 0,
        weight: r.variantWeight ?? null,
        dimensions: r.variantDimensions as { length?: number; width?: number; height?: number } | null,
        createdAt: r.variantCreatedAt ?? head.productCreatedAt,
        color: r.variantColorId
          ? {
              id: r.variantColorId,
              name: r.colorName ?? "Default",
              slug: r.colorSlug ?? "default",
              hexCode: r.colorHex ?? "#000000",
            }
          : null,
        size: r.variantSizeId
          ? {
              id: r.variantSizeId,
              name: r.sizeName ?? "Universal",
              slug: r.sizeSlug ?? "universal",
              sortOrder: r.sizeSortOrder ?? 0,
            }
          : null,
      });
    }
    if (r.imageId && !imagesMap.has(r.imageId)) {
      imagesMap.set(r.imageId, {
        id: r.imageId,
        productId: head.productId,
        variantId: r.imageVariantId ?? null,
        url: r.imageUrl ?? "",
        sortOrder: r.imageSortOrder ?? 0,
        isPrimary: r.imageIsPrimary ?? false,
      });
    }
  }

  return {
    product,
    variants: Array.from(variantsMap.values()),
    images: Array.from(imagesMap.values()),
  };
  } catch (error) {
    console.error("[getProduct] Error:", error);
    if (error instanceof Error) {
      console.error("[getProduct] Error message:", error.message);
      console.error("[getProduct] Error stack:", error.stack);
      // Check if it's a database connection error
      if (error.message.includes('Failed query')) {
        console.error("[getProduct] Database query failed. Check database connection and query syntax.");
      }
    }
    // Return null instead of throwing to prevent page crash
    return null;
  }
}
export type Review = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
};

export type RecommendedProduct = {
  id: string;
  title: string;
  price: number | null;
  imageUrl: string;
};

export async function getProductRating(productId: string): Promise<{ average: number; count: number } | null> {
  try {
    // First check if product has manual rating
    const [product] = await db
      .select({
        manualRating: products.manualRating,
        manualReviewCount: products.manualReviewCount,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    // If manual rating exists, use it
    if (product?.manualRating) {
      return {
        average: Number(product.manualRating),
        count: product.manualReviewCount ? Number(product.manualReviewCount) : 0,
      };
    }

    // Otherwise, calculate from actual reviews
    const result = await db
      .select({
        average: sql<number>`COALESCE(AVG(${reviews.rating})::numeric, 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    if (result.length === 0 || result[0].count === 0) {
      return null;
    }

    return {
      average: Number(result[0].average),
      count: Number(result[0].count),
    };
  } catch (error) {
    console.error("[getProductRating] Error:", error);
    return null;
  }
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerName: reviews.reviewerName,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(reviews)
    .leftJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    author: r.reviewerName?.trim() || r.authorName?.trim() || r.authorEmail || "Anonymous",
    rating: r.rating,
    title: undefined,
    content: r.comment || "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getAllProductReviews(productId: string): Promise<Review[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerName: reviews.reviewerName,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(reviews)
    .leftJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  return rows.map((r) => ({
    id: r.id,
    author: r.reviewerName?.trim() || r.authorName?.trim() || r.authorEmail || "Anonymous",
    rating: r.rating,
    title: undefined,
    content: r.comment || "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export type FeaturedReview = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  comment: string;
  order: number;
};

export async function getFeaturedReviews(productId: string): Promise<FeaturedReview[]> {
  try {
    const rows = await db
      .select({
        id: featuredReviews.id,
        firstName: featuredReviews.firstName,
        lastName: featuredReviews.lastName,
        rating: featuredReviews.rating,
        comment: featuredReviews.comment,
        order: featuredReviews.order,
      })
      .from(featuredReviews)
      .where(eq(featuredReviews.productId, productId))
      .orderBy(asc(featuredReviews.order))
      .limit(3);

    return rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      rating: r.rating,
      comment: r.comment,
      order: r.order,
    }));
  } catch (error) {
    console.error("[getFeaturedReviews] Error:", error);
    return [];
  }
}

export type PriceHistoryPoint = {
  date: string;
  price: number;
  salePrice?: number | null;
};

export async function getProductPriceHistory(productId: string, months: number = 12): Promise<PriceHistoryPoint[]> {
  try {
    console.log("[getProductPriceHistory] Fetching for productId:", productId);
    console.log("[getProductPriceHistory] Months:", months);
    
    // Tarih filtresini kaldırıp tüm kayıtları çekelim (test için)
    // const cutoffDate = new Date();
    // cutoffDate.setMonth(cutoffDate.getMonth() - months);
    // console.log("[getProductPriceHistory] Cutoff date:", cutoffDate);

    const rows = await db
      .select({
        price: priceHistory.price,
        salePrice: priceHistory.salePrice,
        recordedAt: priceHistory.recordedAt,
      })
      .from(priceHistory)
      .where(
        eq(priceHistory.productId, productId)
        // Tarih filtresini geçici olarak kaldırdık
        // and(
        //   eq(priceHistory.productId, productId),
        //   gte(priceHistory.recordedAt, cutoffDate)
        // )
      )
      .orderBy(asc(priceHistory.recordedAt));

    console.log("[getProductPriceHistory] Found rows:", rows.length);
    if (rows.length > 0) {
      console.log("[getProductPriceHistory] First row:", {
        price: rows[0].price,
        salePrice: rows[0].salePrice,
        recordedAt: rows[0].recordedAt,
      });
      console.log("[getProductPriceHistory] Last row:", {
        price: rows[rows.length - 1].price,
        salePrice: rows[rows.length - 1].salePrice,
        recordedAt: rows[rows.length - 1].recordedAt,
      });
    }

    const result = rows.map((r) => ({
      date: r.recordedAt.toISOString().split('T')[0],
      price: Number(r.price),
      salePrice: r.salePrice ? Number(r.salePrice) : null,
    }));

    console.log("[getProductPriceHistory] Mapped result count:", result.length);
    if (result.length > 0) {
      console.log("[getProductPriceHistory] First mapped:", result[0]);
      console.log("[getProductPriceHistory] Last mapped:", result[result.length - 1]);
    }
    
    return result;
  } catch (error) {
    console.error("[getProductPriceHistory] Error:", error);
    return [];
  }
}

export type TikTokVideoCard = {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  author?: string | null;
  duration?: number | null;
};

export async function getTikTokVideos(productId: string): Promise<TikTokVideoCard[]> {
  try {
    const { tiktokVideos } = await import('@/lib/db/schema/social-media');
    const rows = await db
      .select({
        id: tiktokVideos.id,
        videoUrl: tiktokVideos.videoUrl,
        thumbnailUrl: tiktokVideos.thumbnailUrl,
        title: tiktokVideos.title,
        author: tiktokVideos.author,
      })
      .from(tiktokVideos)
      .where(eq(tiktokVideos.productId, productId))
      .orderBy(asc(tiktokVideos.sortOrder))
      .limit(5);

    return rows.map((r) => ({
      id: r.id,
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl ?? undefined,
      title: r.title ?? undefined,
      author: r.author ?? undefined,
      duration: undefined, // Duration veritabanında yok, video'dan alınabilir
    }));
  } catch (error) {
    console.error("[getTikTokVideos] Error:", error);
    return [];
  }
}

export type YouTubeVideoCard = {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  author?: string;
};

export async function getYouTubeVideos(productId: string): Promise<YouTubeVideoCard[]> {
  try {
    const { youtubeVideos } = await import('@/lib/db/schema/social-media');
    const rows = await db
      .select({
        id: youtubeVideos.id,
        videoUrl: youtubeVideos.videoUrl,
        thumbnailUrl: youtubeVideos.thumbnailUrl,
        title: youtubeVideos.title,
        author: youtubeVideos.author,
      })
      .from(youtubeVideos)
      .where(eq(youtubeVideos.productId, productId))
      .orderBy(asc(youtubeVideos.sortOrder))
      .limit(5);

    return rows.map((r) => ({
      id: r.id,
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl ?? undefined,
      title: r.title ?? undefined,
      author: r.author ?? undefined,
    }));
  } catch (error) {
    console.error("[getYouTubeVideos] Error:", error);
    return [];
  }
}

export async function getAllBrands(): Promise<Array<{ id: string; name: string; slug: string }>> {
  try {
    const brandRows = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logoUrl: brands.logoUrl,
      })
      .from(brands)
      .orderBy(brands.name);
    
    return brandRows;
  } catch (error) {
    console.error("[getAllBrands] Error:", error);
    return [];
  }
}

export async function getAllCategories(genderSlugs?: string[]): Promise<Array<{ id: string; name: string; slug: string }>> {
  try {
    // Priority categories that should appear at the top
    const priorityCategories = ['sneakers', 'boots', 'sports-and-outdoor-shoes'];
    
    // If gender is specified, only return categories that have products for that gender
    if (genderSlugs && genderSlugs.length > 0) {
      // Get gender IDs
      const genderResults = await db
        .select({ id: genders.id })
        .from(genders)
        .where(inArray(genders.slug, genderSlugs));
      const genderIds = genderResults.map(g => g.id);
      
      if (genderIds.length > 0) {
        // Get distinct categories that have products for the selected gender(s)
        const categoryRows = await db
          .selectDistinct({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          })
          .from(categories)
          .innerJoin(products, eq(products.categoryId, categories.id))
          .where(and(
            eq(products.isPublished, true),
            inArray(products.genderId, genderIds)
          ));
        
        // Sort: priority categories first, then alphabetically
        const sorted = categoryRows.sort((a, b) => {
          const aPriority = priorityCategories.indexOf(a.slug);
          const bPriority = priorityCategories.indexOf(b.slug);
          
          // Both are priority categories - maintain priority order
          if (aPriority !== -1 && bPriority !== -1) {
            return aPriority - bPriority;
          }
          // Only a is priority
          if (aPriority !== -1) return -1;
          // Only b is priority
          if (bPriority !== -1) return 1;
          // Neither is priority - sort alphabetically
          return a.name.localeCompare(b.name);
        });
        
        console.log("[getAllCategories] Found categories for gender(s):", genderSlugs, "->", sorted.length, sorted.map(c => c.name));
        return sorted;
      }
    }
    
    // If no gender specified, return all categories
    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories);
    
    // Sort: priority categories first, then alphabetically
    const sorted = categoryRows.sort((a, b) => {
      const aPriority = priorityCategories.indexOf(a.slug);
      const bPriority = priorityCategories.indexOf(b.slug);
      
      // Both are priority categories - maintain priority order
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      // Only a is priority
      if (aPriority !== -1) return -1;
      // Only b is priority
      if (bPriority !== -1) return 1;
      // Neither is priority - sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    console.log("[getAllCategories] Found all categories:", sorted.length, sorted.map(c => c.name));
    return sorted;
  } catch (error) {
    console.error("[getAllCategories] Error:", error);
    return [];
  }
}

export async function getRecommendedProducts(productId: string): Promise<RecommendedProduct[]> {
  const base = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      brandId: products.brandId,
      genderId: products.genderId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!base.length) return [];
  const b = base[0];

  const v = db
    .select({
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("price"),
    })
    .from(productVariants)
    .as("v");

  const pi = db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      rn: sql<number>`row_number() over (partition by ${productImages.productId} order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc)`.as(
        "rn",
      ),
    })
    .from(productImages)
    .as("pi");

  const priority = sql<number>`
    (case when ${products.categoryId} is not null and ${products.categoryId} = ${b.categoryId} then 1 else 0 end) * 3 +
    (case when ${products.brandId} is not null and ${products.brandId} = ${b.brandId} then 1 else 0 end) * 2 +
    (case when ${products.genderId} is not null and ${products.genderId} = ${b.genderId} then 1 else 0 end) * 1
  `;

  const rows = await db
    .select({
      id: products.id,
      title: products.name,
      minPrice: sql<number | null>`min(${v.price})`,
      imageUrl: sql<string | null>`max(case when ${pi.rn} = 1 then ${pi.url} else null end)`,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(v, eq(v.productId, products.id))
    .leftJoin(pi, eq(pi.productId, products.id))
    .where(and(eq(products.isPublished, true), sql`${products.id} <> ${productId}`))
    .groupBy(products.id, products.name, products.createdAt)
    .orderBy(
      desc(priority),
      desc(products.createdAt),
      asc(products.id)
    )
    .limit(8);

  const out: RecommendedProduct[] = [];
  for (const r of rows) {
    const img = r.imageUrl?.trim();
    // Skip products with invalid/missing images
    if (!img || img.length === 0) continue;
    
    out.push({
      id: r.id,
      title: r.title,
      price: r.minPrice === null ? null : Number(r.minPrice),
      imageUrl: img,
    });
    
    // Limit to 4-6 products
    if (out.length >= 6) break;
  }
  
  // Return at least 4 if available, otherwise return all
  return out.length >= 4 ? out.slice(0, 6) : out;
}
