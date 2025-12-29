import { requireEditor } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/index";
import VideoForm from "@/components/admin/VideoForm";

export default async function NewVideoPage() {
  await requireEditor();

  const productsList = await db.select({ id: products.id, name: products.name }).from(products).orderBy(products.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Add New Video</h1>
        <p className="text-body text-dark-700 mt-2">Add a new TikTok video to a product</p>
      </div>

      <VideoForm products={productsList} />
    </div>
  );
}

