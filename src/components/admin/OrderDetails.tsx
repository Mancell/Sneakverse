"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/admin/orders";

interface OrderDetailsProps {
  order: {
    id: string;
    status: string;
    totalAmount: string;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: string;
    variant: {
      id: string;
      sku: string;
      price: string;
    } | null;
    product: {
      id: string;
      name: string;
    } | null;
  }>;
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  } | null;
  billingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  } | null;
}

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrderDetails({
  order,
  items,
  shippingAddress,
  billingAddress,
}: OrderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as any;
    setError(null);

    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, newStatus);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-body text-red-800">
          {error}
        </div>
      )}

      {/* Order Header */}
      <div className="rounded-xl border border-light-300 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-heading-2 text-dark-900">Order #{order.id.slice(0, 8)}</h2>
            <p className="text-caption text-dark-700 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <label className="block text-caption font-medium text-dark-900 mb-2">Status</label>
            <select
              value={order.status}
              onChange={handleStatusChange}
              disabled={isPending}
              className="rounded-lg border border-light-300 bg-light-100 px-4 py-2 text-body text-dark-900 focus:outline-none focus:ring-2 focus:ring-dark-900/10 disabled:opacity-50"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-caption text-dark-700">Customer</p>
            <p className="text-body font-medium text-dark-900">{order.user?.name || "Unknown"}</p>
            <p className="text-caption text-dark-700">{order.user?.email}</p>
          </div>
          <div>
            <p className="text-caption text-dark-700">Total Amount</p>
            <p className="text-heading-3 text-dark-900">${Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-xl border border-light-300 bg-white p-6">
        <h3 className="text-heading-3 text-dark-900 mb-4">Order Items</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-light-300 bg-light-50 p-4"
            >
              <div className="flex-1">
                <p className="text-body font-medium text-dark-900">
                  {item.product?.name || "Unknown Product"}
                </p>
                <p className="text-caption text-dark-700">
                  SKU: {item.variant?.sku || "N/A"} | Quantity: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-body font-medium text-dark-900">
                  ${Number(item.priceAtPurchase).toFixed(2)}
                </p>
                <p className="text-caption text-dark-700">
                  ${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)} total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shippingAddress && (
          <div className="rounded-xl border border-light-300 bg-white p-6">
            <h3 className="text-heading-3 text-dark-900 mb-4">Shipping Address</h3>
            <div className="space-y-1 text-body text-dark-700">
              <p>{shippingAddress.line1}</p>
              {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
            </div>
          </div>
        )}

        {billingAddress && (
          <div className="rounded-xl border border-light-300 bg-white p-6">
            <h3 className="text-heading-3 text-dark-900 mb-4">Billing Address</h3>
            <div className="space-y-1 text-body text-dark-700">
              <p>{billingAddress.line1}</p>
              {billingAddress.line2 && <p>{billingAddress.line2}</p>}
              <p>
                {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
              </p>
              <p>{billingAddress.country}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

