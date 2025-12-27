"use server";

import { db } from "@/lib/db";
import { orders, orderItems, productVariants, products, colors, sizes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  priceAtPurchase: number;
  imageUrl: string | null;
};

export type OrderData = {
  id: string;
  userId: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  createdAt: Date;
  items: OrderItem[];
};

/**
 * Get order by ID with all details
 */
export async function getOrder(orderId: string): Promise<OrderData | null> {
  try {
    const orderData = await db
      .select({
        orderId: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: sql<number>`${orders.totalAmount}::numeric`,
        createdAt: orders.createdAt,
        itemId: orderItems.id,
        productVariantId: orderItems.productVariantId,
        quantity: orderItems.quantity,
        priceAtPurchase: sql<number>`${orderItems.priceAtPurchase}::numeric`,
        productId: products.id,
        productName: products.name,
        variantSku: productVariants.sku,
        colorName: colors.name,
        sizeName: sizes.name,
        imageUrl: sql<string | null>`(
          SELECT url FROM product_images 
          WHERE product_id = ${products.id} 
          AND (variant_id = ${productVariants.id} OR variant_id IS NULL)
          ORDER BY is_primary DESC, sort_order ASC 
          LIMIT 1
        )`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(productVariants, eq(productVariants.id, orderItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(colors, eq(colors.id, productVariants.colorId))
      .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .where(eq(orders.id, orderId));

    if (orderData.length === 0) {
      return null;
    }

    const firstItem = orderData[0];
    const items: OrderItem[] = orderData.map((item) => ({
      id: item.itemId,
      productId: item.productId,
      productName: item.productName,
      variantId: item.productVariantId,
      variantSku: item.variantSku,
      color: item.colorName ?? null,
      size: item.sizeName ?? null,
      quantity: item.quantity,
      priceAtPurchase: Number(item.priceAtPurchase),
      imageUrl: item.imageUrl?.trim() || null,
    }));

    return {
      id: firstItem.orderId,
      userId: firstItem.userId,
      status: firstItem.status as OrderData["status"],
      totalAmount: Number(firstItem.totalAmount),
      createdAt: firstItem.createdAt,
      items,
    };
  } catch (error) {
    console.error("[getOrder] Error:", error);
    return null;
  }
}


