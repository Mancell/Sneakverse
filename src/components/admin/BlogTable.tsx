"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBlogPost, toggleBlogPublish } from "@/lib/actions/admin/blog";
import { Calendar, Trash2, Eye, EyeOff, Edit } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  date: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogTableProps {
  posts: BlogPost[];
}

export default function BlogTable({ posts }: BlogTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteBlogPost(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      alert("Failed to delete blog post");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleBlogPublish(id);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
      alert("Failed to update publish status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-light-300 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-light-100">
            <tr>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Title</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Category</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Date</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Status</th>
              <th className="px-6 py-3 text-right text-caption font-medium text-dark-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-300">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-body text-dark-700">
                  No blog posts found
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-light-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body font-medium text-dark-900">{post.title}</p>
                      {post.excerpt && (
                        <p className="mt-1 text-caption text-dark-700 line-clamp-1">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-light-200 px-3 py-1 text-caption text-dark-700">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-caption text-dark-700">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-caption ${
                        post.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTogglePublish(post.id)}
                        disabled={togglingId === post.id}
                        className="rounded-lg p-2 text-dark-700 transition-colors hover:bg-light-100 disabled:opacity-50"
                        title={post.isPublished ? "Unpublish" : "Publish"}
                      >
                        {post.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="rounded-lg p-2 text-dark-700 transition-colors hover:bg-light-100"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
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

