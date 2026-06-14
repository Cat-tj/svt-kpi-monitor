"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Target, Users, ClipboardCheck, Building2, Clock, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardData {
  totalKpis: number;
  totalStaff: number;
  totalDepartments: number;
  pendingEntries: number;
  approvedEntries: number;
  recentEntries: any[];
}

export function ExecutiveDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [kpis, profiles, departments, pendingEntries, approvedEntries, recentEntries] = await Promise.all([
        supabase.from("kpis").select("id").eq("is_active", true),
        supabase.from("profiles").select("id").eq("is_active", true),
        supabase.from("departments").select("id"),
        supabase.from("kpi_entries").select("id").eq("status", "pending"),
        supabase.from("kpi_entries").select("id").eq("status", "approved"),
        supabase.from("kpi_entries")
          .select("*, kpi:kpis(name, target_value, unit, department:departments(name)), submitter:profiles!submitted_by(full_name)")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setData({
        totalKpis: kpis.data?.length || 0,
        totalStaff: profiles.data?.length || 0,
        totalDepartments: departments.data?.length || 0,
        pendingEntries: pendingEntries.data?.length || 0,
        approvedEntries: approvedEntries.data?.length || 0,
        recentEntries: recentEntries.data || [],
      });
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 24, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }
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

  if (!data) return null;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div data-animate="card">
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Company-wide performance overview · {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5"><Target className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.totalKpis}</p>
              <p className="text-xs text-gray-500">Active KPIs</p>
            </div>
          </div>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2.5"><Users className="h-5 w-5 text-violet-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.totalStaff}</p>
              <p className="text-xs text-gray-500">Team Members</p>
            </div>
          </div>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5"><Building2 className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.totalDepartments}</p>
              <p className="text-xs text-gray-500">Departments</p>
            </div>
          </div>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{data.pendingEntries}</p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </div>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{data.approvedEntries}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {data.pendingEntries > 0 && (
        <div data-animate="card" className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {data.pendingEntries} entries waiting for your review
              </span>
            </div>
            <Link href="/dashboard/entries" className="text-sm font-medium text-amber-700 hover:text-amber-900 underline">
              Review now →
            </Link>
          </div>
        </div>
      )}

      {/* Recent Entries */}
      <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Submissions</h3>
          <Link href="/dashboard/entries" className="text-xs text-brand-600 font-medium hover:text-brand-700">
            View all →
          </Link>
        </div>

        {data.recentEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {data.recentEntries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-600">
                      {entry.submitter?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {entry.submitter?.full_name || "Unknown"} — {entry.kpi?.name || "KPI"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {entry.actual_value} {entry.kpi?.unit || ""} · {entry.period_start} → {entry.period_end}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full",
                  entry.status === "pending" ? "bg-amber-50 text-amber-700" :
                  entry.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                  "bg-red-50 text-red-700"
                )}>
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
