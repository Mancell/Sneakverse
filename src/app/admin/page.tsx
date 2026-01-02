import { requireAuth, getUserRole } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/index";
import { tiktokVideos } from "@/lib/db/schema/social-media";
import { count, eq } from "drizzle-orm";
import { getAllBlogPosts } from "@/lib/data/blog";
import Link from "next/link";
import { Package, FileText, Video } from "lucide-react";

export default async function AdminDashboard() {
  let user;
  let role: string = "viewer";

  try {
    user = await requireAuth();
    role = await getUserRole(user.id);
  } catch (error) {
    console.error("[AdminDashboard] Auth/Role error:", error);
    return (
      <div className="text-center p-8">
        <h1 className="text-heading-2 text-dark-900">Access Denied</h1>
        <p className="text-body text-dark-700 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Fetch statistics
  const [
    totalProducts,
    publishedProducts,
    totalBlogPosts,
    totalVideos,
  ] = await Promise.all([
    db.select({ count: count() }).from(products),
    db.select({ count: count() }).from(products).where(eq(products.isPublished, true)),
    Promise.resolve({ count: getAllBlogPosts().length }),
    db.select({ count: count() }).from(tiktokVideos),
  ]);

  const stats = [
    {
      title: "Total Products",
      value: totalProducts[0]?.count || 0,
      published: publishedProducts[0]?.count || 0,
      icon: Package,
      href: "/admin/products",
      color: "bg-blue-500",
    },
    {
      title: "Blog Posts",
      value: totalBlogPosts.count,
      icon: FileText,
      href: "/admin/blog",
      color: "bg-green-500",
    },
    {
      title: "Videos",
      value: totalVideos[0]?.count || 0,
      icon: Video,
      href: "/admin/videos",
      color: "bg-purple-500",
    },
  ];

  const quickActions = [
    { title: "Add New Product", href: "/admin/products/new", roles: ["admin", "editor"] },
    { title: "Create Blog Post", href: "/admin/blog/new", roles: ["admin", "editor"] },
    { title: "Add Video", href: "/admin/videos/new", roles: ["admin", "editor"] },
  ].filter((action) => action.roles.includes(role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-1 text-dark-900">Dashboard</h1>
        <p className="text-body text-dark-700 mt-2">Welcome back, {user.name || user.email}!</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="rounded-xl border border-light-300 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-dark-700">{stat.title}</p>
                  <p className="mt-2 text-heading-2 text-dark-900">
                    {stat.value}
                    {stat.published !== undefined && (
                      <span className="ml-2 text-body text-dark-500">
                        ({stat.published} published)
                      </span>
                    )}
                  </p>
                </div>
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-light-300 bg-white p-6">
        <h2 className="text-heading-3 text-dark-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg border border-light-300 bg-light-100 px-4 py-3 text-center text-body text-dark-900 transition-colors hover:bg-light-200"
            >
              {action.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

