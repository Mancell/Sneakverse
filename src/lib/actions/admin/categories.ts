"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema/index";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq, ilike, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { insertCategorySchema } from "@/lib/db/schema/categories";

const createCategorySchema = insertCategorySchema;
const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export async function getAdminCategories(params?: {
  search?: string;
  parentId?: string;
}) {
  await requireEditor();

  const { search = "", parentId } = params || {};
  const conditions = [];

  if (search) {
    conditions.push(ilike(categories.name, `%${search}%`));
  }

  if (parentId !== undefined) {
    if (parentId === null) {
      conditions.push(eq(categories.parentId, null as any));
    } else {
      conditions.push(eq(categories.parentId, parentId));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const categoryList = await db
    .select()
    .from(categories)
    .where(whereClause)
    .orderBy(desc(categories.name));

  // Build hierarchical structure
  const categoryMap = new Map(categoryList.map((cat) => [cat.id, { ...cat, children: [] }]));
  const rootCategories: typeof categoryList = [];

  for (const category of categoryList) {
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(categoryMap.get(category.id)!);
      }
    } else {
      rootCategories.push(categoryMap.get(category.id)!);
    }
  }

  return {
    categories: categoryList,
    hierarchical: rootCategories,
  };
}

export async function getCategoryForEdit(id: string) {
  await requireEditor();

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return category || null;
}

export async function createCategory(data: z.infer<typeof createCategorySchema>) {
  await requireEditor();

  const validated = createCategorySchema.parse(data);

  // Generate slug if not provided
  let slug = validated.slug;
  if (!slug) {
    slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Check if slug exists
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  // Prevent circular reference
  if (validated.parentId === validated.id) {
    throw new Error("Category cannot be its own parent");
  }

  const [newCategory] = await db.insert(categories).values({ ...validated, slug }).returning();

  revalidatePath("/admin/categories");
  revalidatePath("/products");

  return { success: true, categoryId: newCategory.id };
}

export async function updateCategory(data: z.infer<typeof updateCategorySchema>) {
  await requireEditor();

  const { id, ...updateData } = updateCategorySchema.parse(data);

  // Prevent circular reference
  if (updateData.parentId === id) {
    throw new Error("Category cannot be its own parent");
  }

  // If slug is being updated, check for uniqueness
  if (updateData.slug) {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, updateData.slug))
      .limit(1);

    if (existing && existing.id !== id) {
      throw new Error("Slug already exists");
    }
  }

  await db.update(categories).set(updateData).where(eq(categories.id, id));

  revalidatePath("/admin/categories");
  revalidatePath("/products");

  return { success: true, categoryId: id };
}

export async function deleteCategory(id: string) {
  await requireEditor();

  // Check if category has children
  const [children] = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories)
    .where(eq(categories.parentId, id));

  if (Number(children.count) > 0) {
    throw new Error("Cannot delete category with child categories. Please delete or move children first.");
  }

  // Check if category has products
  const { products } = await import("@/lib/db/schema/index");
  const [productCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.categoryId, id));

  if (Number(productCount.count) > 0) {
    throw new Error("Cannot delete category with associated products. Please reassign products first.");
  }

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath("/admin/categories");
  revalidatePath("/products");

  return { success: true };
}

