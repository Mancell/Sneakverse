"use server";

import { cookies } from "next/headers";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, cartItems, productVariants, products, productImages, colors, sizes, guests } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { createGuestSession, guestSession } from "@/lib/auth/actions";
import { z } from "zod";

export type CartItem = {
  id: string;
  cartItemId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantSku: string;
  color: string | null;
  size: string | null;
  price: number;
  salePrice: number | null;
  quantity: number;
  imageUrl: string | null;
  inStock: number;
};

export type CartData = {
  id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
};

/**
 * Get or create cart for current user/guest
 */
async function getOrCreateCart(): Promise<string> {
  const user = await getCurrentUser();
  const guest = await guestSession();

  if (user?.id) {
    // User cart
    const existingCart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, user.id), isNull(carts.guestId)))
      .limit(1);

    if (existingCart.length > 0) {
      return existingCart[0].id;
    }

    // Create new user cart
    const newCart = await db
      .insert(carts)
      .values({
        userId: user.id,
        guestId: null,
      })
      .returning();

    return newCart[0].id;
  } else if (guest.sessionToken) {
    // Guest cart
    const guestRecord = await db
      .select()
      .from(guests)
      .where(eq(guests.sessionToken, guest.sessionToken))
      .limit(1);

    if (guestRecord.length === 0) {
      // Create guest session if doesn't exist
      const result = await createGuestSession();
      if (!result.ok || !result.sessionToken) {
        throw new Error("Failed to create guest session");
      }
      const newGuest = await db
        .select()
        .from(guests)
        .where(eq(guests.sessionToken, result.sessionToken))
        .limit(1);
      
      if (newGuest.length === 0) {
        throw new Error("Failed to find guest after creation");
      }

      const newCart = await db
        .insert(carts)
        .values({
          userId: null,
          guestId: newGuest[0].id,
        })
        .returning();

      return newCart[0].id;
    }

    const guestId = guestRecord[0].id;

    const existingCart = await db
      .select()
      .from(carts)
      .where(eq(carts.guestId, guestId))
      .limit(1);

    if (existingCart.length > 0) {
      return existingCart[0].id;
    }

    // Create new guest cart
    const newCart = await db
      .insert(carts)
      .values({
        userId: null,
        guestId,
      })
      .returning();

    return newCart[0].id;
  } else {
    // No user, no guest - create guest session
    const result = await createGuestSession();
    if (!result.ok || !result.sessionToken) {
      throw new Error("Failed to create guest session");
    }

    const newGuest = await db
      .select()
      .from(guests)
      .where(eq(guests.sessionToken, result.sessionToken))
      .limit(1);

    if (newGuest.length === 0) {
      throw new Error("Failed to find guest after creation");
    }

    const newCart = await db
      .insert(carts)
      .values({
        userId: null,
        guestId: newGuest[0].id,
      })
      .returning();

    return newCart[0].id;
  }
}

/**
 * Get cart with all items
 */
export async function getCart(): Promise<CartData | null> {
  try {
    const cartId = await getOrCreateCart();

    // Get cart items with product and variant details
    const items = await db
      .select({
        cartItemId: cartItems.id,
        quantity: cartItems.quantity,
        variantId: productVariants.id,
        variantSku: productVariants.sku,
        variantPrice: sql<number>`${productVariants.price}::numeric`,
        variantSalePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
        variantInStock: productVariants.inStock,
        productId: products.id,
        productName: products.name,
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
      .from(cartItems)
      .innerJoin(productVariants, eq(productVariants.id, cartItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .leftJoin(colors, eq(colors.id, productVariants.colorId))
      .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .where(eq(cartItems.cartId, cartId));

    const cartItemsData: CartItem[] = items.map((item) => ({
      id: item.variantId,
      cartItemId: item.cartItemId,
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantSku: item.variantSku,
      color: item.colorName ?? null,
      size: item.sizeName ?? null,
      price: Number(item.variantPrice),
      salePrice: item.variantSalePrice !== null ? Number(item.variantSalePrice) : null,
      quantity: item.quantity,
      imageUrl: item.imageUrl?.trim() || null,
      inStock: item.variantInStock,
    }));

    const total = cartItemsData.reduce(
      (sum, item) => sum + (item.salePrice ?? item.price) * item.quantity,
      0
    );

    const itemCount = cartItemsData.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cartId,
      items: cartItemsData,
      total,
      itemCount,
    };
  } catch (error) {
    console.error("[getCart] Error:", error);
    return null;
  }
}

const addCartItemSchema = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

/**
 * Add item to cart
 */
export async function addCartItem(
  productVariantId: string,
  quantity: number = 1
): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = addCartItemSchema.parse({ productVariantId, quantity });

    const cartId = await getOrCreateCart();

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productVariantId, data.productVariantId)
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      // Update quantity
      await db
        .update(cartItems)
        .set({ quantity: existingItem[0].quantity + data.quantity })
        .where(eq(cartItems.id, existingItem[0].id));

      // Update cart updatedAt
      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cartId));
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId,
        productVariantId: data.productVariantId,
        quantity: data.quantity,
      });

      // Update cart updatedAt
      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cartId));
    }

    return { ok: true };
  } catch (error) {
    console.error("[addCartItem] Error:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message || "Validation failed" };
    }
    return { ok: false, error: "Failed to add item to cart" };
  }
}

const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  cartItemId: string,
  quantity: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = updateCartItemSchema.parse({ cartItemId, quantity });

    const cartId = await getOrCreateCart();

    // Verify item belongs to this cart
    const item = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, data.cartItemId), eq(cartItems.cartId, cartId)))
      .limit(1);

    if (item.length === 0) {
      return { ok: false, error: "Cart item not found" };
    }

    await db
      .update(cartItems)
      .set({ quantity: data.quantity })
      .where(eq(cartItems.id, data.cartItemId));

    // Update cart updatedAt
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    return { ok: true };
  } catch (error) {
    console.error("[updateCartItem] Error:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message || "Validation failed" };
    }
    return { ok: false, error: "Failed to update cart item" };
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  cartItemId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const cartId = await getOrCreateCart();

    // Verify item belongs to this cart
    const item = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)))
      .limit(1);

    if (item.length === 0) {
      return { ok: false, error: "Cart item not found" };
    }

    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));

    // Update cart updatedAt
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    return { ok: true };
  } catch (error) {
    console.error("[removeCartItem] Error:", error);
    return { ok: false, error: "Failed to remove cart item" };
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart(): Promise<{ ok: boolean; error?: string }> {
  try {
    const cartId = await getOrCreateCart();

    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));

    // Update cart updatedAt
    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId));

    return { ok: true };
  } catch (error) {
    console.error("[clearCart] Error:", error);
    return { ok: false, error: "Failed to clear cart" };
  }
}

