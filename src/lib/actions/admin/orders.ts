"use server";

import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema/index";
import { users, addresses } from "@/lib/db/schema/index";
import { productVariants, products } from "@/lib/db/schema/index";
import { requireEditor } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { z } from "zod";

export async function getAdminOrders(params: {
  status?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireEditor();

  const { status, userId, search = "", page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (status) {
    conditions.push(eq(orders.status, status as any));
  }

  if (userId) {
    conditions.push(eq(orders.userId, userId));
  }

  if (search) {
    // Search in user email or order ID
    conditions.push(
      sql`${orders.id}::text ILIKE ${`%${search}%`} OR EXISTS (
        SELECT 1 FROM ${users} WHERE ${users.id} = ${orders.userId} AND ${users.email} ILIKE ${`%${search}%`}
      )`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [orderList, totalResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause),
  ]);

  return {
    orders: orderList,
    total: Number(totalResult[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
  };
}

export async function getOrderDetails(id: string) {
  await requireEditor();

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      shippingAddressId: orders.shippingAddressId,
      billingAddressId: orders.billingAddressId,
      createdAt: orders.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return null;
  }

  // Get order items with product information
  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
      variant: {
        id: productVariants.id,
        sku: productVariants.sku,
        price: productVariants.price,
      },
      product: {
        id: products.id,
        name: products.name,
      },
    })
    .from(orderItems)
    .leftJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orderItems.orderId, id));

  // Get addresses
  const [shippingAddress, billingAddress] = await Promise.all([
    order.shippingAddressId
      ? db
          .select()
          .from(addresses)
          .where(eq(addresses.id, order.shippingAddressId))
          .limit(1)
      : Promise.resolve([]),
    order.billingAddressId
      ? db
          .select()
          .from(addresses)
          .where(eq(addresses.id, order.billingAddressId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    order,
    items,
    shippingAddress: shippingAddress[0] || null,
    billingAddress: billingAddress[0] || null,
  };
}

export async function updateOrderStatus(id: string, status: "pending" | "paid" | "shipped" | "delivered" | "cancelled") {
  await requireEditor();

  await db.update(orders).set({ status }).where(eq(orders.id, id));

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return { success: true };
}

