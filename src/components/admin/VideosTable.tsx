"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteVideo } from "@/lib/actions/admin/videos";
import { Trash2, Edit, ExternalLink } from "lucide-react";

interface Video {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string | null;
  author: string | null;
  sortOrder: number;
  product: {
    id: string;
    name: string;
  } | null;
}

interface VideosTableProps {
  videos: Video[];
}

export default function VideosTable({ videos }: VideosTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteVideo(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete video:", error);
      alert("Failed to delete video");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-light-300 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-light-100">
            <tr>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Video</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Product</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Title</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Author</th>
              <th className="px-6 py-3 text-right text-caption font-medium text-dark-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-300">
            {videos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-body text-dark-700">
                  No videos found
                </td>
              </tr>
            ) : (
              videos.map((video) => (
                <tr key={video.id} className="hover:bg-light-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title || "Video thumbnail"}
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-video.jpg";
                          }}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-light-200 flex items-center justify-center">
                          <span className="text-caption text-dark-500">No thumbnail</span>
                        </div>
                      )}
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-caption text-dark-700 hover:text-dark-900 flex items-center gap-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {video.product ? (
                      <Link
                        href={`/products/${video.product.id}`}
                        className="text-body text-dark-900 hover:underline"
                      >
                        {video.product.name}
                      </Link>
                    ) : (
                      <span className="text-caption text-dark-500">No product</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body text-dark-900">{video.title || "-"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body text-dark-900">{video.author || "-"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/videos/${video.id}/edit`}
                        className="rounded-lg p-2 text-dark-700 transition-colors hover:bg-light-100"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(video.id)}
                        disabled={deletingId === video.id}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

