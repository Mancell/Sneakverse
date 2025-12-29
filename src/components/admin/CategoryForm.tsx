"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory } from "@/lib/actions/admin/categories";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  };
  categories: Array<{ id: string; name: string; parentId: string | null }>;
}

export default function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!category;

  // Filter out current category and its descendants from parent options
  const availableParents = categories.filter((cat) => {
    if (isEditMode && cat.id === category.id) {
      return false; // Can't be its own parent
    }
    // TODO: Also filter out descendants to prevent circular references
    return true;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      parentId: formData.get("parentId") ? (formData.get("parentId") as string) : null,
    };

    startTransition(async () => {
      try {
        if (isEditMode) {
          await updateCategory({ ...data, id: category.id });
        } else {
          await createCategory(data);
        }
        router.push("/admin/categories");
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
        <h2 className="text-heading-3 text-dark-900 mb-4">Category Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-caption font-medium text-dark-900 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={category?.name}
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
              defaultValue={category?.slug}
              required
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
              placeholder="category-slug"
            />
            <p className="mt-1 text-caption text-dark-700">
              URL-friendly version of the name (auto-generated if left empty)
            </p>
          </div>

          <div>
            <label htmlFor="parentId" className="block text-caption font-medium text-dark-900 mb-1">
              Parent Category
            </label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={category?.parentId || ""}
              className="w-full rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
            >
              <option value="">None (Root Category)</option>
              {availableParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-caption text-dark-700">
              Select a parent category to create a hierarchical structure
            </p>
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
          {isPending ? "Saving..." : isEditMode ? "Update Category" : "Create Category"}
        </button>
      </div>
    </form>
  );
}

