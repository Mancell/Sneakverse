"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { searchProducts, searchBrands } from "@/lib/actions/search";
import type { ProductListItem } from "@/lib/actions/product";
import Image from "next/image";

// Optimized debounce hook
function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export function ProductSearchBar() {
  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  // Load brands once on mount
  useEffect(() => {
    searchBrands("").then((brandResults) => {
      setBrands(brandResults);
    }).catch((error) => {
      console.error("[ProductSearchBar] Error loading brands:", error);
    });
  }, []);

  // Search products when query changes - optimized
  useEffect(() => {
    if (!isFocused) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const trimmedQuery = debouncedQuery.trim();
    
    // Minimum 2 characters before searching
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    
    searchProducts(trimmedQuery, 8)
      .then((productResults) => {
        if (!cancelled) {
          setProducts(productResults);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[ProductSearchBar] Search error:", error);
          setProducts([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(query.trim())}`;
    }
  };

  const showResults = isFocused && (brands.length > 0 || products.length > 0 || isLoading || query.trim().length >= 2);

  return (
    <div className="w-full max-w-sm relative z-[60]">
      <form onSubmit={handleSubmit} className="relative">
        <input
          id="search"
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full h-12 pl-4 pr-12 py-2.5 text-base rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
      </form>

      {/* Results dropdown - simplified for performance */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 w-full mt-2 z-[60] bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {query.trim().length === 0 ? (
            // Show brands when no query
            <>
              <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 uppercase">Popular Brands</p>
              </div>
              {brands.length > 0 ? (
                <ul className="py-1">
                  {brands.map((brand) => (
                    <li key={brand.id}>
                      <Link
                        href={`/products?brand=${brand.slug}`}
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsFocused(false)}
                      >
                        {brand.logoUrl ? (
                          <div className="w-6 h-6 relative flex-shrink-0">
                            <Image
                              src={brand.logoUrl}
                              alt={brand.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : null}
                        <span className="text-sm font-medium text-gray-900">{brand.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">Loading brands...</p>
                </div>
              )}
            </>
          ) : (
            // Show products when query exists
            <>
              {isLoading ? (
                <div className="px-4 py-8 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mb-2"></div>
                  <p className="text-sm text-gray-600">Searching...</p>
                </div>
              ) : products.length > 0 ? (
                <ul className="py-1">
                  {products.map((product) => {
                    const price = product.minPrice !== null && product.maxPrice !== null && product.minPrice !== product.maxPrice
                      ? `$${product.minPrice.toFixed(2)} - $${product.maxPrice.toFixed(2)}`
                      : product.minPrice !== null
                      ? `$${product.minPrice.toFixed(2)}`
                      : "Price unavailable";
                    
                    return (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.id}`}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsFocused(false)}
                        >
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Search className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            {product.brandName && (
                              <p className="text-xs text-gray-600 mt-0.5">{product.brandName}</p>
                            )}
                            <p className="text-xs font-medium text-gray-900 mt-1">{price}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : query.trim().length >= 2 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-gray-700">No results found</p>
                  <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
