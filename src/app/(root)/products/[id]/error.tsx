"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Product detail page error:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
      <div className="rounded-xl border border-light-300 bg-light-100 p-12 shadow-sm">
        <h2 className="text-heading-3 text-dark-900 mb-4">Something went wrong</h2>
        <p className="text-body text-dark-700 mb-8 max-w-md mx-auto">
          We encountered an error while loading the product details. Please try again or return to the product list.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => reset()}
            className="rounded-full bg-dark-900 px-8 py-3 text-body-medium text-light-100 transition hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/products"
            className="rounded-full border border-light-300 bg-white px-8 py-3 text-body-medium text-dark-900 transition hover:bg-light-100"
          >
            Browse all products
          </Link>
        </div>
      </div>
    </main>
  );
}

