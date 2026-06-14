"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Users, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  department: { id: string; name: string } | null;
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Admin", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  manager: { label: "Manager", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  staff: { label: "Staff", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

export default function TeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*, department:departments(id, name)")
        .eq("is_active", true)
        .order("full_name");
      if (data) setMembers(data as unknown as Member[]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='member']", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">{members.length} members</p>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-tertiary">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Member</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((member) => {
              const config = roleConfig[member.role] || roleConfig.staff;
              const initials = member.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <tr key={member.id} data-animate="member" className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                        <p className="text-[11px] text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border", config.bg, config.color)}>
                      <Shield className="h-3 w-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{member.department?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(member.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
