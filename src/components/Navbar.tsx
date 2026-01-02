"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductSearchBar } from "./ProductSearchBar";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";

const NAV_LINKS = [
  { label: "Men", href: "/products?gender=men" },
  { label: "Women", href: "/products?gender=women" },
  { label: "Kids", href: "/products?gender=unisex" },
  { label: "Best Week", href: "/best-week" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-light-100">
      <nav
        className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative"
        aria-label="Primary"
      >
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="Nike Home" className="flex items-center">
            <Image src="/logo.svg" alt="Nike" width={56} height={56} priority className="invert" />
          </Link>
          <div className="hidden md:block w-80">
            <ProductSearchBar />
          </div>
        </div>

        <ul className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-lead text-dark-900 transition-colors hover:text-dark-700 font-medium"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden text-dark-900 hover:text-dark-700 transition-colors"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Toggle navigation</span>
          <MenuToggleIcon open={open} className="size-14" duration={500} stroke="currentColor" />
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`border-t border-light-300 md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="space-y-1 px-4 py-4">
          {NAV_LINKS.map((l, index) => (
            <li 
              key={l.href}
              className="opacity-0 animate-fade-in"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: open ? 'forwards' : 'backwards',
              }}
            >
              <Link
                href={l.href}
                className="block py-3 px-2 text-body text-dark-900 hover:text-dark-700 hover:bg-dark-900/5 rounded-lg transition-colors font-medium"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li 
            className="pt-2 opacity-0 animate-fade-in"
            style={{
              animationDelay: `${NAV_LINKS.length * 50}ms`,
              animationFillMode: open ? 'forwards' : 'backwards',
            }}
          >
            <div className="w-full">
              <ProductSearchBar />
            </div>
          </li>
        </ul>
      </div>
    </header>
  );
}
