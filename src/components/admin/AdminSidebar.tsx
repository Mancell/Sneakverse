"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  Video,
  MessageSquare,
  FolderTree,
} from "lucide-react";

interface AdminSidebarProps {
  role: string;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["admin", "editor", "viewer"],
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
    roles: ["admin", "editor"],
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: FileText,
    roles: ["admin", "editor"],
  },
  {
    title: "Videos",
    href: "/admin/videos",
    icon: Video,
    roles: ["admin", "editor"],
  },
  {
    title: "Reviews",
    href: "/admin/reviews",
    icon: MessageSquare,
    roles: ["admin", "editor"],
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
    roles: ["admin", "editor"],
  },
];

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-light-300 bg-white shadow-sm">
      <nav className="p-4">
        <div className="mb-6">
          <h2 className="text-heading-4 text-dark-900 font-semibold px-4">Navigation</h2>
        </div>
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-body font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-dark-900 text-light-100 shadow-md"
                      : "text-dark-700 hover:bg-light-100 hover:text-dark-900"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-light-100" : "text-dark-600"}`} />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

