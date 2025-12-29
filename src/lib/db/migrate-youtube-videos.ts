import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function migrateYouTubeVideos() {
  try {
    console.log("🔄 Starting YouTube videos table migration...");

    // Check if table already exists
    try {
      await db.execute(sql`SELECT 1 FROM "youtube_videos" LIMIT 1`);
      console.log("✅ YouTube videos table already exists");
      return;
    } catch (error: any) {
      // Table doesn't exist, continue with creation
      if (!error.message?.includes("does not exist") && !error.message?.includes("relation")) {
        throw error;
      }
    }

    // Create table
    await db.execute(sql`
      CREATE TABLE "youtube_videos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "product_id" uuid NOT NULL,
        "video_url" text NOT NULL,
        "thumbnail_url" text,
        "title" text,
        "author" text,
        "sort_order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ Created youtube_videos table");

    // Add foreign key constraint
    await db.execute(sql`
      ALTER TABLE "youtube_videos" 
      ADD CONSTRAINT "youtube_videos_product_id_products_id_fk" 
      FOREIGN KEY ("product_id") 
      REFERENCES "public"."products"("id") 
      ON DELETE cascade 
      ON UPDATE no action;
    `);
    console.log("✅ Added foreign key constraint");

    console.log("✅ YouTube videos migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during YouTube videos migration:", error);
    throw error;
  }
}

migrateYouTubeVideos()
  .then(() => {
    console.log("✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  });

