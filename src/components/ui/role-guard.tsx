"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowed: Array<"admin" | "manager" | "staff">;
}

/**
 * Protects a page from unauthorized role access.
 * If user's role is not in allowed list, redirects to dashboard.
 */
export function RoleGuard({ children, allowed }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !allowed.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, loading, allowed, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!user || !allowed.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
