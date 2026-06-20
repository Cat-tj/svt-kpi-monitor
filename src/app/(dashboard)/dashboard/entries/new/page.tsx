"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ClipboardCheck, Calendar, Hash, FileText, Send, Loader2, Paperclip, X } from "lucide-react";
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
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("");
  const [output, setOutput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
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

    const { data: insertData, error: insertError } = await supabase.from("kpi_entries").insert({
      kpi_id: selectedKpi,
      submitted_by: user.id,
      period_start: startDate,
      period_end: endDate,
      actual_value: numValue,
      notes: notes || null,
      issue: issue || null,
      priority: priority || null,
      output: output || null,
    } as any).select().single();

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

    // Upload attachments if any
    const entryId = (insertData as any)?.id;
    if (entryId && files.length > 0) {
      for (const file of files) {
        const path = `${user.id}/${entryId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("kpi-evidence")
          .upload(path, file, { upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("kpi-evidence").getPublicUrl(path);
          await supabase.from("attachments").insert({
            entry_id: entryId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            uploaded_by: user.id,
          } as any);
        }
      }
    }

    toast("Entry submitted successfully! Waiting for approval.", "success");
    setSelectedKpi(""); setStartDate(""); setEndDate(""); setActualValue(""); setNotes(""); setIssue(""); setPriority(""); setOutput(""); setFiles([]);
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

        {/* Output / Outcome */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <ClipboardCheck className="h-4 w-4 text-gray-400" />
            Output / Outcome
          </label>
          <textarea value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Hasil/output yang dicapai dari aktivitas ini..." rows={3} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 resize-none" />
        </div>

        {/* Issue & Priority */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <FileText className="h-4 w-4 text-gray-400" />
            Issue & Priority (optional)
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Issue / Kendala</label>
              <textarea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Masalah yang ditemukan selama pengerjaan..." rows={2} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100">
                <option value="">— No priority —</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evidence Attachments */}
        <div data-animate="field" className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Paperclip className="h-4 w-4 text-gray-400" />
            Evidence / Proof (optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,.xlsx,.xls,.doc,.docx"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setFiles((prev) => [...prev, ...selected]);
              e.target.value = "";
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
          <p className="text-xs text-gray-400 mt-2">Upload screenshots, documents, or photos as proof. Max 10MB each (PNG, JPG, PDF, Excel, Word).</p>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
