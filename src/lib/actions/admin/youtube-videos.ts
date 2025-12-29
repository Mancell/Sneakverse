"use server";

import { db } from "@/lib/db";
import { youtubeVideos } from "@/lib/db/schema/social-media";
import { products } from "@/lib/db/schema/index";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq, ilike, or, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { insertYouTubeVideoSchema } from "@/lib/db/schema/social-media";

const createYouTubeVideoSchema = insertYouTubeVideoSchema.omit({
  createdAt: true,
  updatedAt: true,
});

const updateYouTubeVideoSchema = createYouTubeVideoSchema.partial().extend({
  id: z.string().uuid(),
});

export async function getAdminYouTubeVideos(params: {
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
        ilike(youtubeVideos.title, `%${search}%`),
        ilike(youtubeVideos.author, `%${search}%`),
        ilike(youtubeVideos.videoUrl, `%${search}%`)
      )!
    );
  }

  if (productId) {
    conditions.push(eq(youtubeVideos.productId, productId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [videoList, totalResult] = await Promise.all([
    db
      .select({
        id: youtubeVideos.id,
        productId: youtubeVideos.productId,
        videoUrl: youtubeVideos.videoUrl,
        thumbnailUrl: youtubeVideos.thumbnailUrl,
        title: youtubeVideos.title,
        author: youtubeVideos.author,
        sortOrder: youtubeVideos.sortOrder,
        createdAt: youtubeVideos.createdAt,
        updatedAt: youtubeVideos.updatedAt,
        product: {
          id: products.id,
          name: products.name,
        },
      })
      .from(youtubeVideos)
      .leftJoin(products, eq(youtubeVideos.productId, products.id))
      .where(whereClause)
      .orderBy(desc(youtubeVideos.sortOrder), desc(youtubeVideos.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(youtubeVideos)
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

export async function getYouTubeVideoForEdit(id: string) {
  await requireEditor();

  const [video] = await db
    .select()
    .from(youtubeVideos)
    .where(eq(youtubeVideos.id, id))
    .limit(1);

  return video || null;
}

export async function createYouTubeVideo(data: z.infer<typeof createYouTubeVideoSchema>) {
  await requireEditor();

  const validated = createYouTubeVideoSchema.parse(data);

  const [newVideo] = await db
    .insert(youtubeVideos)
    .values({
      ...validated,
      sortOrder: validated.sortOrder ?? 0,
    })
    .returning();

  revalidatePath("/admin/youtube-videos");
  revalidatePath(`/products/${validated.productId}`);

  return { success: true, videoId: newVideo.id };
}

export async function updateYouTubeVideo(data: z.infer<typeof updateYouTubeVideoSchema>) {
  await requireEditor();

  const { id, ...updateData } = updateYouTubeVideoSchema.parse(data);

  const [updated] = await db
    .update(youtubeVideos)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(youtubeVideos.id, id))
    .returning();

  revalidatePath("/admin/youtube-videos");
  if (updated.productId) {
    revalidatePath(`/products/${updated.productId}`);
  }

  return { success: true, videoId: updated.id };
}

export async function deleteYouTubeVideo(id: string) {
  await requireEditor();

  const [video] = await db
    .select({ productId: youtubeVideos.productId })
    .from(youtubeVideos)
    .where(eq(youtubeVideos.id, id))
    .limit(1);

  await db.delete(youtubeVideos).where(eq(youtubeVideos.id, id));

  revalidatePath("/admin/youtube-videos");
  if (video?.productId) {
    revalidatePath(`/products/${video.productId}`);
  }

  return { success: true };
}

