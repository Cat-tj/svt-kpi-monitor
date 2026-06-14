"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// Same nav items as sidebar but for mobile
import {
  LayoutDashboard, Target, ClipboardCheck, Users, Building2, Bell, User, Settings, PlusCircle, BarChart3,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "staff"] },
  { name: "My KPIs", href: "/dashboard/my-kpis", icon: BarChart3, roles: ["staff", "manager"] },
  { name: "Submit Entry", href: "/dashboard/entries/new", icon: PlusCircle, roles: ["staff", "manager"] },
  { name: "KPI Metrics", href: "/dashboard/kpis", icon: Target, roles: ["admin", "manager"] },
  { name: "Submissions", href: "/dashboard/entries", icon: ClipboardCheck, roles: ["admin", "manager"] },
  { name: "Departments", href: "/dashboard/departments", icon: Building2, roles: ["admin"] },
  { name: "Team", href: "/dashboard/team", icon: Users, roles: ["admin", "manager"] },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, roles: ["admin", "manager"] },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["admin", "manager", "staff"] },
  { name: "Profile", href: "/dashboard/profile", icon: User, roles: ["admin", "manager", "staff"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["admin"] },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = (user?.role || "staff") as "admin" | "manager" | "staff";
  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-50">
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-surface border-r border-border shadow-modal flex flex-col">
            <div className="flex h-16 items-center justify-between px-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">SVT Monitor</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-brand-600" : "text-gray-400")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
