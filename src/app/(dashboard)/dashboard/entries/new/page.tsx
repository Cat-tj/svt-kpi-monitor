"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ClipboardCheck, Calendar, Hash, FileText, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface KpiOption {
  id: string;
  name: string;
  department: { name: string } | null;
  type: string;
  unit: string | null;
  target_value: number;
}

export default function NewEntryPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [kpiOptions, setKpiOptions] = useState<KpiOption[]>([]);
  const [selectedKpi, setSelectedKpi] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actualValue, setActualValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Load KPIs from database
  useEffect(() => {
    async function loadKpis() {
      const supabase = createClient();
      const { data } = await supabase
        .from("kpis")
        .select("id, name, type, unit, target_value, department:departments(name)")
        .eq("is_active", true)
        .order("name");

      if (data) {
        setKpiOptions(data as unknown as KpiOption[]);
      }
    }
    loadKpis();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='field']",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: insertError } = await supabase.from("kpi_entries").insert({
      kpi_id: selectedKpi,
      submitted_by: user.id,
      period_start: startDate,
      period_end: endDate,
      actual_value: parseFloat(actualValue),
      notes: notes || null,
    } as any);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    // Reset form
    setSelectedKpi("");
    setStartDate("");
    setEndDate("");
    setActualValue("");
    setNotes("");
    setTimeout(() => setSubmitted(false), 4000);
  }

  const selectedKpiDetails = kpiOptions.find((k) => k.id === selectedKpi);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div data-animate="field">
        <h1 className="text-2xl font-bold text-gray-900">Submit KPI Entry</h1>
        <p className="text-sm text-gray-500 mt-1">
          Report your KPI progress for the current period
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {/* KPI Selection */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
            Select KPI
          </label>
          <select
            value={selectedKpi}
            onChange={(e) => setSelectedKpi(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
            required
          >
            <option value="">Choose a KPI to report on...</option>
            {kpiOptions.map((kpi) => (
              <option key={kpi.id} value={kpi.id}>
                {kpi.name} — {kpi.department?.name || "Unassigned"} (Target: {kpi.target_value} {kpi.unit})
              </option>
            ))}
          </select>
          {selectedKpiDetails && (
            <p className="text-xs text-gray-500 mt-2">
              Type: {selectedKpiDetails.type} · Target: {selectedKpiDetails.target_value} {selectedKpiDetails.unit}
            </p>
          )}
        </div>

        {/* Period Selector */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            Reporting Period
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Actual Value */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Hash className="h-4 w-4 text-gray-400" />
            Actual Value
          </label>
          <input
            type="number"
            step="any"
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            placeholder={selectedKpiDetails ? `Target: ${selectedKpiDetails.target_value} ${selectedKpiDetails.unit}` : "Enter the achieved value..."}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
            required
          />
        </div>

        {/* Notes */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <FileText className="h-4 w-4 text-gray-400" />
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context or explanation for this entry..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div data-animate="field" className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg gradient-brand px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Submitting..." : "Submit Entry"}
          </button>
          {submitted && (
            <span className="text-sm text-emerald-600 font-medium">
              ✓ Entry submitted successfully! Waiting for manager approval.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
