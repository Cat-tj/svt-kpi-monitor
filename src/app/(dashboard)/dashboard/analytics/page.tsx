"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, CheckCircle2, Clock, XCircle, FileDown, FileSpreadsheet, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { exportToExcel } from "@/lib/export";
import { exportKpiReportPDF } from "@/lib/pdf-export";
import { useToast } from "@/components/ui/toast";

interface EntryWithKpi {
  id: string;
  actual_value: number;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
  kpi: { name: string; target_value: number; unit: string | null; timeframe: string; department: { name: string } | null } | null;
}

type PeriodFilter = "all" | "daily" | "weekly" | "monthly";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<EntryWithKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("kpi_entries")
        .select("id, actual_value, status, period_start, period_end, created_at, kpi:kpis(name, target_value, unit, timeframe, department:departments(name))")
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setEntries(data as unknown as EntryWithKpi[]);
      setLoading(false);
    }
    load();
  }, []);

  // Filter entries by selected period (based on created_at recency)
  const filteredEntries = useMemo(() => {
    if (period === "all") return entries;
    const now = new Date();
    const cutoff = new Date();
    if (period === "daily") cutoff.setDate(now.getDate() - 1);
    else if (period === "weekly") cutoff.setDate(now.getDate() - 7);
    else if (period === "monthly") cutoff.setMonth(now.getMonth() - 1);
    return entries.filter((e) => new Date(e.created_at) >= cutoff);
  }, [entries, period]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  const approved = filteredEntries.filter((e) => e.status === "approved");
  const pending = filteredEntries.filter((e) => e.status === "pending");
  const rejected = filteredEntries.filter((e) => e.status === "rejected");

  // Group by KPI for achievement overview
  const kpiMap = new Map<string, { name: string; dept: string; total: number; achieved: number; count: number }>();
  approved.forEach((entry) => {
    if (!entry.kpi) return;
    const key = entry.kpi.name;
    const existing = kpiMap.get(key) || { name: key, dept: entry.kpi.department?.name || "", total: entry.kpi.target_value, achieved: 0, count: 0 };
    existing.achieved += entry.actual_value;
    existing.count += 1;
    kpiMap.set(key, existing);
  });
  const kpiStats = Array.from(kpiMap.values());

  const periodLabel = period === "all" ? "All Time" : period === "daily" ? "Last 24 Hours" : period === "weekly" ? "Last 7 Days" : "Last 30 Days";

  function buildReportRows() {
    return filteredEntries.map((e) => {
      const ach = e.kpi ? Math.min((e.actual_value / e.kpi.target_value) * 100, 150) : 0;
      return {
        kpi: e.kpi?.name || "—",
        department: e.kpi?.department?.name || "—",
        value: `${e.actual_value} ${e.kpi?.unit || ""}`.trim(),
        target: `${e.kpi?.target_value || 0} ${e.kpi?.unit || ""}`.trim(),
        achievement: `${ach.toFixed(1)}%`,
        period: `${e.period_start} → ${e.period_end}`,
        status: e.status,
      };
    });
  }

  function handleExportPDF() {
    const rows = buildReportRows();
    if (rows.length === 0) { toast("No data to export for this period", "warning"); return; }
    exportKpiReportPDF(rows, {
      title: `KPI Report (${periodLabel})`,
      period: periodLabel,
      generatedBy: user?.full_name || "Admin",
    });
    toast("PDF report downloaded", "success");
  }

  function handleExportExcel() {
    const rows = buildReportRows();
    if (rows.length === 0) { toast("No data to export for this period", "warning"); return; }
    exportToExcel(rows, `KPI_Report_${period}_${Date.now()}`);
    toast("Excel report downloaded", "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Performance data from real submissions · {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-surface px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-surface px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <FileDown className="h-4 w-4 text-red-600" /> PDF
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        {(["all", "daily", "weekly", "monthly"] as PeriodFilter[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-all capitalize",
              period === p ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-gray-500 hover:bg-gray-50 border border-transparent"
            )}
          >
            {p === "all" ? "All Time" : p}
          </button>
        ))}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-emerald-600">{approved.length}</p><p className="text-xs text-gray-500">Approved Entries</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-600">{pending.length}</p><p className="text-xs text-gray-500">Pending Review</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-2.5"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-red-600">{rejected.length}</p><p className="text-xs text-gray-500">Rejected</p></div>
          </div>
        </div>
      </div>

      {/* KPI Achievement Breakdown */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">KPI Achievement (Approved Entries)</h3>
        {kpiStats.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No approved entries for this period.</p>
        ) : (
          <div className="space-y-4">
            {kpiStats.map((stat) => {
              const avg = stat.achieved / stat.count;
              const pct = Math.min((avg / stat.total) * 100, 150);
              return (
                <div key={stat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{stat.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{stat.dept} · {stat.count} entries</span>
                    </div>
                    <span className={cn("text-xs font-semibold", pct >= 100 ? "text-emerald-600" : pct >= 75 ? "text-amber-600" : "text-red-600")}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entries Table */}
      <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold text-gray-900">Entries ({filteredEntries.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-border bg-surface-tertiary">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">KPI</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Value</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEntries.slice(0, 50).map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm text-gray-800">{entry.kpi?.name || "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{entry.kpi?.department?.name || "—"}</td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-700">{entry.actual_value} {entry.kpi?.unit || ""}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{entry.period_start} → {entry.period_end}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
                      entry.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                      entry.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    )}>{entry.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
