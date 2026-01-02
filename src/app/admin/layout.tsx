import { redirect } from "next/navigation";
import { requireAuth, getUserRole } from "@/lib/auth/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  let role: string = "viewer";

  try {
    user = await requireAuth();
  } catch (error) {
    console.error("[AdminLayout] Auth error:", error);
    redirect("/auth/sign-in?redirect=/admin");
  }

  try {
    role = await getUserRole(user.id);
  } catch (error) {
    console.error("[AdminLayout] Role error:", error);
    role = "viewer";
  }

  // Only admin and editor can access admin panel
  if (role === "viewer") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-light-50">
      <AdminHeader user={user} role={role} />
      <div className="flex">
        <AdminSidebar role={role} />
        <main className="flex-1 p-6 lg:p-8 bg-light-50 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}

