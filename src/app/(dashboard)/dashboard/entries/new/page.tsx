"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ClipboardCheck, Calendar, Hash, FileText, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

interface KpiOption {
  id: string;
  name: string;
  department_id: string;
  department: { name: string } | null;
  type: string;
  unit: string | null;
  target_value: number;
}

export default function NewEntryPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [kpiOptions, setKpiOptions] = useState<KpiOption[]>([]);
  const [selectedKpi, setSelectedKpi] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actualValue, setActualValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load KPIs filtered by user's department (staff sees only their dept)
  useEffect(() => {
    async function loadKpis() {
      if (!user) return;
      const supabase = createClient();
      let query = supabase
        .from("kpis")
        .select("id, name, department_id, type, unit, target_value, department:departments(name)")
        .eq("is_active", true)
        .order("name");

      // Staff and Manager only see their department's KPIs
      if (user.role !== "admin" && user.department_id) {
        query = query.eq("department_id", user.department_id);
      }

      const { data } = await query;
      if (data) setKpiOptions(data as unknown as KpiOption[]);
    }
    loadKpis();
  }, [user]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='field']", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");

    // Validation #18: period_end > period_start
    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date.");
      return;
    }

    // Validation #19: no negative values
    const numValue = parseFloat(actualValue);
    if (numValue < 0) {
      setError("Actual value cannot be negative.");
      return;
    }

    if (isNaN(numValue)) {
      setError("Please enter a valid number.");
      return;
    }

    // Validation #17: check department match for non-admin
    const selectedKpiObj = kpiOptions.find((k) => k.id === selectedKpi);
    if (user.role !== "admin" && selectedKpiObj && user.department_id && selectedKpiObj.department_id !== user.department_id) {
      setError("You can only submit entries for KPIs in your department.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("kpi_entries").insert({
      kpi_id: selectedKpi,
      submitted_by: user.id,
      period_start: startDate,
      period_end: endDate,
      actual_value: numValue,
      notes: notes || null,
    } as any);

    if (insertError) {
      // Validation #20: friendly duplicate error
      if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        setError("You already submitted an entry for this KPI and period. Edit your existing entry instead.");
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    toast("Entry submitted successfully! Waiting for approval.", "success");
    setSelectedKpi(""); setStartDate(""); setEndDate(""); setActualValue(""); setNotes("");
    setLoading(false);
  }

  const selectedKpiDetails = kpiOptions.find((k) => k.id === selectedKpi);

  return (
    <div ref={containerRef} className="space-y-6">
      <div data-animate="field">
        <h1 className="text-2xl font-bold text-gray-900">Submit KPI Entry</h1>
        <p className="text-sm text-gray-500 mt-1">Report your KPI progress for the current period</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {/* KPI Selection */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
            Select KPI
          </label>
          <select value={selectedKpi} onChange={(e) => setSelectedKpi(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100">
            <option value="">Choose a KPI...</option>
            {kpiOptions.map((kpi) => (
              <option key={kpi.id} value={kpi.id}>
                {kpi.name} — {kpi.department?.name || "Unassigned"} (Target: {kpi.target_value} {kpi.unit})
              </option>
            ))}
          </select>
          {kpiOptions.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">No KPIs available for your department. Contact your manager.</p>
          )}
          {selectedKpiDetails && (
            <p className="text-xs text-gray-500 mt-2">Type: {selectedKpiDetails.type} · Target: {selectedKpiDetails.target_value} {selectedKpiDetails.unit}</p>
          )}
        </div>

        {/* Period */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            Reporting Period
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate || undefined} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
            </div>
          </div>
        </div>

        {/* Value */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Hash className="h-4 w-4 text-gray-400" />
            Actual Value
          </label>
          <input type="number" step="any" min="0" value={actualValue} onChange={(e) => setActualValue(e.target.value)} required placeholder={selectedKpiDetails ? `Target: ${selectedKpiDetails.target_value} ${selectedKpiDetails.unit || ""}` : "Enter value..."} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
        </div>

        {/* Notes */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <FileText className="h-4 w-4 text-gray-400" />
            Notes (optional)
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context..." rows={3} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 resize-none" />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div data-animate="field">
          <button type="submit" disabled={loading || kpiOptions.length === 0} className="flex items-center gap-2 rounded-lg gradient-brand px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Submitting..." : "Submit Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
