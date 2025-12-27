import { pgTable, text, timestamp, uuid, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';

export const priceHistory = pgTable('price_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, {
    fields: [priceHistory.productId],
    references: [products.id],
  }),
}));

export const insertPriceHistorySchema = z.object({
  productId: z.string().uuid(),
  price: z.string(),
  salePrice: z.string().optional().nullable(),
  recordedAt: z.date().optional(),
});
export const selectPriceHistorySchema = insertPriceHistorySchema.extend({
  id: z.string().uuid(),
});
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type SelectPriceHistory = z.infer<typeof selectPriceHistorySchema>;

