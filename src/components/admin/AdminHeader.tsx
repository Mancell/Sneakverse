"use client";

import { signOut } from "@/lib/auth/actions";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  role: string;
}

export default function AdminHeader({ user, role }: AdminHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/sign-in");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-light-300 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-heading-3 text-dark-900">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-body text-dark-900">{user.name || user.email}</p>
            <p className="text-caption text-dark-700 capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-light-300 bg-white px-4 py-2 text-body text-dark-900 transition-colors hover:bg-light-100"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

