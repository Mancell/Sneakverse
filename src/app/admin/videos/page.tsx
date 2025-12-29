import { requireEditor } from "@/lib/auth/admin";
import { getAdminVideos } from "@/lib/actions/admin/videos";
import VideosTable from "@/components/admin/VideosTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/index";

interface SearchParams {
  search?: string;
  productId?: string;
  page?: string;
}

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireEditor();

  const params = await searchParams;
  const { videos, total, page, totalPages } = await getAdminVideos({
    search: params.search,
    productId: params.productId,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  });

  const productsList = await db.select({ id: products.id, name: products.name }).from(products).orderBy(products.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-1 text-dark-900">Videos</h1>
          <p className="text-body text-dark-700 mt-2">
            Manage your TikTok videos ({total} total)
          </p>
        </div>
        <Link
          href="/admin/videos/new"
          className="flex items-center gap-2 rounded-lg bg-dark-900 px-4 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800"
        >
          <Plus className="h-5 w-5" />
          New Video
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-light-300 bg-white p-4">
        <form method="get" className="flex items-center gap-4">
          <input
            type="text"
            name="search"
            placeholder="Search videos..."
            defaultValue={params.search}
            className="flex-1 rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          />
          <select
            name="productId"
            defaultValue={params.productId || ""}
            className="rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          >
            <option value="">All Products</option>
            {productsList.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
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
      <VideosTable videos={videos} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/admin/videos?page=${pageNum}${params.search ? `&search=${params.search}` : ""}${params.productId ? `&productId=${params.productId}` : ""}`}
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

