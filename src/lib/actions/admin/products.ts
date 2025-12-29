"use server";

import { db } from "@/lib/db";
import { products, productVariants, productImages } from "@/lib/db/schema/index";
import { brands, categories } from "@/lib/db/schema/index";
import { genders } from "@/lib/db/schema/filters/genders";
import { colors } from "@/lib/db/schema/filters/colors";
import { sizes } from "@/lib/db/schema/filters/sizes";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq, ilike, or, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { insertProductSchema } from "@/lib/db/schema/products";
import { insertVariantSchema } from "@/lib/db/schema/variants";
import { insertProductImageSchema } from "@/lib/db/schema/images";

const createProductSchema = insertProductSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  variant: insertVariantSchema.omit({ productId: true }),
  imageUrl: z.string().optional().nullable(),
});

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

export async function getAdminProducts(params: {
  search?: string;
  brandId?: string;
  categoryId?: string;
  genderId?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}) {
  await requireEditor();

  const {
    search = "",
    brandId,
    categoryId,
    genderId,
    isPublished,
    page = 1,
    limit = 20,
  } = params;

  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  if (brandId) {
    conditions.push(eq(products.brandId, brandId));
  }

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (genderId) {
    conditions.push(eq(products.genderId, genderId));
  }

  if (isPublished !== undefined) {
    conditions.push(eq(products.isPublished, isPublished));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [productList, totalResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause),
  ]);

  return {
    products: productList,
    total: Number(totalResult[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
  };
}

export async function getProductForEdit(id: string) {
  await requireEditor();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    return null;
  }

  const { tiktokVideos, youtubeVideos } = await import("@/lib/db/schema/social-media");
  const { priceHistory } = await import("@/lib/db/schema/price-history");
  const { reviews } = await import("@/lib/db/schema/index");

  const [variants, images, videos, youtubeVideosList, priceHistoryList, reviewsList] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(productVariants.createdAt),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder),
    db
      .select()
      .from(tiktokVideos)
      .where(eq(tiktokVideos.productId, id))
      .orderBy(tiktokVideos.sortOrder),
    db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.productId, id))
      .orderBy(youtubeVideos.sortOrder),
    db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, id))
      .orderBy(desc(priceHistory.recordedAt)),
    db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, id))
      .orderBy(desc(reviews.createdAt)),
  ]);

  // Manual rating ve review count'u form için doğru formata çevir
  const formattedProduct = {
    ...product,
    // manualRating numeric'ten string'e çevir (form için)
    manualRating: product.manualRating !== null && product.manualRating !== undefined
      ? String(product.manualRating)
      : null,
    // manualReviewCount zaten number, olduğu gibi bırak
    manualReviewCount: product.manualReviewCount,
  };

  return {
    product: formattedProduct,
    variants,
    images,
    videos,
    youtubeVideos: youtubeVideosList,
    priceHistory: priceHistoryList,
    reviews: reviewsList,
  };
}

