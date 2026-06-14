"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Search, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "..";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      {/* Mobile menu + Search */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="hidden sm:flex items-center gap-3 rounded-lg bg-surface-tertiary px-3 py-2 w-64 lg:w-80">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search KPIs, departments..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Link>

        {/* User avatar with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || "Loading"}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role || ""} Access</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-surface shadow-elevated py-1 z-50">
              <Link
                href="/dashboard/profile"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 text-gray-400" />
                Profile
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </Link>
              )}
              <div className="border-t border-border my-1" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
