"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guests, carts, cartItems } from "@/lib/db/schema/index";
import { and, eq, lt, isNull, gt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getUserRole } from "./admin";

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters");
const nameSchema = z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters");

export async function createGuestSession() {
  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get("guest_session");
    if (existing?.value) {
      // Verify the guest session still exists and is valid (not expired)
      const now = new Date();
      const guest = await db
        .select()
        .from(guests)
        .where(
          and(
            eq(guests.sessionToken, existing.value),
            gt(guests.expiresAt, now) // expiresAt > now means session is still valid
          )
        )
        .limit(1);
      
      if (guest.length > 0) {
        return { ok: true, sessionToken: existing.value };
      }
    }

    const sessionToken = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + COOKIE_OPTIONS.maxAge * 1000);

    await db.insert(guests).values({
      sessionToken,
      expiresAt,
    });

    cookieStore.set("guest_session", sessionToken, COOKIE_OPTIONS);
    return { ok: true, sessionToken };
  } catch (error) {
    console.error("[createGuestSession] Error:", error);
    return { ok: false, error: "Failed to create guest session" };
  }
}

export async function guestSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("guest_session")?.value;
    if (!token) {
      return { sessionToken: null };
    }

    // Clean up expired guest sessions
    const now = new Date();
    await db
      .delete(guests)
      .where(and(eq(guests.sessionToken, token), lt(guests.expiresAt, now)));

    // Verify the session is still valid
    const guest = await db
      .select()
      .from(guests)
      .where(eq(guests.sessionToken, token))
      .limit(1);

    if (guest.length === 0) {
      cookieStore.delete("guest_session");
      return { sessionToken: null };
    }

    return { sessionToken: token };
  } catch (error) {
    console.error("[guestSession] Error:", error);
    return { sessionToken: null };
  }
}

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export async function signUp(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const data = signUpSchema.parse(rawData);

    const res = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });

    if (!res.user?.id) {
      return { ok: false, error: "Failed to create user account" };
    }

    // Migrate guest cart to user cart
    await migrateGuestCartToUser(res.user.id);

    return { ok: true, userId: res.user.id };
  } catch (error) {
    console.error("[signUp] Error:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message || "Validation failed" };
    }
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Failed to sign up" };
  }
}

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export async function signIn(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const data = signInSchema.parse(rawData);

    const res = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });

    if (!res.user?.id) {
      return { ok: false, error: "Invalid email or password" };
    }

    // Migrate guest cart to user cart
    await migrateGuestCartToUser(res.user.id);

    // Check user role and redirect to admin if applicable
    const role = await getUserRole(res.user.id);
    if (role === "admin" || role === "editor") {
      return { ok: true, userId: res.user.id, redirectTo: "/admin" };
    }

    return { ok: true, userId: res.user.id };
  } catch (error) {
    console.error("[signIn] Error:", error);
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message || "Validation failed" };
    }
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Invalid email or password" };
  }
}

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    return session?.user ?? null;
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
}

export async function signOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
    return { ok: true };
  } catch (error) {
    console.error("[signOut] Error:", error);
    return { ok: false, error: "Failed to sign out" };
  }
}

export async function mergeGuestCartWithUserCart() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { ok: false, error: "User not authenticated" };
    }

    await migrateGuestCartToUser(user.id);
    return { ok: true };
  } catch (error) {
    console.error("[mergeGuestCartWithUserCart] Error:", error);
    return { ok: false, error: "Failed to merge cart" };
  }
}

export async function migrateGuestCartToUser(userId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("guest_session")?.value;
    
    if (!token) {
      return;
    }

    // Find guest by session token
    const guest = await db
      .select()
      .from(guests)
      .where(eq(guests.sessionToken, token))
      .limit(1);

    if (guest.length === 0) {
      cookieStore.delete("guest_session");
      return;
    }

    const guestId = guest[0].id;

    // Find or create user cart
    const userCart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, userId), isNull(carts.guestId)))
      .limit(1);

    let userCartId: string;

    if (userCart.length === 0) {
      // Create new user cart
      const newCart = await db
        .insert(carts)
        .values({
          userId,
          guestId: null,
        })
        .returning();
      userCartId = newCart[0].id;
    } else {
      userCartId = userCart[0].id;
    }

    // Find guest cart
    const guestCart = await db
      .select()
      .from(carts)
      .where(eq(carts.guestId, guestId))
      .limit(1);

    if (guestCart.length > 0) {
      const guestCartId = guestCart[0].id;

      // Get all guest cart items
      const guestCartItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, guestCartId));

      // Get existing user cart items
      const existingUserCartItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, userCartId));

      // Merge cart items
      for (const guestItem of guestCartItems) {
        const existingItem = existingUserCartItems.find(
          (item) => item.productVariantId === guestItem.productVariantId
        );

        if (existingItem) {
          // Update quantity if item already exists
          await db
            .update(cartItems)
            .set({ quantity: existingItem.quantity + guestItem.quantity })
            .where(eq(cartItems.id, existingItem.id));
        } else {
          // Create new cart item for user
          await db.insert(cartItems).values({
            cartId: userCartId,
            productVariantId: guestItem.productVariantId,
            quantity: guestItem.quantity,
          });
        }
      }

      // Delete guest cart and items
      await db.delete(cartItems).where(eq(cartItems.cartId, guestCartId));
      await db.delete(carts).where(eq(carts.id, guestCartId));
    }

    // Delete guest session
    await db.delete(guests).where(eq(guests.sessionToken, token));
    cookieStore.delete("guest_session");
  } catch (error) {
    console.error("[migrateGuestCartToUser] Error:", error);
    // Don't throw - allow login to proceed even if cart migration fails
  }
}
