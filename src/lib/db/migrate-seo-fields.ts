import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function migrateSEOFields() {
  try {
    console.log("🔄 Starting SEO fields migration...");

    console.log("Adding meta_title column to products table...");
    await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_title" text;`);
    console.log("✅ Added meta_title column");

    console.log("Adding meta_description column to products table...");
    await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_description" text;`);
    console.log("✅ Added meta_description column");

    console.log("Adding meta_keywords column to products table...");
    await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meta_keywords" text;`);
    console.log("✅ Added meta_keywords column");

    console.log("✅ SEO fields migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrateSEOFields()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

