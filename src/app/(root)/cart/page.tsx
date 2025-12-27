import Link from "next/link";
import { Suspense } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { getCart } from "@/lib/actions/cart";
import CartClient from "@/components/CartClient";
import { getCurrentUser } from "@/lib/auth/actions";

async function CartContent() {
  const cart = await getCart();
  const user = await getCurrentUser();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-dark-500" />
        <div className="mb-4">
          <AnimatedText 
            text="Your cart is empty" 
            textClassName="text-heading-3 text-dark-900 text-center"
            className="items-center"
          />
        </div>
        <p className="mb-6 text-body text-dark-700">Add some products to get started.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
        >
          Browse Products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return <CartClient initialCart={cart} isAuthenticated={!!user} />;
}

export default async function CartPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="py-4 text-caption text-dark-700">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <span className="text-dark-900">Cart</span>
      </nav>

      <header className="mb-8">
        <AnimatedText 
          text="Shopping Cart" 
          textClassName="text-heading-2 text-dark-900 text-left"
          className="items-start"
        />
      </header>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-light-300 border-t-dark-900" />
          </div>
        }
      >
        <CartContent />
      </Suspense>
    </main>
  );
}

