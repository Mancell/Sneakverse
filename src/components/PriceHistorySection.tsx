"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PriceHistoryPoint } from "@/lib/actions/product";

// Lazy load PriceHistoryChart (Recharts is large)
const PriceHistoryChart = dynamic(() => import('@/components/PriceHistoryChart'), {
  loading: () => (
    <div className="w-full min-h-[320px] h-[320px] flex items-center justify-center bg-gray-50/50 rounded-lg">
      <p className="text-body text-dark-700">Loading chart...</p>
    </div>
  ),
  ssr: false // Recharts needs client-side
});

interface PriceHistorySectionProps {
  data: PriceHistoryPoint[];
  productId: string;
}

export default function PriceHistorySection({ data, productId }: PriceHistorySectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Chart'ı görünür olduktan sonra mount et
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`price-history-${productId}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [productId]);

  // Container with explicit height to prevent chart sizing issues
  return (
    <div id={`price-history-${productId}`} className="mt-6 min-h-[400px]">
      {isVisible ? (
        <PriceHistoryChart key={productId} data={data} />
      ) : (
        <div className="w-full min-h-[320px] h-[320px] flex items-center justify-center bg-gray-50/50 rounded-lg">
          <p className="text-body text-dark-700">Loading chart...</p>
        </div>
      )}
    </div>
  );
}

