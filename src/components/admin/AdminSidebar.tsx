"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  Video,
  ShoppingCart,
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
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    roles: ["admin", "editor", "viewer"],
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
    <aside className="w-64 border-r border-light-300 bg-white">
      <nav className="p-4">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-body transition-colors ${
                    isActive
                      ? "bg-dark-900 text-light-100"
                      : "text-dark-700 hover:bg-light-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
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

