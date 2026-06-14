"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  Users,
  Building2,
  Bell,
  User,
  Settings,
  TrendingUp,
  PlusCircle,
  BarChart3,
  Layers,
  Server,
  FileText,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: Array<"admin" | "manager" | "staff">;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "staff"] },
  { name: "My KPIs", href: "/dashboard/my-kpis", icon: BarChart3, roles: ["staff", "manager"] },
  { name: "Submit Entry", href: "/dashboard/entries/new", icon: PlusCircle, roles: ["staff", "manager"] },
  { name: "KPI Metrics", href: "/dashboard/kpis", icon: Target, roles: ["admin", "manager"] },
  { name: "Submissions", href: "/dashboard/entries", icon: ClipboardCheck, roles: ["admin", "manager"] },
  { name: "Departments", href: "/dashboard/departments", icon: Building2, roles: ["admin"] },
  { name: "Team", href: "/dashboard/team", icon: Users, roles: ["admin", "manager"] },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, roles: ["admin", "manager"] },
  { name: "Templates", href: "/dashboard/templates", icon: Layers, roles: ["admin", "manager"] },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["admin", "manager", "staff"] },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone, roles: ["admin", "manager", "staff"] },
  { name: "Profile", href: "/dashboard/profile", icon: User, roles: ["admin", "manager", "staff"] },
  { name: "System", href: "/dashboard/system", icon: Server, roles: ["admin"] },
  { name: "Changelog", href: "/dashboard/changelog", icon: FileText, roles: ["admin", "manager", "staff"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const userRole = user?.role || "staff";
  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">SVT Monitor</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            KPI Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {loading ? (
          <div className="space-y-2 px-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-brand-600" : "text-gray-400"
                  )}
                />
                {item.name}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer with role badge */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-surface-tertiary p-3">
          <p className="text-xs font-medium text-gray-700">
            {user?.full_name || "Loading..."}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 capitalize">
            {userRole} · PT. Sentra Visi Teknologi
          </p>
        </div>
      </div>
    </aside>
  );
}
