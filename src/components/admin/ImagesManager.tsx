"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createImage, deleteImage, setPrimaryImage } from "@/lib/actions/admin/products";
import { Plus, Trash2, Star, Upload } from "lucide-react";

interface Image {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
  variantId: string | null;
}

interface ImagesManagerProps {
  productId: string;
  images: Image[];
}

export default function ImagesManager({ productId, images }: ImagesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const fileInput = formData.get("imageFile") as File | null;
    
    if (!fileInput || fileInput.size === 0) {
      setError("Please select an image file to upload");
      return;
    }

    let finalUrl: string;
    try {
      finalUrl = await handleFileUpload(fileInput);
    } catch (err) {
      return; // Error already set in handleFileUpload
    }

    const data = {
      productId,
      url: finalUrl,
      isPrimary: formData.get("isPrimary") === "on",
      sortOrder: parseInt(formData.get("sortOrder") as string) || images.length,
    };

    startTransition(async () => {
      try {
        await createImage(data);
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteImage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete image");
      }
    });
  };

  const handleSetPrimary = async (id: string) => {
    startTransition(async () => {
      try {
        await setPrimaryImage(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set primary image");
      }
    });
  };

  return (
    <div className="rounded-xl border border-light-300 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading-3 text-dark-900">Images</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-dark-900 px-3 py-1.5 text-caption font-medium text-light-100 transition-colors hover:bg-dark-800"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-caption text-red-800">
          {error}
        </div>
      )}

      {(showForm || uploading) && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-light-300 bg-light-50 p-4">
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">
              Upload Image File *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                name="imageFile"
                accept="image/*"
                required
                className="flex-1 rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-caption file:font-medium file:bg-dark-900 file:text-light-100 file:cursor-pointer hover:file:bg-dark-800"
              />
            </div>
            <p className="mt-1 text-footnote text-dark-700">
              Dosya yüklendikten sonra otomatik olarak veritabanına kaydedilecek
            </p>
          </div>
          <div className="hidden">
            <input type="text" name="url" value="" readOnly />
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Sort Order</label>
            <input
              type="number"
              name="sortOrder"
              defaultValue={images.length}
              min="0"
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              name="isPrimary"
              className="h-4 w-4 rounded border-light-300 text-dark-900"
            />
            <label htmlFor="isPrimary" className="text-caption text-dark-900">
              Set as primary
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || uploading}
              className="flex-1 rounded-lg bg-dark-900 px-3 py-1.5 text-caption font-medium text-light-100 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : isPending ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {images.length === 0 ? (
          <p className="text-caption text-dark-700">No images yet</p>
        ) : (
          images
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((image) => (
              <div
                key={image.id}
                className="flex items-center gap-3 rounded-lg border border-light-300 bg-light-50 p-3"
              >
                <img
                  src={image.url}
                  alt="Product"
                  className="h-16 w-16 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                  }}
                />
                <div className="flex-1">
                  <p className="text-caption font-medium text-dark-900 truncate">{image.url}</p>
                  <p className="text-footnote text-dark-700">Order: {image.sortOrder}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!image.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-dark-700 hover:bg-light-200 disabled:opacity-50"
                      title="Set as primary"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {image.isPrimary && (
                    <span className="rounded-lg bg-yellow-100 px-2 py-1 text-footnote text-yellow-800">
                      Primary
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(image.id)}
                    disabled={isPending}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

