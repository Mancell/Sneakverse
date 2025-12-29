"use client";

import { useEffect, useState } from "react";

interface NavigationItem {
  id: string;
  label: string;
}

const navigationItems: NavigationItem[] = [
  { id: "product-details", label: "Product Details" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "customer-reviews", label: "Customer Reviews" },
  { id: "price-history", label: "Price History" },
];

export default function ProductPageNavigation() {
  const [activeSection, setActiveSection] = useState<string>("product-details");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show fixed navigation after scrolling 400px down
      setIsScrolled(scrollY > 400);

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
      const offset = isScrolled ? 100 : 150; // Different offset based on scroll position
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const NavContent = () => (
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
  );

  return (
    <>
      {/* Static navigation at the top (always visible) */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-light-300 shadow-sm">
        <NavContent />
      </nav>

      {/* Fixed navigation when scrolled */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-light-300 shadow-sm transition-transform duration-300 ${
          isScrolled ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <NavContent />
      </nav>
    </>
  );
}

