"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductSearchBar } from "./ProductSearchBar";

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
            <Image src="/logo.svg" alt="Nike" width={40} height={40} priority className="invert" />
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
          className="inline-flex items-center justify-center rounded-md p-3 md:hidden"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span className="mb-1.5 block h-1 w-8 bg-dark-900"></span>
          <span className="mb-1.5 block h-1 w-8 bg-dark-900"></span>
          <span className="block h-1 w-8 bg-dark-900"></span>
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`border-t border-light-300 md:hidden ${open ? "block" : "hidden"}`}
      >
        <ul className="space-y-2 px-4 py-3">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block py-2 text-body text-dark-900 hover:text-dark-700"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <div className="w-full">
              <ProductSearchBar />
            </div>
          </li>
        </ul>
      </div>
    </header>
  );
}
