"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Server, Users, Target, ClipboardCheck, Building2, Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RoleGuard } from "@/components/ui/role-guard";
import { useToast } from "@/components/ui/toast";

interface SystemStats {
  totalUsers: number;
  totalKpis: number;
  totalEntries: number;
  totalDepartments: number;
}

interface ActivityEntry {
  id: string;
  user_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  target_type: string | null;
  created_at: string;
}

export default function SystemPage() {
  return (
    <RoleGuard allowed={["admin"]}>
      <SystemContent />
    </RoleGuard>
  );
}

function SystemContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalKpis: 0,
    totalEntries: 0,
    totalDepartments: 0,
  });
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSystemData() {
      const supabase = createClient();

      const [usersRes, kpisRes, entriesRes, deptsRes, activityRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }) as unknown as { count: number },
        supabase.from("kpis").select("id", { count: "exact", head: true }) as unknown as { count: number },
        supabase.from("kpi_entries").select("id", { count: "exact", head: true }) as unknown as { count: number },
        supabase.from("departments").select("id", { count: "exact", head: true }) as unknown as { count: number },
        supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(20) as unknown as { data: ActivityEntry[] },
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalKpis: kpisRes.count || 0,
        totalEntries: entriesRes.count || 0,
        totalDepartments: deptsRes.count || 0,
      });

      setActivities(activityRes.data || []);
      setLoading(false);
    }

    loadSystemData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Total KPIs", value: stats.totalKpis, icon: Target, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Entries", value: stats.totalEntries, icon: ClipboardCheck, color: "bg-amber-50 text-amber-600" },
    { label: "Departments", value: stats.totalDepartments, icon: Building2, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of system metrics and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            data-animate="card"
            className="rounded-xl border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.color.split(" ")[0]}`}>
                <stat.icon className={`h-4 w-4 ${stat.color.split(" ")[1]}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-xs text-gray-400 ml-auto">Last 20 entries</span>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
              >
                <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium capitalize">{activity.action.replace(/_/g, " ")}</p>
                  {activity.metadata && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {Object.entries(activity.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {new Date(activity.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
