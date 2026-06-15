"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, CheckCircle2, Clock, XCircle, FileDown, FileSpreadsheet, Calendar, Filter } from "lucide-react";
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

type FilterMode = "month" | "range";

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<EntryWithKpi[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-based
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("kpi_entries")
        .select("id, actual_value, status, period_start, period_end, created_at, kpi:kpis(name, target_value, unit, timeframe, department:departments(name))")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (data) setEntries(data as unknown as EntryWithKpi[]);
      setLoading(false);
    }
    load();
  }, []);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const entryDate = new Date(e.period_end || e.created_at);
      if (filterMode === "month") {
        return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
      } else {
        // range
        if (!rangeStart || !rangeEnd) return true;
        const start = new Date(rangeStart);
        const end = new Date(rangeEnd);
        end.setHours(23, 59, 59);
        return entryDate >= start && entryDate <= end;
      }
    });
  }, [entries, filterMode, selectedMonth, selectedYear, rangeStart, rangeEnd]);

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

  const periodLabel = filterMode === "month"
    ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
    : rangeStart && rangeEnd
      ? `${rangeStart} → ${rangeEnd}`
      : "All data";

  // Available years from data
  const years = useMemo(() => {
    const set = new Set<number>();
    entries.forEach((e) => set.add(new Date(e.period_end || e.created_at).getFullYear()));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [entries]);

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
    if (rows.length === 0) { toast("Tidak ada data untuk diekspor", "warning"); return; }
    exportKpiReportPDF(rows, {
      title: `Laporan KPI (${periodLabel})`,
      period: periodLabel,
      generatedBy: user?.full_name || "Admin",
    });
    toast("PDF berhasil diunduh", "success");
  }

  function handleExportExcel() {
    const rows = buildReportRows();
    if (rows.length === 0) { toast("Tidak ada data untuk diekspor", "warning"); return; }
    const filename = filterMode === "month"
      ? `KPI_Report_${MONTH_NAMES_SHORT[selectedMonth]}_${selectedYear}`
      : `KPI_Report_${rangeStart}_${rangeEnd}`;
    exportToExcel(rows, filename);
    toast("Excel berhasil diunduh", "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Laporan kinerja · {periodLabel}</p>
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

      {/* Filter Mode Toggle + Controls */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-card space-y-3">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => setFilterMode("month")}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-all", filterMode === "month" ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50")}
            >
              Per Bulan
            </button>
            <button
              onClick={() => setFilterMode("range")}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-all", filterMode === "range" ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50")}
            >
              Range Tanggal
            </button>
          </div>
        </div>

        {filterMode === "month" ? (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex flex-wrap gap-1.5">
              {MONTH_NAMES_SHORT.map((m, i) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(i)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    selectedMonth === i ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Dari</label>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Sampai</label>
              <input
                type="date"
                value={rangeEnd}
                min={rangeStart || undefined}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-emerald-600">{approved.length}</p><p className="text-xs text-gray-500">Approved</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-600">{pending.length}</p><p className="text-xs text-gray-500">Pending</p></div>
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
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Pencapaian KPI (Approved)</h3>
        {kpiStats.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Tidak ada entri approved untuk periode ini.</p>
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
                      <span className="text-xs text-gray-400 ml-2">{stat.dept} · {stat.count} entri</span>
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
          <h3 className="text-sm font-semibold text-gray-900">Entri ({filteredEntries.length})</h3>
        </div>
        {filteredEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Tidak ada data untuk periode yang dipilih.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b border-border bg-surface-tertiary">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">KPI</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Departemen</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Nilai</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase">Periode</th>
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
        )}
      </div>
    </div>
  );
}
