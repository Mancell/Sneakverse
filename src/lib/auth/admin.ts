"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRoles, type UserRole } from "@/lib/db/schema/user-roles";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * Get the current authenticated user
 * Throws an error if not authenticated
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in?redirect=/admin");
  }

  return session.user;
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const [userRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);

    return (userRole?.role as UserRole) || "viewer";
  } catch (error) {
    console.error("[getUserRole] Error:", error);
    return "viewer";
  }
}

/**
 * Require admin role - throws error or redirects if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (role !== "admin") {
    redirect("/");
  }

  return { user, role };
}

/**
 * Require editor or admin role
 */
export async function requireEditor() {
  const user = await requireAuth();
  const role = await getUserRole(user.id);

  if (role !== "admin" && role !== "editor") {
    redirect("/");
  }

  return { user, role };
}

/**
 * Check if user has permission for an action
 */
export async function hasPermission(
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  const role = await getUserRole(userId);

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

/**
 * Set user role (admin only)
 */
export async function setUserRole(userId: string, role: UserRole) {
  await requireAdmin();

  await db
    .insert(userRoles)
    .values({ userId, role })
    .onConflictDoUpdate({
      target: userRoles.userId,
      set: { role, updatedAt: new Date() },
    });
}

