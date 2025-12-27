import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { brands } from './brands';
import { categories } from './categories';
import { relations } from 'drizzle-orm';

export const brandCategories = pgTable('brand_categories', {
  brandId: uuid('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.brandId, t.categoryId] }),
}));

export const brandCategoriesRelations = relations(brandCategories, ({ one }) => ({
  brand: one(brands, {
    fields: [brandCategories.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [brandCategories.categoryId],
    references: [categories.id],
  }),
}));

