"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Target, Building2, Calendar, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

interface KpiDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  timeframe: string;
  target_value: number;
  weight: number;
  unit: string | null;
  department: { name: string } | null;
}

interface EntryHistory {
  id: string;
  actual_value: number;
  period_start: string;
  period_end: string;
  status: string;
  submitter: { full_name: string } | null;
}

export default function KpiDetailPage() {
  const params = useParams();
  const kpiId = params.id as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const [kpi, setKpi] = useState<KpiDetail | null>(null);
  const [entries, setEntries] = useState<EntryHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: kpiData } = await supabase.from("kpis").select("*, department:departments(name)").eq("id", kpiId).single() as { data: any };
      const { data: entryData } = await supabase.from("kpi_entries").select("id, actual_value, period_start, period_end, status, submitter:profiles!submitted_by(full_name)").eq("kpi_id", kpiId).order("period_start", { ascending: false }).limit(10) as { data: any };
      
      if (kpiData) setKpi(kpiData as KpiDetail);
      if (entryData) setEntries(entryData as EntryHistory[]);
      setLoading(false);
    }
    load();
  }, [kpiId]);

  useEffect(() => {
    if (loading || !kpi) return;
    const approved = entries.filter((e) => e.status === "approved");
    const avg = approved.length > 0
      ? approved.reduce((acc, e) => acc + Math.min((e.actual_value / kpi.target_value) * 100, 150), 0) / approved.length
      : 0;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='card']", { opacity: 0, y: 20, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" });
      gsap.fromTo("[data-animate='ring']", { strokeDashoffset: 283 }, { strokeDashoffset: 283 - (283 * Math.min(avg, 100)) / 100, duration: 1.5, delay: 0.4, ease: "power2.out" });
      gsap.fromTo("[data-animate='bar']", { scaleY: 0 }, { scaleY: 1, duration: 0.6, stagger: 0.08, delay: 0.3, ease: "back.out(1.5)", transformOrigin: "bottom center" });
    }, containerRef);
    return () => ctx.revert();
  }, [loading, kpi, entries]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  if (!kpi) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">KPI not found.</p>
        <Link href="/dashboard/kpis" className="text-brand-600 text-sm mt-2 inline-block">← Back to KPIs</Link>
      </div>
    );
  }

  const approvedEntries = entries.filter((e) => e.status === "approved");
  const avgAchievement = approvedEntries.length > 0
    ? approvedEntries.reduce((acc, e) => acc + Math.min((e.actual_value / kpi.target_value) * 100, 150), 0) / approvedEntries.length
    : 0;

  return (
    <div ref={containerRef} className="space-y-6">
      <div data-animate="card">
        <Link href="/dashboard/kpis" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to KPI Metrics
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{kpi.name}</h1>
        {kpi.description && <p className="text-sm text-gray-500 mt-1">{kpi.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info */}
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">KPI Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="h-4 w-4 text-blue-500" /></div>
              <div><p className="text-[11px] text-gray-400">Department</p><p className="text-sm font-medium text-gray-800">{kpi.department?.name || "—"}</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center"><Target className="h-4 w-4 text-violet-500" /></div>
              <div><p className="text-[11px] text-gray-400">Type</p><p className="text-sm font-medium text-gray-800 capitalize">{kpi.type}</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center"><Calendar className="h-4 w-4 text-amber-500" /></div>
              <div><p className="text-[11px] text-gray-400">Timeframe</p><p className="text-sm font-medium text-gray-800 capitalize">{kpi.timeframe}</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
              <div><p className="text-[11px] text-gray-400">Target</p><p className="text-sm font-medium text-gray-800">{kpi.target_value} {kpi.unit || ""}</p></div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Weight</span>
            <span className="text-sm font-semibold text-gray-800">{kpi.weight}%</span>
          </div>
        </div>

        {/* Progress Ring */}
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card flex flex-col items-center justify-center">
          <p className="text-xs text-gray-500 mb-3">Avg. Achievement</p>
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle data-animate="ring" cx="60" cy="60" r="45" fill="none" stroke={avgAchievement >= 100 ? "#10b981" : avgAchievement >= 75 ? "#f59e0b" : "#ef4444"} strokeWidth="10" strokeLinecap="round" strokeDasharray="283" strokeDashoffset="283" transform="rotate(-90 60 60)" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-xl font-bold", avgAchievement >= 100 ? "text-emerald-600" : avgAchievement >= 75 ? "text-amber-600" : "text-red-600")}>
                {avgAchievement > 0 ? `${avgAchievement.toFixed(1)}%` : "—"}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{approvedEntries.length} approved entries</p>
        </div>
      </div>

      {/* Trend Bars */}
      {approvedEntries.length > 0 && (
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Trend</h3>
          <div className="flex items-end gap-3 h-32">
            {approvedEntries.slice(0, 8).reverse().map((entry) => {
              const pct = Math.min((entry.actual_value / kpi.target_value) * 100, 100);
              return (
                <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{Math.round((entry.actual_value / kpi.target_value) * 100)}%</span>
                  <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: "100px" }}>
                    <div data-animate="bar" className={cn("absolute bottom-0 left-0 right-0 rounded-t-md", pct >= 100 ? "bg-emerald-400" : pct >= 75 ? "bg-blue-400" : "bg-amber-400")} style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400">{entry.period_start.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div data-animate="card" className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold text-gray-900">Entry History</h3>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6 px-5">No entries submitted for this KPI yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-border bg-surface-tertiary">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Submitted By</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Value</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Achievement</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => {
                const ach = Math.min((entry.actual_value / kpi.target_value) * 100, 150);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm text-gray-800">{entry.period_start} → {entry.period_end}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{entry.submitter?.full_name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-700">{entry.actual_value} {kpi.unit || ""}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs font-semibold", ach >= 100 ? "text-emerald-600" : ach >= 75 ? "text-amber-600" : "text-red-600")}>{ach.toFixed(1)}%</span></td>
                    <td className="px-5 py-3"><span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", entry.status === "approved" ? "bg-emerald-50 text-emerald-700" : entry.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{entry.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
