"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ClipboardCheck, Calendar, Hash, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const kpiOptions = [
  { id: "1", name: "Monthly Revenue", department: "Sales & Marketing" },
  { id: "2", name: "Sprint Velocity", department: "Engineering" },
  { id: "3", name: "Customer Satisfaction", department: "Operations" },
  { id: "4", name: "Lead Conversion Rate", department: "Sales & Marketing" },
  { id: "5", name: "Feature Delivery", department: "Product" },
  { id: "6", name: "Employee Retention", department: "HR & Admin" },
  { id: "7", name: "SLA Compliance", department: "Operations" },
  { id: "8", name: "Operational Cost Reduction", department: "Finance" },
];

export default function NewEntryPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedKpi, setSelectedKpi] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actualValue, setActualValue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

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
                {kpi.name} — {kpi.department}
              </option>
            ))}
          </select>
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
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            placeholder="Enter the achieved value..."
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
            required
          />
          <p className="text-xs text-gray-400 mt-2">
            Enter the numeric value achieved during this period
          </p>
        </div>

        {/* Notes */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <FileText className="h-4 w-4 text-gray-400" />
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context or explanation for this entry..."
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <div data-animate="field" className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg gradient-brand px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
            Submit Entry
          </button>
          {submitted && (
            <span className="text-sm text-emerald-600 font-medium animate-pulse">
              ✓ Entry submitted successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
