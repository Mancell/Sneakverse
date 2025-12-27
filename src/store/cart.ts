"use client";

import { create } from "zustand";
import type { CartItem } from "@/lib/actions/cart";
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart as clearCartAction } from "@/lib/actions/cart";

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  // Actions
  loadCart: () => Promise<void>;
  addItem: (productVariantId: string, quantity?: number) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  syncCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  isSyncing: false,

  loadCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await getCart();
      if (cart) {
        set({
          items: cart.items,
          total: cart.total,
          itemCount: cart.itemCount,
          isLoading: false,
        });
      } else {
        set({
          items: [],
          total: 0,
          itemCount: 0,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("[loadCart] Error:", error);
      set({ isLoading: false });
    }
  },

  addItem: async (productVariantId: string, quantity: number = 1) => {
    set({ isSyncing: true });
    try {
      const result = await addCartItem(productVariantId, quantity);
      if (result.ok) {
        await get().syncCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[addItem] Error:", error);
      return false;
    } finally {
      set({ isSyncing: false });
    }
  },

  removeItem: async (cartItemId: string) => {
    set({ isSyncing: true });
    try {
      const result = await removeCartItem(cartItemId);
      if (result.ok) {
        await get().syncCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[removeItem] Error:", error);
      return false;
    } finally {
      set({ isSyncing: false });
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return get().removeItem(cartItemId);
    }

    set({ isSyncing: true });
    try {
      const result = await updateCartItem(cartItemId, quantity);
      if (result.ok) {
        await get().syncCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[updateQuantity] Error:", error);
      return false;
    } finally {
      set({ isSyncing: false });
    }
  },

  clearCart: async () => {
    set({ isSyncing: true });
    try {
      const result = await clearCartAction();
      if (result.ok) {
        await get().syncCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[clearCart] Error:", error);
      return false;
    } finally {
      set({ isSyncing: false });
    }
  },

  syncCart: async () => {
    try {
      const cart = await getCart();
      if (cart) {
        set({
          items: cart.items,
          total: cart.total,
          itemCount: cart.itemCount,
        });
      } else {
        set({
          items: [],
          total: 0,
          itemCount: 0,
        });
      }
    } catch (error) {
      console.error("[syncCart] Error:", error);
    }
  },
}));
