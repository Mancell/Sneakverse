import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';

// TikTok Videos Table
export const tiktokVideos = pgTable('tiktok_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  title: text('title'),
  author: text('author'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tiktokVideosRelations = relations(tiktokVideos, ({ one }) => ({
  product: one(products, {
    fields: [tiktokVideos.productId],
    references: [products.id],
  }),
}));

export const insertTikTokVideoSchema = z.object({
  productId: z.string().uuid(),
  videoUrl: z.string().refine(
    (val) => {
      // URL formatı (http/https ile başlayan) veya relative path (/) ile başlayan
      return z.string().url().safeParse(val).success || val.startsWith('/');
    },
    { message: "Must be a valid URL or a relative path starting with /" }
  ),
  thumbnailUrl: z.string().refine(
    (val) => {
      if (!val) return true; // null/undefined ise geçerli
      return z.string().url().safeParse(val).success || val.startsWith('/');
    },
    { message: "Must be a valid URL or a relative path starting with /" }
  ).optional().nullable(),
  title: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const selectTikTokVideoSchema = insertTikTokVideoSchema.extend({
  id: z.string().uuid(),
});

export type InsertTikTokVideo = z.infer<typeof insertTikTokVideoSchema>;
export type SelectTikTokVideo = z.infer<typeof selectTikTokVideoSchema>;

// YouTube Videos Table
export const youtubeVideos = pgTable('youtube_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  title: text('title'),
  author: text('author'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const youtubeVideosRelations = relations(youtubeVideos, ({ one }) => ({
  product: one(products, {
    fields: [youtubeVideos.productId],
    references: [products.id],
  }),
}));

export const insertYouTubeVideoSchema = z.object({
  productId: z.string().uuid(),
  videoUrl: z.string().refine(
    (val) => {
      // YouTube URL formatını kontrol et
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      return youtubeRegex.test(val) || z.string().url().safeParse(val).success;
    },
    { message: "Must be a valid YouTube URL" }
  ),
  thumbnailUrl: z.string().refine(
    (val) => {
      if (!val) return true; // null/undefined ise geçerli
      return z.string().url().safeParse(val).success || val.startsWith('/');
    },
    { message: "Must be a valid URL or a relative path starting with /" }
  ).optional().nullable(),
  title: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const selectYouTubeVideoSchema = insertYouTubeVideoSchema.extend({
  id: z.string().uuid(),
});

export type InsertYouTubeVideo = z.infer<typeof insertYouTubeVideoSchema>;
export type SelectYouTubeVideo = z.infer<typeof selectYouTubeVideoSchema>;

