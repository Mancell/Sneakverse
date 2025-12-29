import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function migrateReviews() {
  try {
    console.log("Adding reviewer_name column to reviews table...");
    await db.execute(sql`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewer_name" text;`);
    console.log("✅ Added reviewer_name column");

    console.log("Making user_id nullable...");
    await db.execute(sql`ALTER TABLE "reviews" ALTER COLUMN "user_id" DROP NOT NULL;`);
    console.log("✅ Made user_id nullable");

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrateReviews()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });

