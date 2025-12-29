import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center p-8">
      <h1 className="text-heading-2 text-dark-900">Product Not Found</h1>
      <p className="text-body text-dark-700 mt-2">The product you're looking for doesn't exist.</p>
      <Link
        href="/admin/products"
        className="mt-4 inline-block rounded-lg bg-dark-900 px-6 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-800"
      >
        Back to Products
      </Link>
    </div>
  );
}

