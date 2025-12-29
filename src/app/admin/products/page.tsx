import { requireEditor } from "@/lib/auth/admin";
import { getAdminProducts } from "@/lib/actions/admin/products";
import ProductsTable from "@/components/admin/ProductsTable";
import Link from "next/link";
import { Plus } from "lucide-react";

interface SearchParams {
  search?: string;
  brandId?: string;
  categoryId?: string;
  genderId?: string;
  isPublished?: string;
  page?: string;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireEditor();

  const params = await searchParams;
  const { products, total, page, totalPages } = await getAdminProducts({
    search: params.search,
    brandId: params.brandId,
    categoryId: params.categoryId,
    genderId: params.genderId,
    isPublished: params.isPublished === "true" ? true : params.isPublished === "false" ? false : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-1 text-dark-900">Products</h1>
          <p className="text-body text-dark-700 mt-2">
            Manage your products ({total} total)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-dark-900 px-4 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800"
        >
          <Plus className="h-5 w-5" />
          New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-light-300 bg-white p-4">
        <form method="get" className="flex items-center gap-4">
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            defaultValue={params.search}
            className="flex-1 rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          />
          <select
            name="isPublished"
            defaultValue={params.isPublished || ""}
            className="rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          >
            <option value="">All Status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-dark-900 px-6 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <ProductsTable products={products} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/admin/products?page=${pageNum}${params.search ? `&search=${params.search}` : ""}${params.isPublished ? `&isPublished=${params.isPublished}` : ""}`}
              className={`rounded-lg px-4 py-2 text-body ${
                pageNum === page
                  ? "bg-dark-900 text-light-100"
                  : "bg-white text-dark-900 border border-light-300 hover:bg-light-100"
              }`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

