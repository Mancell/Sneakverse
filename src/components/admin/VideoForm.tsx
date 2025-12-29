"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVideo, updateVideo } from "@/lib/actions/admin/videos";

interface VideoFormProps {
  video?: {
    id: string;
    productId: string;
    videoUrl: string;
    thumbnailUrl: string | null;
    title: string | null;
    author: string | null;
    sortOrder: number;
  };
  products: Array<{ id: string; name: string }>;
}

export default function VideoForm({ video, products }: VideoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!video;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      productId: formData.get("productId") as string,
      videoUrl: formData.get("videoUrl") as string,
      thumbnailUrl: formData.get("thumbnailUrl") as string || null,
      title: formData.get("title") as string || null,
      author: formData.get("author") as string || null,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    };

    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateVideo({ ...data, id: video.id });
        } else {
          await createVideo(data);
        }
        router.push("/admin/videos");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-body text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-light-300 bg-white p-6">
        <h2 className="text-heading-3 text-dark-900 mb-4">Video Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="productId" className="block text-caption font-medium text-dark-900 mb-1">
              Product *
            </label>
            <select
              id="productId"
              name="productId"
              defaultValue={video?.productId || ""}
              required
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-caption font-medium text-dark-900 mb-1">
              Video URL *
            </label>
            <input
              type="text"
              id="videoUrl"
              name="videoUrl"
              defaultValue={video?.videoUrl}
              required
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              placeholder="https://example.com/video.mp4 or /videos/video.mp4"
            />
            <p className="mt-1 text-caption text-dark-700">
              Enter a full URL or a relative path starting with /
            </p>
          </div>

          <div>
            <label htmlFor="thumbnailUrl" className="block text-caption font-medium text-dark-900 mb-1">
              Thumbnail URL
            </label>
            <input
              type="text"
              id="thumbnailUrl"
              name="thumbnailUrl"
              defaultValue={video?.thumbnailUrl || ""}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              placeholder="/images/thumbnail.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-caption font-medium text-dark-900 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={video?.title || ""}
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-caption font-medium text-dark-900 mb-1">
                Author
              </label>
              <input
                type="text"
                id="author"
                name="author"
                defaultValue={video?.author || ""}
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-caption font-medium text-dark-900 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              id="sortOrder"
              name="sortOrder"
              defaultValue={video?.sortOrder || 0}
              min="0"
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
            <p className="mt-1 text-caption text-dark-700">Lower numbers appear first</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-light-300 bg-white px-6 py-2 text-body font-medium text-dark-900 transition-colors hover:bg-light-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-dark-900 px-6 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800 disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEditMode ? "Update Video" : "Create Video"}
        </button>
      </div>
    </form>
  );
}

