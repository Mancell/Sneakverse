import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';

export const featuredReviews = pgTable('featured_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  order: integer('order').notNull(), // 1, 2, or 3
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const featuredReviewsRelations = relations(featuredReviews, ({ one }) => ({
  product: one(products, {
    fields: [featuredReviews.productId],
    references: [products.id],
  }),
}));

export const insertFeaturedReviewSchema = z.object({
  productId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  order: z.number().int().min(1).max(3),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const selectFeaturedReviewSchema = insertFeaturedReviewSchema.extend({
  id: z.string().uuid(),
});

export type InsertFeaturedReview = z.infer<typeof insertFeaturedReviewSchema>;
export type SelectFeaturedReview = z.infer<typeof selectFeaturedReviewSchema>;

