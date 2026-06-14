"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { fetchAllEntries, approveEntry, rejectEntry } from "@/lib/supabase/queries";

interface Entry {
  id: string;
  actual_value: number;
  period_start: string;
  period_end: string;
  status: string;
  notes: string | null;
  review_notes: string | null;
  created_at: string;
  kpi: { id: string; name: string; target_value: number; unit: string | null; department: { name: string } | null } | null;
  submitter: { full_name: string; email: string } | null;
}

export default function EntriesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  async function loadEntries() {
    const supabase = createClient();
    const { data } = await fetchAllEntries(supabase, statusFilter === "all" ? undefined : statusFilter);
    if (data) setEntries(data as unknown as Entry[]);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
  }, [statusFilter]);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='entry']",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading, statusFilter]);

  async function handleApprove(entryId: string) {
    if (!user) return;
    setActionLoading(entryId);
    const supabase = createClient();
    const { error } = await approveEntry(supabase, entryId, user.id);
    if (!error) {
      setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, status: "approved" } : e));
    }
    setActionLoading(null);
  }

  async function handleReject(entryId: string) {
    if (!user) return;
    setActionLoading(entryId);
    const supabase = createClient();
    const { error } = await rejectEntry(supabase, entryId, user.id, rejectNotes[entryId]);
    if (!error) {
      setEntries((prev) => prev.map((e) => e.id === entryId ? { ...e, status: "rejected" } : e));
      setShowRejectInput(null);
    }
    setActionLoading(null);
  }

  const counts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === "pending").length,
    approved: entries.filter((e) => e.status === "approved").length,
    rejected: entries.filter((e) => e.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve KPI entry submissions
          </p>
        </div>
        <Link
          href="/dashboard/entries/new"
          className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2">
        {(["all", "pending", "approved", "rejected"]).map((status) => (
          <button
            key={status}
            onClick={() => { setLoading(true); setStatusFilter(status); }}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              statusFilter === status
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent"
            )}
          >
            <span className="capitalize">{status}</span>
            <span className="ml-1.5 text-[11px] text-gray-400">
              ({counts[status as keyof typeof counts] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center shadow-card">
          <p className="text-sm text-gray-500">No entries found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const achievement = entry.kpi ? Math.min((entry.actual_value / entry.kpi.target_value) * 100, 150) : 0;
            const isProcessing = actionLoading === entry.id;

            return (
              <div
                key={entry.id}
                data-animate="entry"
                className="rounded-xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600">
                        {entry.submitter?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {entry.submitter?.full_name || "Unknown"}
                        </h3>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {entry.kpi?.department?.name || ""}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">{entry.kpi?.name || "KPI"}</span>
                        {" · "}
                        <span className="font-mono text-brand-600">{entry.actual_value} {entry.kpi?.unit || ""}</span>
                        <span className="text-gray-400"> / {entry.kpi?.target_value} ({achievement.toFixed(0)}%)</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Period: {entry.period_start} → {entry.period_end} · Submitted {new Date(entry.created_at).toLocaleDateString("id-ID")}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-gray-500 mt-1.5 italic border-l-2 border-gray-200 pl-2">
                          {entry.notes}
                        </p>
                      )}
                      {entry.review_notes && entry.status !== "pending" && (
                        <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded px-2 py-1">
                          Review: {entry.review_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {entry.status === "pending" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                    {entry.status === "approved" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                    )}
                    {entry.status === "rejected" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                        <XCircle className="h-3 w-3" /> Rejected
                      </span>
                    )}

                    {entry.status === "pending" && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => handleApprove(entry.id)}
                          disabled={isProcessing}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? "..." : "✓ Approve"}
                        </button>
                        <button
                          onClick={() => setShowRejectInput(showRejectInput === entry.id ? null : entry.id)}
                          disabled={isProcessing}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reject notes input */}
                {showRejectInput === entry.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Reason for rejection (optional)..."
                      value={rejectNotes[entry.id] || ""}
                      onChange={(e) => setRejectNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-red-300"
                    />
                    <button
                      onClick={() => handleReject(entry.id)}
                      className="rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-600"
                    >
                      Confirm Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
