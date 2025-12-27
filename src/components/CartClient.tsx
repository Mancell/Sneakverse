"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { useCartStore } from "@/store/cart";
import type { CartData } from "@/lib/actions/cart";
import { updateCartItem, removeCartItem } from "@/lib/actions/cart";

interface CartClientProps {
  initialCart: CartData;
  isAuthenticated: boolean;
}

export default function CartClient({ initialCart }: CartClientProps) {
  const { items, syncCart, updateQuantity, removeItem } = useCartStore();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState(initialCart.items);

  // Sync store with initial cart data
  useEffect(() => {
    useCartStore.setState({
      items: initialCart.items,
      total: initialCart.total,
      itemCount: initialCart.itemCount,
    });
    setCartItems(initialCart.items);
  }, [initialCart]);

  // Update local state when store updates
  useEffect(() => {
    setCartItems(items);
  }, [items]);

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(cartItemId);
      return;
    }

    setIsUpdating(cartItemId);
    try {
      const success = await updateQuantity(cartItemId, newQuantity);
      if (success) {
        await syncCart();
      }
    } catch (error) {
      console.error("[handleUpdateQuantity] Error:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setIsUpdating(cartItemId);
    try {
      const success = await removeItem(cartItemId);
      if (success) {
        await syncCart();
      }
    } catch (error) {
      console.error("[handleRemoveItem] Error:", error);
    } finally {
      setIsUpdating(null);
    }
  };


  const displayPrice = (item: typeof items[0]) => {
    const price = item.salePrice ?? item.price;
    return `$${price.toFixed(2)}`;
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.salePrice ?? item.price) * item.quantity,
    0
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* Cart Items */}
      <section>
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.cartItemId}
              className="flex flex-col gap-4 rounded-xl border border-light-300 bg-light-100 p-4 sm:flex-row"
            >
              {/* Product Image */}
              <Link
                href={`/products/${item.productId}`}
                className="relative aspect-square h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-light-200 sm:h-40 sm:w-40"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-dark-500">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </Link>

              {/* Product Details */}
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-heading-3 text-dark-900 hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-caption text-dark-700">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                      <span>SKU: {item.variantSku}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.cartItemId)}
                    disabled={isUpdating === item.cartItemId}
                    className="flex-shrink-0 rounded-md p-2 text-dark-700 transition hover:bg-light-200 hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] disabled:opacity-50"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Price and Quantity */}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.salePrice && (
                      <span className="text-body text-dark-700 line-through">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                    <span className="text-body-medium text-dark-900">{displayPrice(item)}</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                      disabled={isUpdating === item.cartItemId || item.quantity <= 1}
                      className="rounded-md border border-light-300 p-1.5 text-dark-700 transition hover:border-dark-500 hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-body-medium text-dark-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                      disabled={isUpdating === item.cartItemId || item.quantity >= item.inStock}
                      className="rounded-md border border-light-300 p-1.5 text-dark-700 transition hover:border-dark-500 hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <span className="text-body-medium text-dark-900">
                    ${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order Summary */}
      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <div className="rounded-xl border border-light-300 bg-light-100 p-6">
          <div className="mb-4">
            <AnimatedText 
              text="Order Summary" 
              textClassName="text-heading-3 text-dark-900 text-left"
              className="items-start"
            />
          </div>

          <div className="space-y-3 border-b border-light-300 pb-4">
            <div className="flex justify-between text-body text-dark-700">
              <span>
                Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                {cartItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "item" : "items"})
              </span>
              <span className="text-dark-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-body text-dark-700">
              <span>Shipping</span>
              <span className="text-dark-900">Free shipping</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-b border-light-300 pb-4">
            <span className="text-body-medium text-dark-900">Total</span>
            <span className="text-heading-3 text-dark-900">${subtotal.toFixed(2)}</span>
          </div>


          <Link
            href="/products"
            className="mt-4 block text-center text-body text-dark-700 underline-offset-2 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}

