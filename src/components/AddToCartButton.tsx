"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { addCartItem } from "@/lib/actions/cart";

interface AddToCartButtonProps {
  productVariantId: string;
  className?: string;
}

export default function AddToCartButton({ productVariantId, className = "" }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addItem, syncCart } = useCartStore();

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const success = await addItem(productVariantId, 1);
      if (success) {
        await syncCart();
      }
    } catch (error) {
      console.error("[handleAddToCart] Error:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`flex items-center justify-center gap-2 rounded-full bg-dark-900 px-6 py-4 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] disabled:opacity-50 ${className}`}
    >
      <ShoppingBag className="h-5 w-5" />
      {isAdding ? "Adding..." : "Add to Bag"}
    </button>
  );
}

