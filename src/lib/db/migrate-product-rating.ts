import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function migrateProductRating() {
  try {
    console.log("Adding manual_rating column to products table...");
    await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "manual_rating" numeric(3,2);`);
    console.log("✅ Added manual_rating column");

    console.log("Adding manual_review_count column to products table...");
    await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "manual_review_count" integer;`);
    console.log("✅ Added manual_review_count column");

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrateProductRating()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });

