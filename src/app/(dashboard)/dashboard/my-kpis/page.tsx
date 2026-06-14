"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import {
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  PlusCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface KpiWithEntries {
  id: string;
  name: string;
  type: string;
  timeframe: string;
  target_value: number;
  unit: string | null;
  department: { name: string } | null;
}

interface MyEntry {
  id: string;
  actual_value: number;
  period_start: string;
  period_end: string;
  status: string;
  notes: string | null;
  review_notes: string | null;
  score: number | null;
  created_at: string;
  kpi: { name: string; target_value: number; unit: string | null } | null;
}

export default function MyKpisPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KpiWithEntries[]>([]);
  const [entries, setEntries] = useState<MyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const supabase = createClient();

      // Load KPIs for user's department (or all if admin)
      const { data: kpiData } = await supabase
        .from("kpis")
        .select("id, name, type, timeframe, target_value, unit, department:departments(name)")
        .eq("is_active", true)
        .order("name");

      if (kpiData) setKpis(kpiData as unknown as KpiWithEntries[]);

      // Load user's own entries
      const { data: entryData } = await supabase
        .from("kpi_entries")
        .select("id, actual_value, period_start, period_end, status, notes, review_notes, score, created_at, kpi:kpis(name, target_value, unit)")
        .eq("submitted_by", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (entryData) setEntries(entryData as unknown as MyEntry[]);
      setLoading(false);
    }

    loadData();
  }, [user]);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
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

  const pendingCount = entries.filter((e) => e.status === "pending").length;
  const approvedCount = entries.filter((e) => e.status === "approved").length;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" data-animate="card">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My KPIs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your assigned performance indicators and submissions
          </p>
        </div>
        <Link
          href="/dashboard/entries/new"
          className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="h-4 w-4" />
          Submit Entry
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-gray-500">Available KPIs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.length}</p>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-gray-500">Pending Submissions</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-gray-500">Approved Entries</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
        </div>
      </div>

      {/* KPIs Available */}
      <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">KPIs You Can Report On</h3>
        </div>
        {kpis.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No KPIs assigned yet. Contact your manager.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">{kpi.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {kpi.department?.name} · {kpi.timeframe} · Target: {kpi.target_value} {kpi.unit}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                    {kpi.type}
                  </span>
                </div>
                <Link
                  href="/dashboard/entries/new"
                  className="inline-block mt-2 text-[11px] font-medium text-brand-600 hover:text-brand-700"
                >
                  Submit entry →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Recent Entries */}
      <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">My Submissions</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No submissions yet. <Link href="/dashboard/entries/new" className="text-brand-600 font-medium">Submit your first entry</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const achievement = entry.kpi ? Math.min((entry.actual_value / entry.kpi.target_value) * 100, 150) : 0;
              return (
                <div key={entry.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Target className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{entry.kpi?.name || "KPI"}</p>
                        <p className="text-[11px] text-gray-500">
                          {entry.actual_value} {entry.kpi?.unit || ""} · {entry.period_start} to {entry.period_end}
                          {entry.kpi && (
                            <span className="ml-1 text-gray-400">({achievement.toFixed(0)}% of target)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.status === "approved" && entry.score != null && (
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          Score: {entry.score}%
                        </span>
                      )}
                      {entry.status === "pending" && (
                        <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {entry.status === "approved" && (
                        <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      )}
                      {entry.status === "rejected" && (
                        <span className="flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {entry.status === "rejected" && (
                    <div className="mt-2 ml-11 flex items-start gap-1.5 rounded-md bg-red-50 border border-red-100 px-2.5 py-1.5">
                      <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-700">
                        <span className="font-semibold">Alasan ditolak: </span>
                        {entry.review_notes || "Tidak ada keterangan dari reviewer."}
                      </p>
                    </div>
                  )}

                  {entry.status === "approved" && entry.review_notes && (
                    <div className="mt-2 ml-11 flex items-start gap-1.5 rounded-md bg-emerald-50 border border-emerald-100 px-2.5 py-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-700">
                        <span className="font-semibold">Catatan reviewer: </span>
                        {entry.review_notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
