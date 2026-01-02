-- Performance optimization indexes
-- These indexes will significantly improve query performance for product listings and searches

-- Index for product name search (used in search queries)
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));

-- Index for product description search
CREATE INDEX IF NOT EXISTS idx_products_description ON products USING gin(to_tsvector('english', description));

-- Index for brand name search (used in joins)
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- Composite index for common product listing queries (is_published + created_at)
CREATE INDEX IF NOT EXISTS idx_products_published_created ON products(is_published, created_at DESC) WHERE is_published = true;

-- Index for product_variants.product_id (used in joins and aggregations)
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Index for product_images.product_id (used in image queries)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Index for product_images.variant_id (used in variant-specific image queries)
CREATE INDEX IF NOT EXISTS idx_product_images_variant_id ON product_images(variant_id);

-- Index for reviews.product_id (used in review aggregations)
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Index for price_history.product_id (used in price history queries)
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);

-- Index for price_history.recorded_at (used in date filtering)
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

