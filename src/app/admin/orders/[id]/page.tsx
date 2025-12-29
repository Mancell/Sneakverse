import { requireEditor } from "@/lib/auth/admin";
import { getOrderDetails } from "@/lib/actions/admin/orders";
import { notFound } from "next/navigation";
import OrderDetails from "@/components/admin/OrderDetails";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEditor();

  const { id } = await params;
  const orderData = await getOrderDetails(id);

  if (!orderData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-body text-dark-700 hover:text-dark-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <OrderDetails
        order={orderData.order}
        items={orderData.items}
        shippingAddress={orderData.shippingAddress}
        billingAddress={orderData.billingAddress}
      />
    </div>
  );
}

