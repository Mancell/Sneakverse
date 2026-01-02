import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Card, CollapsibleSection, ProductGallery } from "@/components";
import { Heart, Star } from "lucide-react";
import ColorSwatches from "@/components/ColorSwatches";
import AmazonButton from "@/components/AmazonButton";
import TikTokVideoCards from "@/components/TikTokVideoCards";
import YouTubeVideoCards from "@/components/YouTubeVideoCards";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { getProduct, getProductReviews, getAllProductReviews, getRecommendedProducts, getTikTokVideos, getYouTubeVideos, getProductRating, getProductPriceHistory, type Review, type RecommendedProduct, type FullProduct, type PriceHistoryPoint } from "@/lib/actions/product";
import type { TikTokVideo } from "@/components/TikTokVideoCard";
import type { YouTubeVideo } from "@/components/YouTubeVideoCard";
import PriceHistorySection from "@/components/PriceHistorySection";
import ProductPageNavigation from "@/components/ProductPageNavigation";

type GalleryVariant = { color: string; images: string[] };

function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) return undefined;
  return `$${price.toFixed(2)}`;
}

async function ProductRating({ productId }: { productId: string }) {
  const [rating, reviews] = await Promise.all([
    getProductRating(productId),
    getProductReviews(productId)
  ]);
  
  if (!rating || rating.count === 0) {
    return null;
  }

  // Son 4 review'dan kullanıcı bilgilerini al (avatar için)
  const recentReviewers = reviews.slice(0, 4);
  
  // Placeholder avatar URL'leri (kullanıcı resimleri yoksa)
  const avatarUrls = [
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop',
    'https://randomuser.me/api/portraits/men/75.jpg',
  ];

  return (
    <div className="flex items-center divide-x divide-gray-300">
      {/* User Avatars */}
      <div className="flex -space-x-3 pr-3">
        {recentReviewers.map((review, index) => {
          const zIndex = index + 1;
          return (
            <div
              key={review.id}
              className="w-12 h-12 rounded-full border-2 border-white hover:-translate-y-1 transition overflow-hidden bg-gray-200 relative"
              style={{ zIndex }}
            >
              <Image 
                src={avatarUrls[index] || avatarUrls[0]} 
                alt={review.author}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
        {recentReviewers.length < 4 && (
          // Eksik avatar'lar için placeholder
          Array.from({ length: 4 - recentReviewers.length }).map((_, i) => {
            const zIndex = recentReviewers.length + i + 1;
            return (
              <div
                key={`placeholder-${i}`}
                className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 hover:-translate-y-1 transition relative"
                style={{ zIndex }}
              />
            );
          })
        )}
      </div>

      {/* Rating Info */}
      <div className="pl-3">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((i) => {
            const isFullStar = i <= Math.floor(rating.average);
            return (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFullStar ? "#FACC15" : "none"}
                stroke={isFullStar ? "#FACC15" : "#D1D5DB"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
              </svg>
            );
          })}
          <p className="text-gray-600 font-medium ml-2">{rating.average.toFixed(1)}</p>
        </div>
        <p className="text-sm text-gray-500">
          Trusted by <span className="font-medium text-gray-800">{rating.count}+</span> users
        </p>
      </div>
    </div>
  );
}

function NotFoundBlock() {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-light-300 bg-light-100 p-8 text-center">
      <h1 className="text-heading-3 text-dark-900">Product not found</h1>
      <p className="mt-2 text-body text-dark-700">The product you’re looking for doesn’t exist or may have been removed.</p>
      <div className="mt-6">
        <Link
          href="/products"
          className="inline-block rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}

async function ReviewsSection({ productId }: { productId: string }) {
  const reviews = await getAllProductReviews(productId);
  console.log('[ReviewsSection] ProductId:', productId);
  console.log('[ReviewsSection] Reviews count:', reviews.length);
  
  // Use manual rating if available, otherwise calculate from reviews
  const ratingData = await getProductRating(productId);
  const count = ratingData?.count || reviews.length;
  const avg = ratingData?.average || (reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0);

  // Get top reviews: sort by rating (highest first), then by date (newest first), limit to 5
  const topReviews = [...reviews]
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating; // Higher rating first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newer first
    })
    .slice(0, 5);

  return (
    <section id="customer-reviews" className="rounded-lg border border-light-300 bg-white p-6 scroll-mt-24">
      {/* Header Section */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <div className="mb-4">
          <AnimatedText 
            text="Customer Reviews" 
            textClassName="text-heading-3 text-dark-900 text-left"
            className="items-start"
          />
        </div>
        
        {count > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => {
                const isFullStar = i <= Math.floor(avg);
                return (
                  <Star
                    key={i}
                    className={`h-6 w-6 ${isFullStar ? "fill-[#FFA41C] text-[#FFA41C]" : "text-gray-300"}`}
                  />
                );
              })}
            </div>
            <span className="text-2xl font-semibold text-dark-900">
              {avg.toFixed(1)} out of 5
            </span>
            <span className="text-sm text-gray-600 ml-2">
              ({count} {count === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        )}
      </div>

      {/* Top reviews from our customers */}
      {topReviews.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-dark-900">
            Top reviews from our customers
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {topReviews.map((review) => {
              // Parse reviewer name (could be "FirstName LastName" or just a single name)
              const reviewerNameParts = review.author?.split(' ') || [];
              const firstName = reviewerNameParts[0] || review.author || 'Anonymous';
              const lastName = reviewerNameParts.slice(1).join(' ') || '';
              
              return (
                <div 
                  key={review.id} 
                  className="border border-gray-200 rounded bg-white p-4 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="mb-3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-[#FFA41C] text-[#FFA41C]" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-dark-900">
                        {review.rating}.0 out of 5
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-dark-900 mb-1">
                      {review.author || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Verified Purchase</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex-1 flex flex-col">
                    <p className="text-xs text-gray-800 leading-relaxed flex-1">
                      {review.content || 'No comment provided.'}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                    <button className="flex items-center gap-1 hover:text-[#FFA41C] transition-colors">
                      <span>Helpful</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>(0)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-body text-dark-700">No customer reviews yet.</p>
          <p className="text-caption text-dark-500 mt-2">Be the first to review this product!</p>
        </div>
      )}
    </section>
  );
}

async function AlsoLikeSection({ productId }: { productId: string }) {
  const recs: RecommendedProduct[] = await getRecommendedProducts(productId);
  
  if (!recs.length) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {recs.map((p) => (
          <Card
            key={p.id}
            title={p.title}
            imageSrc={p.imageUrl}
            price={p.price ?? undefined}
            href={`/products/${p.id}`}
            size="small"
          />
        ))}
      </div>
    </section>
  );
}

function transformProductToGalleryVariants(data: FullProduct): GalleryVariant[] {
  const { variants, images } = data;
  
  if (!images || !Array.isArray(images)) return [];

  // Collect all images from the product (both variant-specific and generic)
  const allImages = images
    .filter((img) => img && typeof img.url === 'string' && img.url.trim().length > 0)
    .sort((a, b) => {
      // Primary images first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      // Then by sort order
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .map((img) => img.url);
  
  // If we have images, return them as a single variant
  if (allImages.length > 0) {
    // Try to get the color from the first variant, or use "Default"
    const firstVariant = variants?.find((v) => v.color);
    const colorName = firstVariant?.color?.name || "Default";
    
    return [{ color: colorName, images: allImages }];
  }
  
  if (!variants || !Array.isArray(variants)) return [];

  // Fallback: group by variant color if no direct images
  const variantMap = new Map<string, string[]>();
  
  variants.forEach((variant) => {
    if (!variant || !variant.color) return;
    const colorName = variant.color.name;
    const variantImages = images
      .filter((img) => img && img.variantId === variant.id && typeof img.url === 'string' && img.url.trim().length > 0)
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      })
      .map((img) => img.url);
    
    if (variantImages.length > 0) {
      variantMap.set(colorName, variantImages);
    }
  });
  
  if (variantMap.size > 0) {
    return Array.from(variantMap.entries()).map(([color, images]) => ({
      color,
      images,
    }));
  }
  
  // No images found
  return [];
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProduct(id);

  if (!data) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="py-4 text-caption text-dark-700">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
          <span className="text-dark-900">Not found</span>
        </nav>
        <NotFoundBlock />
      </main>
    );
  }

  const { product, variants } = data;

  // Check if product is published
  if (!product.isPublished) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="py-4 text-caption text-dark-700">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
          <span className="text-dark-900">Not found</span>
        </nav>
        <NotFoundBlock />
      </main>
    );
  }

  const galleryVariants: GalleryVariant[] = transformProductToGalleryVariants(data);
  
  // Debug: Log gallery variants and images
  console.log("[ProductDetailPage] Gallery variants:", galleryVariants);
  console.log("[ProductDetailPage] Total images:", data.images.length);
  console.log("[ProductDetailPage] Variants:", variants.length);

  // Get default variant or first variant
  const defaultVariant =
    variants.find((v) => v.id === product.defaultVariantId) || variants[0];

  if (!defaultVariant) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="py-4 text-caption text-dark-700">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
          <span className="text-dark-900">{product.name}</span>
        </nav>
        <section className="mx-auto max-w-3xl rounded-xl border border-light-300 bg-light-100 p-8 text-center">
          <h1 className="text-heading-3 text-dark-900">Product details unavailable</h1>
          <p className="mt-2 text-body text-dark-700">This product is currently unavailable for viewing.</p>
        </section>
      </main>
    );
  }

  const basePrice = Number(defaultVariant.price);
  const salePrice = defaultVariant.salePrice ? Number(defaultVariant.salePrice) : null;

  const displayPrice = salePrice !== null && !Number.isNaN(salePrice) ? salePrice : basePrice;
  const compareAt = salePrice !== null && !Number.isNaN(salePrice) ? basePrice : null;

  const discount =
    compareAt && displayPrice && compareAt > displayPrice
      ? Math.round(((compareAt - displayPrice) / compareAt) * 100)
      : null;

  const subtitle = product.gender?.label ? `${product.gender.label} Shoes` : undefined;

  // Helper to validate brand logo URL
  const brandLogoUrl = product.brand?.logoUrl && 
    (product.brand.logoUrl.startsWith('/') || product.brand.logoUrl.startsWith('http')) 
    ? product.brand.logoUrl 
    : null;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="py-4 text-caption text-dark-700">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
          <span className="text-dark-900">{product.name}</span>
        </nav>

      <section className="grid grid-cols-1 gap-6 md:gap-10 lg:grid-cols-[1fr_480px]">
        {/* Left side: Gallery */}
        <div className="flex flex-col gap-6 relative">
          {brandLogoUrl && (
            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <Image
                src={brandLogoUrl}
                alt={product.brand?.name || "Brand Logo"}
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          )}
          {galleryVariants.length > 0 ? (
            <ProductGallery productId={product.id} variants={galleryVariants} />
          ) : (
            <div className="flex h-[500px] items-center justify-center rounded-xl border border-light-300 bg-light-100">
              <p className="text-body text-dark-700">No images available</p>
            </div>
          )}
        </div>

        {/* Right side: Product info, price, buttons */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:h-fit">
          {/* Product Rating - Top Right */}
          <ProductRating productId={product.id} />
          
          <header className="flex flex-col gap-2">
            <h1 className="text-heading-2 text-dark-900">{product.name}</h1>
            {subtitle && <p className="text-body text-dark-700">{subtitle}</p>}
          </header>

          <div className="flex items-center gap-3">
            <p className="text-lead text-dark-900">{formatPrice(displayPrice)}</p>
            {compareAt && (
              <>
                <span className="text-body text-dark-700 line-through">{formatPrice(compareAt)}</span>
                {discount !== null && (
                  <span className="rounded-full border border-light-300 px-2 py-1 text-caption text-[--color-green]">
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          {galleryVariants.length > 0 && (
            <ColorSwatches productId={product.id} variants={galleryVariants} />
          )}

          <div className="flex flex-col gap-3">
            {product.amazonUrl ? (
              <AmazonButton url={product.amazonUrl} />
            ) : null}
            <button className="flex items-center justify-center gap-2 rounded-full border border-light-300 px-6 py-4 text-body-medium text-dark-900 transition hover:border-dark-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]">
              <Heart className="h-5 w-5" />
              Favorite
            </button>
          </div>
        </div>
      </section>

      {/* Page Navigation */}
      <ProductPageNavigation />

      {/* Full width sections below */}
      <div className="mt-10 space-y-10">
        {/* Product Details Section - Full width */}
        <section id="product-details" className="rounded-lg border border-light-300 bg-light-100 p-6 scroll-mt-24">
          <div className="mb-6">
            <AnimatedText 
              text="Product Details" 
              textClassName="text-heading-3 text-dark-900 text-left"
              className="items-start"
            />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-body text-dark-700 whitespace-pre-line">{product.description}</p>
            </div>
            
            {/* Additional product information */}
            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-light-300 sm:grid-cols-2 md:grid-cols-4">
              {product.brand && (
                <div>
                  <p className="text-caption font-medium text-dark-500 mb-1">Brand</p>
                  <p className="text-body text-dark-900">{product.brand.name}</p>
                </div>
              )}
              {product.category && (
                <div>
                  <p className="text-caption font-medium text-dark-500 mb-1">Category</p>
                  <p className="text-body text-dark-900">{product.category.name}</p>
                </div>
              )}
              {product.gender && (
                <div>
                  <p className="text-caption font-medium text-dark-500 mb-1">Gender</p>
                  <p className="text-body text-dark-900">{product.gender.label}</p>
                </div>
              )}
              {defaultVariant && defaultVariant.weight && (
                <div>
                  <p className="text-caption font-medium text-dark-500 mb-1">Weight</p>
                  <p className="text-body text-dark-900">{defaultVariant.weight} kg</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* TikTok Videos Section - Full width */}
        <Suspense
          fallback={
            <section className="mt-6">
              <div className="mb-6">
                <AnimatedText 
                  text="TikTok" 
                  textClassName="text-heading-3 text-dark-900 text-left"
                  className="items-start"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[400px] animate-pulse rounded-xl bg-light-200" />
                ))}
              </div>
            </section>
          }
        >
          <TikTokVideosSection productId={product.id} />
        </Suspense>

        {/* YouTube Videos Section - Full width */}
        <Suspense
          fallback={
            <section className="mt-6">
              <div className="mb-6">
                <AnimatedText 
                  text="YouTube" 
                  textClassName="text-heading-3 text-dark-900 text-left"
                  className="items-start"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[400px] animate-pulse rounded-xl bg-light-200" />
                ))}
              </div>
            </section>
          }
        >
          <YouTubeVideosSection productId={product.id} />
        </Suspense>

        {/* Customer Reviews Section - Full width */}
        <Suspense
          fallback={
            <section className="rounded-lg border border-light-300 bg-light-100 p-6">
              <div className="mb-6">
                <AnimatedText 
                  text="Customer Reviews" 
                  textClassName="text-heading-3 text-dark-900 text-left"
                  className="items-start"
                />
              </div>
              <p className="text-body text-dark-700">Loading reviews…</p>
            </section>
          }
        >
          <ReviewsSection productId={product.id} />
        </Suspense>

        {/* Price History Chart Section - Full width */}
        <div id="price-history" className="scroll-mt-24">
          <Suspense
            fallback={
              <div className="mt-6 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-body text-dark-700">Loading price history...</p>
                </div>
              </div>
            }
          >
            <PriceHistorySectionWrapper productId={product.id} />
          </Suspense>
        </div>
      </div>

      <Suspense
        fallback={
          <section className="mt-16">
            <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-light-200" />
              ))}
            </div>
          </section>
        }
      >
        <AlsoLikeSection productId={product.id} />
      </Suspense>
    </main>
  );
}

