"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost, updateBlogPost } from "@/lib/actions/admin/blog";

interface BlogFormProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    imageSrc: string | null;
    category: string;
    date: Date;
    isPublished: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string[] | null;
  };
}

export default function BlogForm({ post }: BlogFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!post;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      excerpt: formData.get("excerpt") as string || null,
      content: formData.get("content") as string || null,
      imageSrc: formData.get("imageSrc") as string || null,
      category: formData.get("category") as string,
      date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
      isPublished: formData.get("isPublished") === "on",
      seoTitle: formData.get("seoTitle") as string || null,
      seoDescription: formData.get("seoDescription") as string || null,
      seoKeywords: (formData.get("seoKeywords") as string)
        ?.split(",")
        .map((k) => k.trim())
        .filter(Boolean) || null,
    };

    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateBlogPost({ ...data, id: post.id });
        } else {
          await createBlogPost(data);
        }
        router.push("/admin/blog");
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

      {/* Basic Information */}
      <div className="rounded-xl border border-light-300 bg-white p-6">
        <h2 className="text-heading-3 text-dark-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-caption font-medium text-dark-900 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={post?.title}
              required
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-caption font-medium text-dark-900 mb-1">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              defaultValue={post?.slug}
              required
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              placeholder="blog-post-slug"
            />
            <p className="mt-1 text-caption text-dark-700">
              URL-friendly version of the title (auto-generated if left empty)
            </p>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-caption font-medium text-dark-900 mb-1">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              defaultValue={post?.excerpt || ""}
              rows={3}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-caption font-medium text-dark-900 mb-1">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              defaultValue={post?.content || ""}
              rows={10}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10 font-mono"
            />
            <p className="mt-1 text-caption text-dark-700">Markdown or HTML content</p>
          </div>

          <div>
            <label htmlFor="imageSrc" className="block text-caption font-medium text-dark-900 mb-1">
              Image URL
            </label>
            <input
              type="text"
              id="imageSrc"
              name="imageSrc"
              defaultValue={post?.imageSrc || ""}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              placeholder="/images/blog-post.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-caption font-medium text-dark-900 mb-1">
                Category *
              </label>
              <input
                type="text"
                id="category"
                name="category"
                defaultValue={post?.category}
                required
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-caption font-medium text-dark-900 mb-1">
                Date *
              </label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                defaultValue={
                  post?.date
                    ? new Date(post.date).toISOString().slice(0, 16)
                    : new Date().toISOString().slice(0, 16)
                }
                required
                className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              defaultChecked={post?.isPublished || false}
              className="h-4 w-4 rounded border-light-300 text-dark-900 focus:ring-2 focus:ring-dark-900/10"
            />
            <label htmlFor="isPublished" className="text-body text-dark-900">
              Publish immediately
            </label>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="rounded-xl border border-light-300 bg-white p-6">
        <h2 className="text-heading-3 text-dark-900 mb-4">SEO Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="seoTitle" className="block text-caption font-medium text-dark-900 mb-1">
              SEO Title
            </label>
            <input
              type="text"
              id="seoTitle"
              name="seoTitle"
              defaultValue={post?.seoTitle || ""}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div>
            <label
              htmlFor="seoDescription"
              className="block text-caption font-medium text-dark-900 mb-1"
            >
              SEO Description
            </label>
            <textarea
              id="seoDescription"
              name="seoDescription"
              defaultValue={post?.seoDescription || ""}
              rows={3}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            />
          </div>

          <div>
            <label
              htmlFor="seoKeywords"
              className="block text-caption font-medium text-dark-900 mb-1"
            >
              SEO Keywords (comma-separated)
            </label>
            <input
              type="text"
              id="seoKeywords"
              name="seoKeywords"
              defaultValue={post?.seoKeywords?.join(", ") || ""}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
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
          {isPending ? "Saving..." : isEditMode ? "Update Blog Post" : "Create Blog Post"}
        </button>
      </div>
    </form>
  );
}

