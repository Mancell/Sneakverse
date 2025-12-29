"use server";

import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brands";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { insertBrandSchema } from "@/lib/db/schema/brands";

export async function createBrand(data: z.infer<typeof insertBrandSchema>) {
  await requireEditor();

  const validated = insertBrandSchema.parse(data);

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
    .from(brands)
    .where(eq(brands.slug, slug))
    .limit(1);

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const [newBrand] = await db.insert(brands).values({ ...validated, slug }).returning();

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return { success: true, brand: newBrand };
}

