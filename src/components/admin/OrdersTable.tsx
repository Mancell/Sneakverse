"use client";

import Link from "next/link";

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface OrdersTableProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="rounded-xl border border-light-300 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-light-100">
            <tr>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Order ID</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Customer</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Amount</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Status</th>
              <th className="px-6 py-3 text-left text-caption font-medium text-dark-900">Date</th>
              <th className="px-6 py-3 text-right text-caption font-medium text-dark-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-300">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-body text-dark-700">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-light-50">
                  <td className="px-6 py-4">
                    <p className="text-body font-mono text-dark-900">{order.id.slice(0, 8)}...</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-body text-dark-900">{order.user?.name || "Unknown"}</p>
                      <p className="text-caption text-dark-700">{order.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-body font-medium text-dark-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-caption capitalize ${
                        statusColors[order.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-caption text-dark-700">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-lg bg-dark-900 px-4 py-2 text-caption font-medium text-light-100 transition-colors hover:bg-dark-800"
                      >
                        View
                      </Link>
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