export async function getFormData() {
  await requireEditor();

  const [brandsList, categoriesList, gendersList, colorsList, sizesList] = await Promise.all([
    db.select().from(brands).orderBy(brands.name),
    db.select().from(categories).orderBy(categories.name),
    db.select().from(genders).orderBy(genders.label),
    db.select().from(colors).orderBy(colors.name),
    db.select().from(sizes).orderBy(sizes.name),
  ]);

  return {
    brands: brandsList,
    categories: categoriesList,
    genders: gendersList,
    colors: colorsList,
    sizes: sizesList,
  };
}

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  await requireEditor();

  const validated = createProductSchema.parse(data);

  // Manual rating ve review count'u doğru şekilde işle
  let processedManualRating: string | null = null;
  if (validated.manualRating !== null && validated.manualRating !== undefined && validated.manualRating !== "") {
    const ratingValue = typeof validated.manualRating === 'string' 
      ? validated.manualRating.trim() 
      : String(validated.manualRating);
    if (ratingValue !== "") {
      const numericRating = parseFloat(ratingValue);
      processedManualRating = isNaN(numericRating) ? null : String(numericRating);
    }
  }

  let processedManualReviewCount: number | null = null;
  if (validated.manualReviewCount !== null && validated.manualReviewCount !== undefined) {
    const countValue = typeof validated.manualReviewCount === 'string'
      ? parseInt(validated.manualReviewCount.trim())
      : validated.manualReviewCount;
    processedManualReviewCount = (isNaN(countValue) || countValue < 0) ? null : countValue;
  }

  const newProduct = await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        name: validated.name,
        description: validated.description,
        brandId: validated.brandId,
        categoryId: validated.categoryId,
        genderId: validated.genderId,
        isPublished: validated.isPublished,
        amazonUrl: validated.amazonUrl,
        manualRating: processedManualRating,
        manualReviewCount: processedManualReviewCount,
      })
      .returning();

    if (!product) {
      tx.rollback();
      throw new Error("Failed to create product");
    }

    const [variant] = await tx
      .insert(productVariants)
      .values({
        productId: product.id,
        sku: validated.variant.sku,
        price: validated.variant.price,
        salePrice: validated.variant.salePrice,
        colorId: validated.variant.colorId,
        sizeId: validated.variant.sizeId,
        inStock: validated.variant.inStock ?? 0,
        weight: validated.variant.weight,
        dimensions: validated.variant.dimensions,
      })
      .returning();

    if (!variant) {
      tx.rollback();
      throw new Error("Failed to create product variant");
    }

    // Set the default variant ID for the product
    await tx
      .update(products)
      .set({ defaultVariantId: variant.id })
      .where(eq(products.id, product.id));

    if (validated.imageUrl) {
      await tx.insert(productImages).values({
        productId: product.id,
        variantId: variant.id,
        url: validated.imageUrl,
        isPrimary: true,
        sortOrder: 0,
      });
    }

    return product;
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${newProduct.id}`);

  return { success: true, productId: newProduct.id };
}

export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  await requireEditor();

  const { id, variant, imageUrl, ...updateData } = updateProductSchema.parse(data);

  // Manual rating ve review count'u doğru şekilde işle
  const processedData: any = { ...updateData };
  
  // Manual rating: string'den numeric'e çevir veya null yap
  if (processedData.manualRating !== undefined) {
    if (processedData.manualRating === null || processedData.manualRating === "" || processedData.manualRating === undefined) {
      processedData.manualRating = null;
    } else {
      // String'i numeric'e çevir
      const ratingValue = typeof processedData.manualRating === 'string' 
        ? processedData.manualRating.trim() 
        : processedData.manualRating;
      if (ratingValue === "" || ratingValue === null) {
        processedData.manualRating = null;
      } else {
        const numericRating = parseFloat(String(ratingValue));
        processedData.manualRating = isNaN(numericRating) ? null : String(numericRating);
      }
    }
  }
  
  // Manual review count: number veya null
  if (processedData.manualReviewCount !== undefined) {
    if (processedData.manualReviewCount === null || processedData.manualReviewCount === "" || processedData.manualReviewCount === undefined) {
      processedData.manualReviewCount = null;
    } else {
      const countValue = typeof processedData.manualReviewCount === 'string'
        ? parseInt(processedData.manualReviewCount.trim())
        : processedData.manualReviewCount;
      processedData.manualReviewCount = (isNaN(countValue) || countValue < 0) ? null : countValue;
    }
  }

  await db
    .update(products)
    .set({
      ...processedData,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath(`/products/${id}`);

  return { success: true, productId: id };
}

export async function deleteProduct(id: string) {
  await requireEditor();

  await db.delete(products).where(eq(products.id, id));

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return { success: true };
}

export async function toggleProductPublish(id: string) {
  await requireEditor();

  const [product] = await db
    .select({ isPublished: products.isPublished })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    throw new Error("Product not found");
  }

  const [updated] = await db
    .update(products)
    .set({
      isPublished: !product.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  revalidatePath("/admin/products");
  revalidatePath(`/products/${updated.id}`);

  return { success: true, isPublished: updated.isPublished };
}

// Variant Management
export async function createVariant(data: z.infer<typeof insertVariantSchema>) {
  await requireEditor();

  const validated = insertVariantSchema.parse(data);

  // Check if SKU already exists
  const [existing] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.sku, validated.sku))
    .limit(1);

  if (existing) {
    throw new Error("SKU already exists");
  }

  const [variant] = await db
    .insert(productVariants)
    .values({
      ...validated,
      inStock: validated.inStock ?? 0,
    })
    .returning();

  revalidatePath(`/admin/products/${validated.productId}/edit`);
  revalidatePath(`/products/${validated.productId}`);

  return { success: true, variantId: variant.id };
}

export async function updateVariant(
  id: string,
  data: Partial<z.infer<typeof insertVariantSchema>>
) {
  await requireEditor();

  // If SKU is being updated, check for uniqueness
  if (data.sku) {
    const [existing] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.sku, data.sku))
      .limit(1);

    if (existing && existing.id !== id) {
      throw new Error("SKU already exists");
    }
  }

  await db
    .update(productVariants)
    .set(data)
    .where(eq(productVariants.id, id));

  const [variant] = await db
    .select({ productId: productVariants.productId })
    .from(productVariants)
    .where(eq(productVariants.id, id))
    .limit(1);

  if (variant) {
    revalidatePath(`/admin/products/${variant.productId}/edit`);
    revalidatePath(`/products/${variant.productId}`);
  }

  return { success: true };
}

export async function deleteVariant(id: string) {
  await requireEditor();

  const [variant] = await db
    .select({ productId: productVariants.productId })
    .from(productVariants)
    .where(eq(productVariants.id, id))
    .limit(1);

  await db.delete(productVariants).where(eq(productVariants.id, id));

  if (variant) {
    revalidatePath(`/admin/products/${variant.productId}/edit`);
    revalidatePath(`/products/${variant.productId}`);
  }

  return { success: true };
}

// Image Management
export async function createImage(data: z.infer<typeof insertProductImageSchema>) {
  await requireEditor();

  const validated = insertProductImageSchema.parse(data);

  // If this is set as primary, unset other primary images
  if (validated.isPrimary) {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, validated.productId));
  }

  const [image] = await db.insert(productImages).values(validated).returning();

  revalidatePath(`/admin/products/${validated.productId}/edit`);
  revalidatePath(`/products/${validated.productId}`);

  return { success: true, imageId: image.id };
}

export async function deleteImage(id: string) {
  await requireEditor();

  const [image] = await db
    .select({ productId: productImages.productId })
    .from(productImages)
    .where(eq(productImages.id, id))
    .limit(1);

  await db.delete(productImages).where(eq(productImages.id, id));

  if (image) {
    revalidatePath(`/admin/products/${image.productId}/edit`);
    revalidatePath(`/products/${image.productId}`);
  }

  return { success: true };
}

export async function setPrimaryImage(id: string) {
  await requireEditor();

  const [image] = await db
    .select({ productId: productImages.productId })
    .from(productImages)
    .where(eq(productImages.id, id))
    .limit(1);

  if (!image) {
    throw new Error("Image not found");
  }

  // Unset all primary images for this product
  await db
    .update(productImages)
    .set({ isPrimary: false })
    .where(eq(productImages.productId, image.productId));

  // Set this image as primary
  await db
    .update(productImages)
    .set({ isPrimary: true })
    .where(eq(productImages.id, id));

  revalidatePath(`/admin/products/${image.productId}/edit`);
  revalidatePath(`/products/${image.productId}`);

  return { success: true };
}

export async function updateImageSortOrder(updates: { id: string; sortOrder: number }[]) {
  await requireEditor();

  await db.transaction(async (tx) => {
    for (const update of updates) {
      await tx
        .update(productImages)
        .set({ sortOrder: update.sortOrder })
        .where(eq(productImages.id, update.id));
    }
  });

  if (updates.length > 0) {
    const [firstImage] = await db
      .select({ productId: productImages.productId })
      .from(productImages)
      .where(eq(productImages.id, updates[0].id))
      .limit(1);

    if (firstImage) {
      revalidatePath(`/admin/products/${firstImage.productId}/edit`);
      revalidatePath(`/products/${firstImage.productId}`);
    }
  }

  return { success: true };
}

