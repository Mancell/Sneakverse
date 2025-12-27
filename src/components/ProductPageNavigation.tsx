"use client";

import { useEffect, useState } from "react";

interface NavigationItem {
  id: string;
  label: string;
}

const navigationItems: NavigationItem[] = [
  { id: "product-details", label: "Product Details" },
  { id: "customer-reviews", label: "Customer Reviews" },
  { id: "tiktok", label: "TikTok" },
  { id: "price-history", label: "Price History" },
];

export default function ProductPageNavigation() {
  const [activeSection, setActiveSection] = useState<string>("product-details");

  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationItems.map((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: item.id,
            top: rect.top,
            bottom: rect.bottom,
          };
        }
        return null;
      }).filter(Boolean) as Array<{ id: string; top: number; bottom: number }>;

      // Find the section currently in view
      const viewportMiddle = window.innerHeight / 2;
      let currentSection = navigationItems[0].id;

      for (const section of sections) {
        if (section.top <= viewportMiddle && section.bottom >= viewportMiddle) {
          currentSection = section.id;
          break;
        }
      }

      // If no section is in the middle, check which one is closest to the top
      if (currentSection === navigationItems[0].id) {
        const closestSection = sections.reduce((prev, curr) => {
          return Math.abs(curr.top) < Math.abs(prev.top) ? curr : prev;
        });
        if (closestSection && closestSection.top < 200) {
          currentSection = closestSection.id;
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Offset from top
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-light-300 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 py-3 overflow-x-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === item.id
                  ? "bg-dark-900 text-white"
                  : "text-dark-700 hover:text-dark-900 hover:bg-dark-900/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

