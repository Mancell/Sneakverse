"use server";

import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema/blog";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq, ilike, or, desc, asc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { insertBlogPostSchema } from "@/lib/db/schema/blog";

const createBlogPostSchema = insertBlogPostSchema.omit({
  createdAt: true,
  updatedAt: true,
});

const updateBlogPostSchema = createBlogPostSchema.partial().extend({
  id: z.string().uuid(),
});

export async function getAdminBlogPosts(params: {
  search?: string;
  category?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "date" | "title";
  sortOrder?: "asc" | "desc";
}) {
  await requireEditor();

  const {
    search = "",
    category,
    isPublished,
    page = 1,
    limit = 20,
    sortBy = "date",
    sortOrder = "desc",
  } = params;

  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(blogPosts.title, `%${search}%`),
        ilike(blogPosts.excerpt, `%${search}%`),
        ilike(blogPosts.slug, `%${search}%`)
      )!
    );
  }

  if (category) {
    conditions.push(eq(blogPosts.category, category));
  }

  if (isPublished !== undefined) {
    conditions.push(eq(blogPosts.isPublished, isPublished));
  }

  const whereClause = conditions.length > 0 ? conditions : undefined;

  // Sort
  const orderBy =
    sortBy === "title"
      ? sortOrder === "asc"
        ? asc(blogPosts.title)
        : desc(blogPosts.title)
      : sortOrder === "asc"
      ? asc(blogPosts.date)
      : desc(blogPosts.date);

  const [posts, totalResult] = await Promise.all([
    db
      .select()
      .from(blogPosts)
      .where(whereClause ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(whereClause ? and(...conditions) : undefined),
  ]);

  return {
    posts,
    total: Number(totalResult[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
  };
}

export async function getBlogPostForEdit(id: string) {
  await requireEditor();

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  return post || null;
}

export async function createBlogPost(data: z.infer<typeof createBlogPostSchema>) {
  await requireEditor();

  const validated = createBlogPostSchema.parse(data);

  // Generate slug if not provided
  let slug = validated.slug;
  if (!slug) {
    slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Check if slug exists
  const [existing] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const [newPost] = await db
    .insert(blogPosts)
    .values({
      ...validated,
      slug,
      date: validated.date || new Date(),
      isPublished: validated.isPublished ?? false,
    })
    .returning();

  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return { success: true, postId: newPost.id };
}

export async function updateBlogPost(data: z.infer<typeof updateBlogPostSchema>) {
  await requireEditor();

  const { id, ...updateData } = updateBlogPostSchema.parse(data);

  // If slug is being updated, check for uniqueness
  if (updateData.slug) {
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, updateData.slug))
      .limit(1);

    if (existing && existing.id !== id) {
      throw new Error("Slug already exists");
    }
  }

  const [updated] = await db
    .update(blogPosts)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id))
    .returning();

  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${updated.slug}`);
  revalidatePath("/blog");

  return { success: true, postId: updated.id };
}

export async function deleteBlogPost(id: string) {
  await requireEditor();

  await db.delete(blogPosts).where(eq(blogPosts.id, id));

  revalidatePath("/admin/blog");
  revalidatePath("/blog");

  return { success: true };
}

export async function toggleBlogPublish(id: string) {
  await requireEditor();

  const [post] = await db
    .select({ isPublished: blogPosts.isPublished })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  if (!post) {
    throw new Error("Blog post not found");
  }

  const [updated] = await db
    .update(blogPosts)
    .set({
      isPublished: !post.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id))
    .returning();

  revalidatePath("/admin/blog");
  revalidatePath(`/blog/${updated.slug}`);
  revalidatePath("/blog");

  return { success: true, isPublished: updated.isPublished };
}

