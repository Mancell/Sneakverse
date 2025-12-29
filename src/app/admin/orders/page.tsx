import { requireEditor } from "@/lib/auth/admin";
import { getAdminOrders } from "@/lib/actions/admin/orders";
import OrdersTable from "@/components/admin/OrdersTable";
import Link from "next/link";

interface SearchParams {
  status?: string;
  userId?: string;
  search?: string;
  page?: string;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireEditor();

  const params = await searchParams;
  const { orders, total, page, totalPages } = await getAdminOrders({
    status: params.status,
    userId: params.userId,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Orders</h1>
        <p className="text-body text-dark-700 mt-2">
          Manage customer orders ({total} total)
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-light-300 bg-white p-4">
        <form method="get" className="flex items-center gap-4">
          <input
            type="text"
            name="search"
            placeholder="Search by order ID or email..."
            defaultValue={params.search}
            className="flex-1 rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          />
          <select
            name="status"
            defaultValue={params.status || ""}
            className="rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
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
      <OrdersTable orders={orders} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/admin/orders?page=${pageNum}${params.search ? `&search=${params.search}` : ""}${params.status ? `&status=${params.status}` : ""}`}
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

