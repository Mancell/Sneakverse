import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/user";
import { userRoles } from "@/lib/db/schema/user-roles";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createFirstAdmin() {
  const email = "moncel1091@gmail.com";
  const password = "Mahmut-oncel1091";
  const name = "Admin";

  console.log(`Creating admin user: ${email}...`);

  // Check if user already exists
  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  let userId: string;

  if (user) {
    console.log(`User with email ${email} already exists.`);
    userId = user.id;
  } else {
    console.log("Creating new user account...");
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!res.user?.id) {
      throw new Error("Failed to create user account via Better Auth.");
    }
    userId = res.user.id;
    console.log(`✅ User created with ID: ${userId}`);
  }

  // Assign admin role
  try {
    await db
      .insert(userRoles)
      .values({ userId, role: "admin" })
      .onConflictDoUpdate({
        target: userRoles.userId,
        set: { role: "admin", updatedAt: new Date() },
      });
    console.log(`✅ Admin role assigned to user: ${email}`);
    console.log(`✅ User ID: ${userId}`);
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\n✅ You can now sign in at /auth/sign-in`);
    console.log(`✅ Admin dashboard: /admin`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

createFirstAdmin().catch((err) => {
  console.error("Failed to run create-first-admin script:", err);
  process.exit(1);
});

