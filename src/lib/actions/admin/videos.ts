"use server";

import { db } from "@/lib/db";
import { tiktokVideos } from "@/lib/db/schema/social-media";
import { products } from "@/lib/db/schema/index";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq, ilike, or, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { insertTikTokVideoSchema } from "@/lib/db/schema/social-media";

const createVideoSchema = insertTikTokVideoSchema.omit({
  createdAt: true,
  updatedAt: true,
});

const updateVideoSchema = createVideoSchema.partial().extend({
  id: z.string().uuid(),
});

export async function getAdminVideos(params: {
  search?: string;
  productId?: string;
  page?: number;
  limit?: number;
}) {
  await requireEditor();

  const { search = "", productId, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(tiktokVideos.title, `%${search}%`),
        ilike(tiktokVideos.author, `%${search}%`),
        ilike(tiktokVideos.videoUrl, `%${search}%`)
      )!
    );
  }

  if (productId) {
    conditions.push(eq(tiktokVideos.productId, productId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [videoList, totalResult] = await Promise.all([
    db
      .select({
        id: tiktokVideos.id,
        productId: tiktokVideos.productId,
        videoUrl: tiktokVideos.videoUrl,
        thumbnailUrl: tiktokVideos.thumbnailUrl,
        title: tiktokVideos.title,
        author: tiktokVideos.author,
        sortOrder: tiktokVideos.sortOrder,
        createdAt: tiktokVideos.createdAt,
        updatedAt: tiktokVideos.updatedAt,
        product: {
          id: products.id,
          name: products.name,
        },
      })
      .from(tiktokVideos)
      .leftJoin(products, eq(tiktokVideos.productId, products.id))
      .where(whereClause)
      .orderBy(desc(tiktokVideos.sortOrder), desc(tiktokVideos.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tiktokVideos)
      .where(whereClause),
  ]);

  return {
    videos: videoList,
    total: Number(totalResult[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
  };
}

export async function getVideoForEdit(id: string) {
  await requireEditor();

  const [video] = await db
    .select()
    .from(tiktokVideos)
    .where(eq(tiktokVideos.id, id))
    .limit(1);

  return video || null;
}

export async function createVideo(data: z.infer<typeof createVideoSchema>) {
  await requireEditor();

  const validated = createVideoSchema.parse(data);

  const [newVideo] = await db
    .insert(tiktokVideos)
    .values({
      ...validated,
      sortOrder: validated.sortOrder ?? 0,
    })
    .returning();

  revalidatePath("/admin/videos");
  revalidatePath(`/products/${validated.productId}`);

  return { success: true, videoId: newVideo.id };
}

export async function updateVideo(data: z.infer<typeof updateVideoSchema>) {
  await requireEditor();

  const { id, ...updateData } = updateVideoSchema.parse(data);

  const [updated] = await db
    .update(tiktokVideos)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(tiktokVideos.id, id))
    .returning();

  revalidatePath("/admin/videos");
  if (updated.productId) {
    revalidatePath(`/products/${updated.productId}`);
  }

  return { success: true, videoId: updated.id };
}

export async function deleteVideo(id: string) {
  await requireEditor();

  const [video] = await db
    .select({ productId: tiktokVideos.productId })
    .from(tiktokVideos)
    .where(eq(tiktokVideos.id, id))
    .limit(1);

  await db.delete(tiktokVideos).where(eq(tiktokVideos.id, id));

  revalidatePath("/admin/videos");
  if (video?.productId) {
    revalidatePath(`/products/${video.productId}`);
  }

  return { success: true };
}
