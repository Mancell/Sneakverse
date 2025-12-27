import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { carts } from './carts';

export const guests = pgTable('guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const guestsRelations = relations(guests, ({ many }) => ({
  carts: many(carts),
}));

export const insertGuestSchema = z.object({
  sessionToken: z.string().min(1),
  createdAt: z.date().optional(),
  expiresAt: z.date(),
});
export const selectGuestSchema = insertGuestSchema.extend({
  id: z.string().uuid(),
});
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type SelectGuest = z.infer<typeof selectGuestSchema>;
