import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import BlogCard from "@/components/BlogCard";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import {
  getBlogPostBySlug,
  getAllBlogPosts,
  getBlogPostsByCategory,
} from "@/lib/data/blog";
import { notFound } from "next/navigation";

// Base URL for SEO
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Blog Post Not Found",
      description: "The blog post you're looking for doesn't exist.",
    };
  }

  const url = `${baseUrl}${post.href}`;
  const imageUrl = `${baseUrl}${post.imageSrc}`;
  const description = post.excerpt || `${post.title} - Read the full article on our blog.`;

  return {
    title: `${post.title} | Nike Blog`,
    description: description,
    keywords: [
      post.category.toLowerCase(),
      "sneakers",
      "shoes",
      "footwear",
      "fashion",
      "nike",
      ...post.title.toLowerCase().split(" "),
    ],
    authors: [{ name: "Nike" }],
    creator: "Nike",
    publisher: "Nike",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: description,
      url: url,
      siteName: "Nike",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      section: post.category,
      tags: [post.category, "sneakers", "footwear"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: description,
      images: [imageUrl],
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
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post || !post.content) {
    notFound();
  }

  // Get related posts (same category, excluding current post)
  const relatedPosts = getBlogPostsByCategory(post.category)
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  // Get all categories for navigation
  const allPosts = getAllBlogPosts();

  // Prepare structured data for SEO
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: `${baseUrl}${post.imageSrc}`,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      "@type": "Organization",
      name: "Nike",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Nike",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}${post.href}`,
    },
    articleSection: post.category,
    keywords: [post.category, "sneakers", "shoes", "footwear", "fashion"],
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${baseUrl}${post.href}`,
      },
    ],
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nike",
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    sameAs: [
      "https://www.facebook.com/nike",
      "https://www.twitter.com/nike",
      "https://www.instagram.com/nike",
    ],
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb with structured data */}
      <nav className="mb-6 text-caption text-dark-700" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2" itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/" className="hover:underline" itemProp="item">
              <span itemProp="name">Home</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <span className="text-dark-500">/</span>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/blog" className="hover:underline" itemProp="item">
              <span itemProp="name">Blog</span>
            </Link>
            <meta itemProp="position" content="2" />
          </li>
          <span className="text-dark-500">/</span>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span className="text-dark-900" itemProp="name">{post.title}</span>
            <meta itemProp="position" content="3" />
          </li>
        </ol>
      </nav>

      {/* Back Button */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 mb-6 text-body text-dark-700 hover:text-dark-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <div className="mb-4">
          <Link
            href={`/blog?category=${encodeURIComponent(post.category)}`}
            className="inline-flex items-center gap-2 rounded-full bg-dark-900 px-4 py-2 text-xs font-semibold text-light-100 uppercase tracking-wide hover:bg-dark-800 transition-colors"
          >
            <Tag className="h-3.5 w-3.5" />
            {post.category}
          </Link>
        </div>

        <h1 className="text-heading-1 text-dark-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-body text-dark-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <time dateTime={post.date}>{post.date}</time>
          </div>
        </div>
      </header>

      {/* Featured Image with SEO optimization */}
      <div className="relative aspect-video w-full mb-8 rounded-xl overflow-hidden bg-light-200">
        <Image
          src={post.imageSrc}
          alt={`${post.title} - Featured image`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
        />
      </div>

      {/* Article Content with semantic HTML */}
      <article 
        className="prose prose-lg max-w-none mb-12"
        itemScope 
        itemType="https://schema.org/BlogPosting"
      >
        <meta itemProp="headline" content={post.title} />
        <meta itemProp="description" content={post.excerpt} />
        <meta itemProp="datePublished" content={new Date(post.date).toISOString()} />
        <meta itemProp="dateModified" content={new Date(post.date).toISOString()} />
        <div itemProp="articleBody" className="text-body-large text-dark-900 leading-relaxed whitespace-pre-line">
          {post.content.split("\n\n").map((paragraph, index) => {
            // Check if paragraph is a heading
            if (paragraph.startsWith("## ")) {
              return (
                <h2
                  key={index}
                  className="text-heading-3 text-dark-900 mt-8 mb-4 font-bold"
                >
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3
                  key={index}
                  className="text-heading-4 text-dark-900 mt-6 mb-3 font-semibold"
                >
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            // Check if paragraph is a list item
            if (paragraph.startsWith("- ")) {
              const items = paragraph
                .split("\n")
                .filter((line) => line.startsWith("- "))
                .map((line) => line.replace("- ", ""));
              return (
                <ul key={index} className="list-disc list-inside mb-4 space-y-2">
                  {items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-body text-dark-700">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            // Regular paragraph
            return (
              <p key={index} className="text-body text-dark-700 mb-4">
                {paragraph}
              </p>
            );
          })}
        </div>
      </article>

      {/* Related Posts with internal linking for SEO */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-light-300" aria-labelledby="related-posts">
          <div className="mb-8">
            <h2 id="related-posts" className="sr-only">Related Blog Posts</h2>
            <AnimatedText
              text="Related Posts"
              textClassName="text-heading-3 text-dark-900 text-left"
              className="items-start"
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <BlogCard
                key={relatedPost.id}
                title={relatedPost.title}
                excerpt={relatedPost.excerpt}
                imageSrc={relatedPost.imageSrc}
                imageAlt={`${relatedPost.title} - Read more about ${relatedPost.category.toLowerCase()}`}
                href={relatedPost.href}
                date={relatedPost.date}
                category={relatedPost.category}
              />
            ))}
          </div>
        </section>
      )}

      {/* Additional Internal Links for SEO */}
      <nav className="mt-12 pt-8 border-t border-light-300" aria-label="Blog navigation">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-body text-dark-700 mb-2">Explore more:</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="text-body font-medium text-dark-900 hover:text-dark-700 underline"
              >
                All Blog Posts
              </Link>
              <span className="text-dark-400">•</span>
              <Link
                href={`/blog?category=${encodeURIComponent(post.category)}`}
                className="text-body font-medium text-dark-900 hover:text-dark-700 underline"
              >
                More {post.category} Posts
              </Link>
              <span className="text-dark-400">•</span>
              <Link
                href="/products"
                className="text-body font-medium text-dark-900 hover:text-dark-700 underline"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </main>
    </>
  );
}

