"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Users, Plus, Search, Shield, Mail, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "admin" | "manager" | "staff";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  avatar: string;
  isActive: boolean;
  joinedAt: string;
}

const team: TeamMember[] = [
  { id: "1", name: "COO Admin", email: "admin@sentravisi.com", role: "admin", department: "Executive", avatar: "CA", isActive: true, joinedAt: "Jan 2024" },
  { id: "2", name: "Andi Setiawan", email: "andi@sentravisi.com", role: "manager", department: "Engineering", avatar: "AS", isActive: true, joinedAt: "Mar 2024" },
  { id: "3", name: "Dina Pratiwi", email: "dina@sentravisi.com", role: "manager", department: "Sales & Marketing", avatar: "DP", isActive: true, joinedAt: "Feb 2024" },
  { id: "4", name: "Rizky Firmansyah", email: "rizky@sentravisi.com", role: "manager", department: "Product", avatar: "RF", isActive: true, joinedAt: "Apr 2024" },
  { id: "5", name: "Sari Wulandari", email: "sari@sentravisi.com", role: "manager", department: "Operations", avatar: "SW", isActive: true, joinedAt: "Jan 2024" },
  { id: "6", name: "Budi Santoso", email: "budi@sentravisi.com", role: "manager", department: "Finance", avatar: "BS", isActive: true, joinedAt: "May 2024" },
  { id: "7", name: "Maya Anggraini", email: "maya@sentravisi.com", role: "manager", department: "HR & Admin", avatar: "MA", isActive: true, joinedAt: "Jan 2024" },
  { id: "8", name: "Fajar Nugroho", email: "fajar@sentravisi.com", role: "staff", department: "Engineering", avatar: "FN", isActive: true, joinedAt: "Jun 2024" },
  { id: "9", name: "Lina Kusuma", email: "lina@sentravisi.com", role: "staff", department: "Sales & Marketing", avatar: "LK", isActive: true, joinedAt: "Jul 2024" },
  { id: "10", name: "Taufik Hidayat", email: "taufik@sentravisi.com", role: "staff", department: "Operations", avatar: "TH", isActive: false, joinedAt: "Aug 2024" },
];

const roleConfig = {
  admin: { label: "Admin", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  manager: { label: "Manager", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  staff: { label: "Staff", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

export default function TeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='member']",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const filtered = team.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage users, roles, and department assignments
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "admin", "manager", "staff"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium transition-all capitalize",
                roleFilter === r
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "text-gray-500 hover:bg-gray-50 border border-transparent"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Team Table */}
      <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-tertiary">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((member) => {
              const config = roleConfig[member.role];
              return (
                <tr
                  key={member.id}
                  data-animate="member"
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">{member.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-[11px] text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                      config.bg, config.color
                    )}>
                      <Shield className="h-3 w-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{member.department}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        member.isActive ? "bg-emerald-400" : "bg-gray-300"
                      )} />
                      <span className="text-xs text-gray-600">
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{member.joinedAt}</td>
                  <td className="px-5 py-3.5">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