// TikTok Videos Section Component
async function TikTokVideosSection({ productId }: { productId: string }) {
  const videos = await getTikTokVideos(productId);
  
  console.log('[TikTokVideosSection] Product ID:', productId);
  console.log('[TikTokVideosSection] Videos count:', videos.length);
  console.log('[TikTokVideosSection] Videos:', videos);
  
  if (videos.length === 0) return null;

  // Convert TikTokVideoCard to TikTokVideo format
  const formattedVideos: TikTokVideo[] = videos.map(v => ({
    id: v.id,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl ?? undefined,
    title: v.title ?? undefined,
    author: v.author ?? undefined,
    duration: v.duration ?? undefined,
  }));

  return <TikTokVideoCards videos={formattedVideos} title="TikTok" />;
}

// YouTube Videos Section Component
async function YouTubeVideosSection({ productId }: { productId: string }) {
  const videos = await getYouTubeVideos(productId);
  
  console.log('[YouTubeVideosSection] Product ID:', productId);
  console.log('[YouTubeVideosSection] Videos count:', videos.length);
  console.log('[YouTubeVideosSection] Videos:', videos);
  
  if (videos.length === 0) return null;

  // Convert YouTubeVideoCard to YouTubeVideo format
  const formattedVideos: YouTubeVideo[] = videos.map(v => ({
    id: v.id,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl ?? undefined,
    title: v.title ?? undefined,
    author: v.author ?? undefined,
  }));

  return <YouTubeVideoCards videos={formattedVideos} title="YouTube" />;
}

// Price History Section Component
async function PriceHistorySectionWrapper({ productId }: { productId: string }) {
  console.log('[PriceHistorySectionWrapper] Starting, ProductId:', productId);
  
  try {
    const priceHistory = await getProductPriceHistory(productId, 12);
    console.log('[PriceHistorySectionWrapper] Price history count:', priceHistory.length);
    console.log('[PriceHistorySectionWrapper] Price history data:', priceHistory);
    
    // Pass data to client component
    return <PriceHistorySection data={priceHistory} productId={productId} />;
  } catch (error) {
    console.error('[PriceHistorySectionWrapper] Error:', error);
    return <PriceHistorySection data={[]} productId={productId} />;
  }
}
