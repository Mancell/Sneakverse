"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function CartIndicator() {
  const { itemCount, loadCart } = useCartStore();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 text-body text-dark-900 transition-colors hover:text-dark-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="hidden sm:inline">My Cart</span>
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[--color-red] text-caption text-light-100">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}

