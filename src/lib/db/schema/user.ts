import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { addresses } from './addresses';
import { orders } from './orders';
import { carts } from './carts';
import { wishlists } from './wishlists';
import { reviews } from './reviews';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  carts: many(carts),
  wishlists: many(wishlists),
  reviews: many(reviews),
}));

export const insertUserSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email(),
  emailVerified: z.boolean().optional(),
  image: z.string().url().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export const selectUserSchema = insertUserSchema.extend({
  id: z.string().uuid(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
