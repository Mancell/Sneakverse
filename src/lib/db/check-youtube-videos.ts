import { db } from "@/lib/db";
import { youtubeVideos } from "@/lib/db/schema/social-media";
import { products } from "@/lib/db/schema/index";
import { eq } from "drizzle-orm";

async function checkYouTubeVideos() {
  try {
    console.log("🔍 Checking YouTube videos in database...\n");

    // Get all YouTube videos
    const allVideos = await db
      .select({
        id: youtubeVideos.id,
        productId: youtubeVideos.productId,
        videoUrl: youtubeVideos.videoUrl,
        title: youtubeVideos.title,
        author: youtubeVideos.author,
        productName: products.name,
      })
      .from(youtubeVideos)
      .leftJoin(products, eq(youtubeVideos.productId, products.id));

    console.log(`📊 Total YouTube videos: ${allVideos.length}\n`);

    if (allVideos.length === 0) {
      console.log("⚠️  No YouTube videos found in database!");
      console.log("💡 Add YouTube videos from admin panel: /admin/products/[id]/edit\n");
      return;
    }

    console.log("📹 YouTube Videos:\n");
    allVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title || "Untitled"}`);
      console.log(`   ID: ${video.id}`);
      console.log(`   Product: ${video.productName || video.productId}`);
      console.log(`   URL: ${video.videoUrl}`);
      console.log(`   Author: ${video.author || "N/A"}`);
      console.log("");
    });

    // Check videos by product
    const videosByProduct = await db
      .select({
        productId: youtubeVideos.productId,
        productName: products.name,
        count: youtubeVideos.id,
      })
      .from(youtubeVideos)
      .leftJoin(products, eq(youtubeVideos.productId, products.id))
      .groupBy(youtubeVideos.productId, products.name);

    console.log("📦 Videos by Product:\n");
    videosByProduct.forEach((item) => {
      console.log(`   ${item.productName || item.productId}: ${item.count} video(s)`);
    });

    console.log("\n✅ Check completed!");
  } catch (error) {
    console.error("❌ Error checking YouTube videos:", error);
    throw error;
  }
}

checkYouTubeVideos()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });

