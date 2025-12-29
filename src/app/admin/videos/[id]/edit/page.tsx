import { requireEditor } from "@/lib/auth/admin";
import { getVideoForEdit } from "@/lib/actions/admin/videos";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/index";
import VideoForm from "@/components/admin/VideoForm";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEditor();

  const { id } = await params;
  const video = await getVideoForEdit(id);

  if (!video) {
    notFound();
  }

  const productsList = await db.select({ id: products.id, name: products.name }).from(products).orderBy(products.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Edit Video</h1>
        <p className="text-body text-dark-700 mt-2">Update video information</p>
      </div>

      <VideoForm video={video} products={productsList} />
    </div>
  );
}

