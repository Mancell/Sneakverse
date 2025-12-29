import { requireEditor } from "@/lib/auth/admin";
import { getProductForEdit, getFormData } from "@/lib/actions/admin/products";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import VariantsManager from "@/components/admin/VariantsManager";
import ImagesManager from "@/components/admin/ImagesManager";
import VideosManager from "@/components/admin/VideosManager";
import YouTubeVideosManager from "@/components/admin/YouTubeVideosManager";
import PriceHistoryManager from "@/components/admin/PriceHistoryManager";
import ReviewsManager from "@/components/admin/ReviewsManager";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/user";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEditor();

  const { id } = await params;
  const productData = await getProductForEdit(id);

  if (!productData) {
    notFound();
  }

  const formData = await getFormData();
  const usersList = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(users.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Edit Product</h1>
        <p className="text-body text-dark-700 mt-2">
          Update product information and manage variants, images, videos, reviews, and price history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductForm
            product={productData.product}
            brands={formData.brands}
            categories={formData.categories}
            genders={formData.genders}
            colors={formData.colors}
            sizes={formData.sizes}
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <VariantsManager
            productId={productData.product.id}
            variants={productData.variants}
            colors={formData.colors}
            sizes={formData.sizes}
          />
          <ImagesManager
            productId={productData.product.id}
            images={productData.images}
          />
          <VideosManager
            productId={productData.product.id}
            videos={productData.videos || []}
          />
          <YouTubeVideosManager
            productId={productData.product.id}
            videos={productData.youtubeVideos || []}
          />
          <PriceHistoryManager
            productId={productData.product.id}
            entries={productData.priceHistory || []}
          />
          <ReviewsManager
            productId={productData.product.id}
            reviews={productData.reviews || []}
            users={usersList}
          />
        </div>
      </div>
    </div>
  );
}

