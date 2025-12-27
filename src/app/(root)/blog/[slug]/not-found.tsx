import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="rounded-xl border border-light-300 bg-light-100 p-12">
        <h2 className="text-heading-2 text-dark-900 mb-4">
          Blog Post Not Found
        </h2>
        <p className="text-body text-dark-700 mb-8 max-w-md mx-auto">
          The blog post you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/blog"
            className="rounded-full bg-dark-900 px-8 py-3 text-body-medium text-light-100 transition hover:opacity-90"
          >
            Browse All Posts
          </Link>
          <Link
            href="/"
            className="rounded-full border border-light-300 bg-white px-8 py-3 text-body-medium text-dark-900 transition hover:bg-light-100"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}

