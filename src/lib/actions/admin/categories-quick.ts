"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema/categories";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { insertCategorySchema } from "@/lib/db/schema/categories";

export async function createCategoryQuick(data: z.infer<typeof insertCategorySchema>) {
  await requireEditor();

  const validated = insertCategorySchema.parse(data);

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

  const [newCategory] = await db.insert(categories).values({ ...validated, slug }).returning();

  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/products");

  return { success: true, category: newCategory };
}

