"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVideo, deleteVideo } from "@/lib/actions/admin/videos";
import { Plus, Trash2, Upload, Video as VideoIcon } from "lucide-react";

interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string | null;
  author: string | null;
  sortOrder: number;
}

interface VideosManagerProps {
  productId: string;
  videos: Video[];
}

export default function VideosManager({ productId, videos }: VideosManagerProps) {
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
      formData.append("type", "video");

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
    const fileInput = formData.get("videoFile") as File | null;
    const title = formData.get("title") as string || null;
    const author = formData.get("author") as string || null;

    if (!fileInput || fileInput.size === 0) {
      setError("Please select a video file to upload");
      return;
    }

    let finalVideoUrl: string;
    try {
      finalVideoUrl = await handleFileUpload(fileInput);
    } catch (err) {
      return; // Error already set in handleFileUpload
    }

    const data = {
      productId,
      videoUrl: finalVideoUrl,
      thumbnailUrl: formData.get("thumbnailUrl") as string || null,
      title,
      author,
      sortOrder: parseInt(formData.get("sortOrder") as string) || videos.length,
    };

    startTransition(async () => {
      try {
        await createVideo(data);
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteVideo(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete video");
      }
    });
  };

  return (
    <div className="rounded-xl border border-light-300 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading-3 text-dark-900">Videos</h2>
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
              Upload Video File *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                name="videoFile"
                accept="video/*"
                required
                className="flex-1 rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-caption file:font-medium file:bg-dark-900 file:text-light-100 file:cursor-pointer hover:file:bg-dark-800"
              />
            </div>
            <p className="mt-1 text-footnote text-dark-700">
              Video dosyası yüklendikten sonra otomatik olarak veritabanına kaydedilecek
            </p>
          </div>
          <div className="hidden">
            <input type="text" name="videoUrl" value="" readOnly />
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Thumbnail URL</label>
            <input
              type="text"
              name="thumbnailUrl"
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              placeholder="/images/thumbnail.jpg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">Title</label>
              <input
                type="text"
                name="title"
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-dark-900 mb-1">Author</label>
              <input
                type="text"
                name="author"
                className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-1">Sort Order</label>
            <input
              type="number"
              name="sortOrder"
              defaultValue={videos.length}
              min="0"
              className="w-full rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            />
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
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg border border-light-300 bg-white px-3 py-1.5 text-caption text-dark-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {videos.length === 0 ? (
          <p className="text-caption text-dark-700">No videos yet</p>
        ) : (
          videos
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-3 rounded-lg border border-light-300 bg-light-50 p-3"
              >
                <VideoIcon className="h-8 w-8 text-dark-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-medium text-dark-900 truncate">
                    {video.title || "Untitled Video"}
                  </p>
                  <p className="text-footnote text-dark-700 truncate">{video.videoUrl}</p>
                  {video.author && (
                    <p className="text-footnote text-dark-500">By {video.author}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
