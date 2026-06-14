"use client";

import { useAuth } from "@/lib/auth-context";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { redirect } from "next/navigation";

/**
 * Dashboard page routes users based on their role:
 * - Admin: Executive Dashboard (full company view)
 * - Manager: Executive Dashboard (department-focused)
 * - Staff: Redirect to My KPIs page
 */
export default function DashboardPage() {
  const { user, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Staff sees their personal KPI view instead of the executive dashboard
  if (isStaff) {
    window.location.href = "/dashboard/my-kpis";
    return null;
  }

  return <ExecutiveDashboard />;
}
