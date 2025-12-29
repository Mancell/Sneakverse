import { requireEditor } from "@/lib/auth/admin";
import { getAdminCategories } from "@/lib/actions/admin/categories";
import CategoriesTable from "@/components/admin/CategoriesTable";
import Link from "next/link";
import { Plus } from "lucide-react";

interface SearchParams {
  search?: string;
  parentId?: string;
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireEditor();

  const params = await searchParams;
  const { categories, hierarchical } = await getAdminCategories({
    search: params.search,
    parentId: params.parentId || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-1 text-dark-900">Categories</h1>
          <p className="text-body text-dark-700 mt-2">
            Manage product categories ({categories.length} total)
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 rounded-lg bg-dark-900 px-4 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800"
        >
          <Plus className="h-5 w-5" />
          New Category
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-light-300 bg-white p-4">
        <form method="get" className="flex items-center gap-4">
          <input
            type="text"
            name="search"
            placeholder="Search categories..."
            defaultValue={params.search}
            className="flex-1 rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          />
          <button
            type="submit"
            className="rounded-lg bg-dark-900 px-6 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <CategoriesTable categories={categories} hierarchical={hierarchical} />
    </div>
  );
}

