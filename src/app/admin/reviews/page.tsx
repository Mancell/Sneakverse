import { requireEditor } from "@/lib/auth/admin";
import { getAdminReviews } from "@/lib/actions/admin/reviews";
import ReviewsTable from "@/components/admin/ReviewsTable";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/index";

interface SearchParams {
  productId?: string;
  rating?: string;
  page?: string;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireEditor();

  const params = await searchParams;
  const { reviews, total, page, totalPages } = await getAdminReviews({
    productId: params.productId,
    rating: params.rating ? parseInt(params.rating) : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  });

  const productsList = await db.select({ id: products.id, name: products.name }).from(products).orderBy(products.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Reviews</h1>
        <p className="text-body text-dark-700 mt-2">
          Manage product reviews ({total} total)
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-light-300 bg-white p-4">
        <form method="get" className="flex items-center gap-4">
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
          <select
            name="rating"
            defaultValue={params.rating || ""}
            className="rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
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
      <ReviewsTable reviews={reviews} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <a
              key={pageNum}
              href={`/admin/reviews?page=${pageNum}${params.productId ? `&productId=${params.productId}` : ""}${params.rating ? `&rating=${params.rating}` : ""}`}
              className={`rounded-lg px-4 py-2 text-body ${
                pageNum === page
                  ? "bg-dark-900 text-light-100"
                  : "bg-white text-dark-900 border border-light-300 hover:bg-light-100"
              }`}
            >
              {pageNum}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

