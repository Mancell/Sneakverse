"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { TikTokVideoCard, type TikTokVideo } from "./TikTokVideoCard";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";

interface TikTokVideoCardsProps {
  videos: TikTokVideo[];
  title?: string;
}

export default function TikTokVideoCards({ videos, title = "TikTok" }: TikTokVideoCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [videos]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    const newScrollLeft =
      direction === "left"
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  if (videos.length === 0) return null;

  return (
    <section id="tiktok" className="mt-6 scroll-mt-24">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <AnimatedText 
            text={title} 
            textClassName="text-heading-3 text-dark-900 text-left"
            className="items-start"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="rounded-full border border-light-300 bg-white p-2 transition hover:border-dark-500 hover:bg-light-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-dark-900" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="rounded-full border border-light-300 bg-white p-2 transition hover:border-dark-500 hover:bg-light-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-dark-900" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            // Her zaman 3 kart görünsün: 360px * 3 + gap * 2 = 1080px + 32px = 1112px
            // Ama responsive için max-width kullanmayalım, sadece scroll yapalım
          }}
        >
          {videos.map((video) => (
            <div key={video.id} className="flex-shrink-0">
              <TikTokVideoCard 
                video={video} 
                isPlaying={playingVideoId === video.id}
                onPlayChange={(playing) => {
                  if (playing) {
                    setPlayingVideoId(video.id);
                  } else {
                    setPlayingVideoId(null);
                  }
                }}
                onHover={() => {
                  // Hover'da otomatik başlat
                  if (playingVideoId !== video.id) {
                    setPlayingVideoId(video.id);
                  }
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Scroll indicator - sağ tarafta */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
        )}
        {/* Scroll indicator - sol tarafta */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-4 w-20 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
        )}
      </div>
    </section>
  );
}

