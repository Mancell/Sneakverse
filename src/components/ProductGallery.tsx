"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useVariantStore } from "@/store/variant";

type Variant = {
  color: string;
  images: string[];
};

export interface ProductGalleryProps {
  productId: string;
  variants: Variant[];
  initialVariantIndex?: number;
  className?: string;
}

function isValidSrc(src: string | undefined | null): boolean {
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  return trimmed.length > 0 && (trimmed.startsWith("/") || trimmed.startsWith("http"));
}

const MAX_VISIBLE_THUMBNAILS = 4;

export default function ProductGallery({
  productId,
  variants,
  initialVariantIndex = 0,
  className = "",
}: ProductGalleryProps) {
  const validVariants = useMemo(
    () => variants.filter((v) => Array.isArray(v.images) && v.images.some(isValidSrc)),
    [variants]
  );

  const variantIndex =
    useVariantStore(
      (s) => s.selectedByProduct[productId] ?? Math.min(initialVariantIndex, Math.max(validVariants.length - 1, 0))
    );

  const images = useMemo(() => {
    const imgs = validVariants[variantIndex]?.images?.filter(isValidSrc) ?? [];
    console.log("[ProductGallery] Images for variant", variantIndex, ":", imgs.length, imgs);
    console.log("[ProductGallery] Valid variants:", validVariants.length);
    return imgs;
  }, [validVariants, variantIndex]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(0);
    setImageErrors(new Set());
    setThumbnailScrollIndex(0);
  }, [variantIndex]);

  // Auto-scroll thumbnails when active index changes
  useEffect(() => {
    if (activeIndex < thumbnailScrollIndex) {
      // Active image is above visible area, scroll up
      setThumbnailScrollIndex(activeIndex);
    } else if (activeIndex >= thumbnailScrollIndex + MAX_VISIBLE_THUMBNAILS) {
      // Active image is below visible area, scroll down
      setThumbnailScrollIndex(activeIndex - MAX_VISIBLE_THUMBNAILS + 1);
    }
  }, [activeIndex, thumbnailScrollIndex]);

  const handleImageError = useCallback((index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (images.length === 0) return;
      setActiveIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!mainRef.current) return;
      if (!document.activeElement) return;
      if (!mainRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Show up to 4 thumbnails at a time, with scroll if more
  const canScrollUp = thumbnailScrollIndex > 0;
  const canScrollDown = images.length > MAX_VISIBLE_THUMBNAILS && thumbnailScrollIndex < images.length - MAX_VISIBLE_THUMBNAILS;

  const visibleThumbnails = images.slice(
    thumbnailScrollIndex,
    thumbnailScrollIndex + MAX_VISIBLE_THUMBNAILS
  );

  const scrollThumbnails = useCallback((direction: -1 | 1) => {
    setThumbnailScrollIndex((prev) => {
      if (direction === -1) {
        return Math.max(0, prev - 1);
      } else {
        return Math.min(images.length - MAX_VISIBLE_THUMBNAILS, prev + 1);
      }
    });
  }, [images.length]);

  // Always show 4 thumbnails - fill with placeholders if needed
  // If we have more than 4 images, use scroll functionality
  // If we have 4 or fewer, show all images and fill remaining slots with placeholders
  const hasMoreThanMax = images.length > MAX_VISIBLE_THUMBNAILS;
  const displayThumbnails = hasMoreThanMax
    ? visibleThumbnails // Use scrollable thumbnails if more than 4
    : images.length > 0
    ? [...images, ...Array.from({ length: MAX_VISIBLE_THUMBNAILS - images.length }).map(() => null)] // Fill with placeholders
    : Array.from({ length: MAX_VISIBLE_THUMBNAILS }).map(() => null); // All placeholders if no images

  return (
    <section className={`flex w-full flex-col gap-4 lg:flex-row ${className}`}>
      {/* Thumbnail sidebar - always shows 4 thumbnails */}
      <div className="order-2 lg:order-1 lg:flex-shrink-0">
        <div className="flex flex-col gap-3 relative">
          {/* Scroll up button (only show if can scroll and has more than 4 images) */}
          {canScrollUp && hasMoreThanMax && (
            <button
              onClick={() => scrollThumbnails(-1)}
              className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white shadow-md p-1.5 ring-1 ring-light-300 hover:bg-light-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
              aria-label="Scroll thumbnails up"
            >
              <ChevronLeft className="h-4 w-4 text-dark-900 rotate-90" />
            </button>
          )}

          {/* Thumbnail container with fixed height for 4 items */}
          <div className="flex flex-col gap-3 overflow-hidden" style={{ height: `${MAX_VISIBLE_THUMBNAILS * 80 + (MAX_VISIBLE_THUMBNAILS - 1) * 12}px` }}>
            {displayThumbnails.map((src, relativeIndex) => {
              // Calculate absolute index for scrollable mode
              const absoluteIndex = hasMoreThanMax 
                ? thumbnailScrollIndex + relativeIndex 
                : relativeIndex;
              const hasError = src ? imageErrors.has(absoluteIndex) : false;
              const isEmpty = !src;
              const isActive = absoluteIndex === activeIndex && !isEmpty;
              
              return (
                <button
                  key={src ? `${src}-${absoluteIndex}` : `placeholder-${relativeIndex}`}
                  aria-label={src ? `Thumbnail ${absoluteIndex + 1}` : `Empty thumbnail ${relativeIndex + 1}`}
                  onClick={() => src && setActiveIndex(absoluteIndex)}
                  disabled={isEmpty}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg ring-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${
                    isEmpty
                      ? "ring-light-300 bg-light-200 cursor-not-allowed opacity-50"
                      : isActive
                      ? "ring-dark-900 scale-105 shadow-lg"
                      : "ring-light-300 hover:ring-dark-500 cursor-pointer"
                  }`}
                >
                  {isEmpty ? (
                    <div className="flex h-full w-full items-center justify-center bg-light-200">
                      <ImageOff className="h-5 w-5 text-dark-500" />
                    </div>
                  ) : hasError ? (
                    <div className="flex h-full w-full items-center justify-center bg-light-200">
                      <ImageOff className="h-5 w-5 text-dark-500" />
                    </div>
                  ) : (
                    <Image
                      src={src}
                      alt={`Thumbnail ${absoluteIndex + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={() => handleImageError(absoluteIndex)}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll down button (only show if can scroll and has more than 4 images) */}
          {canScrollDown && hasMoreThanMax && (
            <button
              onClick={() => scrollThumbnails(1)}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white shadow-md p-1.5 ring-1 ring-light-300 hover:bg-light-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
              aria-label="Scroll thumbnails down"
            >
              <ChevronRight className="h-4 w-4 text-dark-900 rotate-90" />
            </button>
          )}
        </div>
      </div>

      <div ref={mainRef} className="order-1 relative w-full h-[400px] overflow-hidden rounded-xl bg-light-200 lg:order-2">
        {images.length > 0 && !imageErrors.has(activeIndex) ? (
          <>
            <Image
              src={images[activeIndex]}
              alt="Product image"
              fill
              sizes="(min-width:1024px) 720px, 100vw"
              className="object-cover"
              priority
              onError={() => handleImageError(activeIndex)}
            />

            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <button
                  aria-label="Previous image"
                  onClick={() => go(-1)}
                  className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
                >
                  <ChevronLeft className="h-5 w-5 text-dark-900" />
                </button>
                <button
                  aria-label="Next image"
                  onClick={() => go(1)}
                  className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
                >
                  <ChevronRight className="h-5 w-5 text-dark-900" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-dark-700">
            <div className="flex items-center gap-2 rounded-lg border border-light-300 bg-light-100 px-4 py-3">
              <ImageOff className="h-5 w-5" />
              <span className="text-body">No images available</span>
            </div>
          </div>
        )}
      </div>

    </section>
  );
}
