"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createYouTubeVideo, deleteYouTubeVideo } from "@/lib/actions/admin/youtube-videos";
import { Plus, Trash2 } from "lucide-react";

interface YouTubeVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string | null;
  author: string | null;
  sortOrder: number;
}

interface YouTubeVideosManagerProps {
  productId: string;
  videos: YouTubeVideo[];
}

export default function YouTubeVideosManager({ productId, videos }: YouTubeVideosManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const videoUrl = formData.get("videoUrl") as string;
    const title = formData.get("title") as string || null;
    const author = formData.get("author") as string || null;
    const thumbnailUrl = formData.get("thumbnailUrl") as string || null;

    if (!videoUrl || !videoUrl.trim()) {
      setError("Please enter a YouTube video URL");
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoUrl)) {
      setError("Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)");
      return;
    }

    const data = {
      productId,
      videoUrl: videoUrl.trim(),
      thumbnailUrl,
      title,
      author,
      sortOrder: parseInt(formData.get("sortOrder") as string) || videos.length,
    };

    startTransition(async () => {
      try {
        await createYouTubeVideo(data);
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this YouTube video?")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteYouTubeVideo(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading-4 text-dark-900">YouTube Videos</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-dark-900 px-4 py-2 text-body-medium text-light-100 transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add YouTube Video
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-caption text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-light-300 bg-light-50 p-4">
          <div>
            <label htmlFor="videoUrl" className="block text-caption font-medium text-dark-900 mb-1">
              YouTube Video URL *
            </label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
            <p className="mt-1 text-xs text-dark-600">
              Enter a YouTube video URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-caption font-medium text-dark-900 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Video title"
              className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-caption font-medium text-dark-900 mb-1">
              Author/Channel (Optional)
            </label>
            <input
              type="text"
              id="author"
              name="author"
              placeholder="Channel name"
              className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div>
            <label htmlFor="thumbnailUrl" className="block text-caption font-medium text-dark-900 mb-1">
              Thumbnail URL (Optional)
            </label>
            <input
              type="url"
              id="thumbnailUrl"
              name="thumbnailUrl"
              placeholder="https://..."
              className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
            <p className="mt-1 text-xs text-dark-600">
              Leave empty to use YouTube's default thumbnail
            </p>
          </div>

          <div>
            <label htmlFor="sortOrder" className="block text-caption font-medium text-dark-900 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              id="sortOrder"
              name="sortOrder"
              defaultValue={videos.length}
              min="0"
              className="w-full rounded-lg border border-light-300 bg-white px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-dark-900 px-4 py-2 text-body-medium text-light-100 transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add Video"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg border border-light-300 bg-white px-4 py-2 text-body-medium text-dark-900 transition hover:bg-light-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between rounded-lg border border-light-300 bg-white p-4"
            >
              <div className="flex-1">
                <p className="text-body font-medium text-dark-900">
                  {video.title || "Untitled Video"}
                </p>
                <p className="text-caption text-dark-600 mt-1 break-all">{video.videoUrl}</p>
                {video.author && (
                  <p className="text-caption text-dark-500 mt-1">by {video.author}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(video.id)}
                disabled={isPending}
                className="ml-4 rounded-lg border border-red-300 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                aria-label="Delete video"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-body text-dark-600">No YouTube videos added yet.</p>
      )}
    </div>
  );
}

