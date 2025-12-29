"use server";

import { db } from "@/lib/db";
import { priceHistory } from "@/lib/db/schema/price-history";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { insertPriceHistorySchema } from "@/lib/db/schema/price-history";

export async function createPriceHistory(data: z.infer<typeof insertPriceHistorySchema>) {
  await requireEditor();

  const validated = insertPriceHistorySchema.parse(data);

  await db.insert(priceHistory).values({
    ...validated,
    recordedAt: validated.recordedAt || new Date(),
  });

  revalidatePath(`/admin/products/${validated.productId}/edit`);
  revalidatePath(`/products/${validated.productId}`);

  return { success: true };
}

export async function deletePriceHistory(id: string) {
  await requireEditor();

  const [entry] = await db
    .select({ productId: priceHistory.productId })
    .from(priceHistory)
    .where(eq(priceHistory.id, id))
    .limit(1);

  await db.delete(priceHistory).where(eq(priceHistory.id, id));

  if (entry) {
    revalidatePath(`/admin/products/${entry.productId}/edit`);
    revalidatePath(`/products/${entry.productId}`);
  }

  return { success: true };
}
