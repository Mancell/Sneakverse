import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card } from "@/components";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { getAllProducts } from "@/lib/actions/product";
import { getAllBlogPosts } from "@/lib/data/blog";

// Lazy load blog section
const BlogCard = dynamic(() => import('@/components/BlogCard'), {
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-light-200" />
});

// Blog section component - lazy loaded
async function BlogSection() {
  const allBlogPosts = getAllBlogPosts();
  const blogPosts = allBlogPosts.slice(0, 3);

  if (!blogPosts || blogPosts.length === 0) {
    return (
      <div className="rounded-lg border border-light-300 bg-light-100 p-12 text-center">
        <p className="text-body-medium text-dark-900 mb-2">No blog posts available</p>
        <p className="text-body text-dark-700">Check back soon for the latest news and updates.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {blogPosts.map((post) => (
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
  );
}

const Home = async () => {
  // Parallel data fetching - products ve blog posts aynı anda çekiliyor
  const [{ products }] = await Promise.all([
    getAllProducts({
      search: undefined,
      genderSlugs: [],
      brandSlugs: [],
      categorySlugs: [],
      sizeSlugs: [],
      colorSlugs: [],
      priceMin: undefined,
      priceMax: undefined,
      priceRanges: [],
      sort: "newest",
      page: 1,
      limit: 4,
    }),
  ]);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden" style={{ aspectRatio: '1440/600', height: '600px' }}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Diagonal Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-pink-400/80 via-orange-400/60 to-gray-200/40" 
             style={{
               clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)'
             }}
        />

        {/* Content Container */}
        <div className="relative z-20 mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-12 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center h-full py-6 lg:py-8">
            {/* Left Side - Text Content */}
            <div className="space-y-4 lg:space-y-5 text-dark-900">
              <p className="text-xs lg:text-sm font-semibold text-pink-600 uppercase tracking-wider">
                Bold & Sporty
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Style That Moves With You.
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-dark-700 max-w-lg leading-relaxed">
                Not just style. Not just comfort. Footwear that effortlessly moves with your every step.
              </p>
              <Link
                href="/products"
                className="inline-block bg-dark-900 text-light-100 px-6 lg:px-8 py-3 lg:py-4 rounded-lg font-semibold text-base lg:text-lg hover:bg-dark-800 transition-colors"
              >
                Find Your Shoe
              </Link>
            </div>

            {/* Right Side - Shoe Image with Overlays */}
            <div className="relative h-[350px] lg:h-[450px] xl:h-[500px] flex items-center justify-center">
              {/* Shoe Image */}
              <div className="relative z-30 w-full h-full">
                <Image
                  src="/hero-shoe.png"
                  alt="Nike Air Jordan"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Text Overlays */}
              <div className="absolute inset-0 z-40 pointer-events-none">
                <div className="absolute top-6 left-2 lg:top-12 lg:left-6 xl:top-16 xl:left-8">
                  <span className="text-5xl lg:text-7xl xl:text-8xl font-black text-orange-500 leading-none">
                    AIR
                  </span>
                </div>
                <div className="absolute bottom-12 right-2 lg:bottom-20 lg:right-6 xl:bottom-28 xl:right-8">
                  <span className="text-4xl lg:text-6xl xl:text-7xl font-black text-dark-900 leading-none">
                    JORDEN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products Section */}
      <section aria-labelledby="latest" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div id="latest" className="mb-6">
          <AnimatedText 
            text="Latest shoes" 
            textClassName="text-heading-3 text-dark-900 text-left"
            className="items-start"
          />
        </div>
        {products.length === 0 ? (
          <div className="rounded-lg border border-light-300 bg-light-100 p-12 text-center">
            <p className="text-body-medium text-dark-900 mb-2">No products found</p>
            <p className="text-body text-dark-700">Products will appear here once they are added to the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => {
              const price = p.minPrice !== null && p.maxPrice !== null && p.minPrice !== p.maxPrice
                ? `$${p.minPrice.toFixed(2)} - $${p.maxPrice.toFixed(2)}`
                : p.minPrice !== null
                ? `$${p.minPrice.toFixed(2)}`
                : undefined;
              
              return (
                <Card
                  key={p.id}
                  title={p.name}
                  subtitle={p.subtitle ?? undefined}
                  imageSrc={p.imageUrl ?? "/shoes/shoe-1.jpg"}
                  price={price}
                  href={`/products/${p.id}`}
                  brandName={p.brandName ?? undefined}
                  brandLogoUrl={p.brandLogoUrl ?? undefined}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Blog Section - Lazy loaded with Suspense */}
      <section aria-labelledby="blog" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 bg-light-100/50">
        <div id="blog" className="mb-8 flex items-center justify-between">
          <AnimatedText 
            text="Blog" 
            textClassName="text-heading-3 text-dark-900 text-left"
            className="items-start"
          />
          <Link
            href="/blog"
            prefetch={true}
            className="text-body font-semibold text-dark-900 hover:text-dark-700 transition-colors underline"
          >
            View All →
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-light-200" />
              ))}
            </div>
          }
        >
          <BlogSection />
        </Suspense>
      </section>
    </main>
  );
};

export default Home;
