import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertVerificationSchema = z.object({
  identifier: z.string().min(1),
  value: z.string().min(1),
  expiresAt: z.date(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export const selectVerificationSchema = insertVerificationSchema.extend({
  id: z.string().uuid(),
});
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type SelectVerification = z.infer<typeof selectVerificationSchema>;
