"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Package, Tag } from "lucide-react";
import Link from "next/link";
import { searchProducts, searchBrands } from "@/lib/actions/search";
import type { ProductListItem } from "@/lib/actions/product";
import Image from "next/image";

// --- Hook Definition ---
function useDebounce<T>(value: T, delay = 500): T {
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

// --- Main Component ---
export function ProductSearchBar() {
  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: "brand" | "product"; id: string } | null>(null);
  const debouncedQuery = useDebounce(query, 100);

  // Load brands once on mount
  useEffect(() => {
    searchBrands("").then((brandResults) => {
      console.log("[ProductSearchBar] Initial brands loaded:", brandResults.length, brandResults);
      setBrands(brandResults);
    }).catch((error) => {
      console.error("[ProductSearchBar] Error loading brands:", error);
    });
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    // If no query, show brands immediately
    if (!debouncedQuery || debouncedQuery.trim().length === 0) {
      setProducts([]);
      setIsLoading(false);
      // Brands are already loaded, just show them
      return;
    }

    // Search products immediately when query exists
    let cancelled = false;
    setIsLoading(true);
    
    searchProducts(debouncedQuery.trim(), 8)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(query.trim())}`;
    }
  };

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: {
          duration: 0.4,
        },
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: {
          duration: 0.3,
        },
        opacity: {
          duration: 0.2,
        },
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };

  const handleFocus = () => {
    setSelectedItem(null);
    setIsFocused(true);
  };

  // Show results when focused - show brands if no query, or products if query exists
  const showResults = isFocused && (brands.length > 0 || products.length > 0 || isLoading);

  return (
    <div className="w-full max-w-sm relative z-[60]">
      <div className="relative">
        <motion.form 
          onSubmit={handleSubmit} 
          className="relative"
          initial={false}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Glow effect on focus */}
          <motion.div
            className="absolute -inset-0.5 rounded-xl opacity-0 blur"
            animate={{
              opacity: isFocused ? 0.3 : 0,
              background: isFocused 
                ? "linear-gradient(135deg, rgba(17, 17, 17, 0.4), rgba(17, 17, 17, 0.2))"
                : "transparent",
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Main input container */}
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="relative w-full h-12 pl-5 pr-14 py-2.5 text-base rounded-xl border-2 bg-white/95 backdrop-blur-sm text-dark-900 focus:outline-none focus:border-dark-900 focus:bg-white transition-all duration-300 placeholder:text-dark-500/60 shadow-lg hover:shadow-xl"
            />
            
            {/* Animated border gradient */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: isFocused
                  ? "linear-gradient(135deg, rgba(17, 17, 17, 0.1), rgba(17, 17, 17, 0.05))"
                  : "transparent",
              }}
              animate={{
                opacity: isFocused ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Icon container with enhanced styling */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="popLayout">
                {query.length > 0 ? (
                  <motion.button
                    type="submit"
                    key="send"
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 180, opacity: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    className="cursor-pointer p-1.5 rounded-lg bg-dark-900 text-white hover:bg-dark-700 transition-colors shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    className="p-1.5"
                  >
                    <Search className="w-5 h-5 text-dark-900" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.form>

        <div className="absolute top-full left-0 right-0 w-full mt-2 z-[60]">
          <AnimatePresence>
            {isFocused && !selectedItem && (
              <motion.div
                className="w-full border-2 border-dark-900/10 rounded-xl shadow-2xl overflow-hidden bg-white/98 backdrop-blur-md mt-1"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                {query.trim().length === 0 ? (
                  // Show brands when no query
                  <>
                    <div className="px-4 py-3 border-b border-dark-900/5 bg-gradient-to-r from-dark-900/5 to-transparent">
                      <p className="text-xs font-semibold text-dark-700 uppercase tracking-wider">Popular Brands ({brands.length})</p>
                    </div>
                    {brands.length > 0 ? (
                      <motion.ul className="py-1">
                        {brands.map((brand) => (
                          <motion.li
                            key={brand.id}
                            className="px-4 py-2.5 flex items-center justify-between hover:bg-dark-900/5 cursor-pointer transition-all duration-200 group"
                            variants={item}
                            layout
                            onClick={() => {
                              setSelectedItem({ type: "brand", id: brand.id });
                              setIsFocused(false);
                            }}
                            whileHover={{ x: 4 }}
                          >
                            <Link
                              href={`/products?brand=${brand.slug}`}
                              className="flex items-center justify-between w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem({ type: "brand", id: brand.id });
                                setIsFocused(false);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {brand.logoUrl ? (
                                  <div className="p-2 rounded-lg bg-dark-900/10 group-hover:bg-dark-900/20 transition-colors">
                                    <Image
                                      src={brand.logoUrl}
                                      alt={brand.name}
                                      width={20}
                                      height={20}
                                      className="object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded-lg bg-dark-900/10 group-hover:bg-dark-900/20 transition-colors">
                                    <Tag className="h-4 w-4 text-dark-900" />
                                  </div>
                                )}
                                <span className="text-sm font-medium text-dark-900 group-hover:text-dark-700">{brand.name}</span>
                              </div>
                            </Link>
                          </motion.li>
                        ))}
                      </motion.ul>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-dark-900/20 border-t-dark-900 mb-3"></div>
                        <p className="text-sm text-dark-500">Loading brands...</p>
                        <button 
                          onClick={() => {
                            console.log("Manual reload brands");
                            searchBrands("").then(setBrands);
                          }}
                          className="mt-3 text-xs text-dark-900 hover:text-dark-700 underline font-medium transition-colors"
                        >
                          Reload
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  // Show products when query exists
                  <>
                    {isLoading ? (
                      <div className="px-4 py-12 text-center">
                        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-dark-900/20 border-t-dark-900 mb-4"></div>
                        <p className="text-sm font-medium text-dark-700">Searching...</p>
                        <p className="text-xs text-dark-500 mt-1">Finding the best matches</p>
                      </div>
                    ) : products.length > 0 ? (
                      <motion.ul className="py-1">
                        {products.map((product) => {
                          const price = product.minPrice !== null && product.maxPrice !== null && product.minPrice !== product.maxPrice
                            ? `$${product.minPrice.toFixed(2)} - $${product.maxPrice.toFixed(2)}`
                            : product.minPrice !== null
                            ? `$${product.minPrice.toFixed(2)}`
                            : "Price unavailable";
                          
                          return (
                            <motion.li
                              key={product.id}
                              className="px-4 py-3 flex items-center gap-3 hover:bg-dark-900/5 cursor-pointer transition-all duration-200 group"
                              variants={item}
                              layout
                              whileHover={{ x: 4 }}
                            >
                              <Link
                                href={`/products/${product.id}`}
                                className="flex items-center gap-3 w-full"
                                onClick={() => {
                                  setSelectedItem({ type: "product", id: product.id });
                                  setIsFocused(false);
                                }}
                              >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-light-300 flex-shrink-0 ring-2 ring-dark-900/10 group-hover:ring-dark-900/20 transition-all">
                                  {product.imageUrl ? (
                                    <Image
                                      src={product.imageUrl}
                                      alt={product.name}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-dark-500 m-auto" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-dark-900 truncate group-hover:text-dark-700">{product.name}</p>
                                  {product.brandName && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {product.brandLogoUrl && (
                                        <Image
                                          src={product.brandLogoUrl}
                                          alt={product.brandName}
                                          width={20}
                                          height={20}
                                          className="object-contain flex-shrink-0"
                                        />
                                      )}
                                      <p className="text-xs text-dark-600">{product.brandName}</p>
                                    </div>
                                  )}
                                  <p className="text-xs font-medium text-dark-900 mt-1">{price}</p>
                                </div>
                              </Link>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    ) : (
                      <div className="px-4 py-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-dark-900/5 mb-3">
                          <Search className="w-6 h-6 text-dark-900" />
                        </div>
                        <p className="text-sm font-medium text-dark-700">No results found</p>
                        <p className="text-xs text-dark-500 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
