"use server";

import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema/reviews";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { insertReviewSchema } from "@/lib/db/schema/reviews";

export async function createReview(data: z.infer<typeof insertReviewSchema>) {
  await requireEditor();

  const validated = insertReviewSchema.parse(data);

  await db.insert(reviews).values({
    ...validated,
    createdAt: validated.createdAt || new Date(),
  });

  revalidatePath(`/admin/products/${validated.productId}/edit`);
  revalidatePath(`/products/${validated.productId}`);

  return { success: true };
}

export async function deleteReview(id: string) {
  await requireEditor();

  const [review] = await db
    .select({ productId: reviews.productId })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);

  await db.delete(reviews).where(eq(reviews.id, id));

  if (review) {
    revalidatePath(`/admin/products/${review.productId}/edit`);
    revalidatePath(`/products/${review.productId}`);
  }

  return { success: true };
}
