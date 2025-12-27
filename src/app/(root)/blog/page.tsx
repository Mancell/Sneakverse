import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import BlogCard from "@/components/BlogCard";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { getAllBlogPosts, getUniqueCategories } from "@/lib/data/blog";
import { Tag } from "lucide-react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

export const metadata: Metadata = {
  title: "Blog | Nike - Latest Sneaker News, Trends & Guides",
  description: "Discover the latest sneaker trends, guides, and insights from the world of footwear fashion. Stay updated with expert tips, product reviews, and industry news.",
  keywords: [
    "sneaker blog",
    "shoe trends",
    "footwear news",
    "sneaker guides",
    "running shoes",
    "basketball shoes",
    "sneaker care",
    "shoe fashion",
  ],
  authors: [{ name: "Nike" }],
  creator: "Nike",
  publisher: "Nike",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
  openGraph: {
    title: "Blog | Nike - Latest Sneaker News & Trends",
    description: "Discover the latest sneaker trends, guides, and insights from the world of footwear fashion.",
    url: `${baseUrl}/blog`,
    siteName: "Nike",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Nike",
    description: "Latest sneaker news, trends, and guides",
    creator: "@nike",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const allPosts = getAllBlogPosts();
  const categories = getUniqueCategories();
  const selectedCategory = params.category;

  // Filter posts by category if selected
  const filteredPosts = selectedCategory
    ? allPosts.filter((post) => post.category === selectedCategory)
    : allPosts;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-caption text-dark-700">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        / <span className="text-dark-900">Blog</span>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <AnimatedText
          text="Blog"
          textClassName="text-heading-1 text-dark-900 text-left"
          className="items-start mb-4"
        />
        <p className="text-body-large text-dark-700 max-w-2xl">
          Discover the latest trends, guides, and insights from the world of
          sneakers and footwear fashion.
        </p>
      </header>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="h-5 w-5 text-dark-500" />
          <h2 className="text-heading-4 text-dark-900">Categories</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full text-body font-medium transition-colors ${
              !selectedCategory
                ? "bg-dark-900 text-light-100"
                : "bg-light-200 text-dark-700 hover:bg-light-300"
            }`}
          >
            All Posts
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/blog?category=${encodeURIComponent(category)}`}
              className={`px-4 py-2 rounded-full text-body font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-dark-900 text-light-100"
                  : "bg-light-200 text-dark-700 hover:bg-light-300"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-lg border border-light-300 bg-light-100 p-12 text-center">
          <p className="text-body-medium text-dark-900 mb-2">
            No blog posts found
          </p>
          <p className="text-body text-dark-700">
            {selectedCategory
              ? `No posts in the "${selectedCategory}" category.`
              : "Check back soon for the latest news and updates."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-body text-dark-600">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
              {selectedCategory && ` in ${selectedCategory}`}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt}
                imageSrc={post.imageSrc}
                imageAlt={post.title}
                href={post.href}
                date={post.date}
                category={post.category}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

