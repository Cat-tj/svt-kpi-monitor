"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, Plus, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { approveEntry, rejectEntry } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RoleGuard } from "@/components/ui/role-guard";

interface Entry {
  id: string;
  actual_value: number;
  period_start: string;
  period_end: string;
  status: string;
  notes: string | null;
  review_notes: string | null;
  created_at: string;
  kpi: { id: string; name: string; target_value: number; unit: string | null; department_id: string; department: { name: string } | null } | null;
  submitter: { full_name: string; email: string } | null;
}

export default function EntriesPage() {
  return (
    <RoleGuard allowed={["admin", "manager"]}>
      <EntriesContent />
    </RoleGuard>
  );
}

function EntriesContent() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  async function loadEntries() {
    if (!user) return;
    const supabase = createClient();

    let query = supabase
      .from("kpi_entries")
      .select("*, kpi:kpis(id, name, target_value, unit, department_id, department:departments(name)), submitter:profiles!submitted_by(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    let filtered = (data || []) as unknown as Entry[];

    // Manager only sees their department's entries (#3)
    if (!isAdmin && user.department_id) {
      filtered = filtered.filter((e) => e.kpi?.department_id === user.department_id);
    }

    setEntries(filtered);
    setLoading(false);
  }

  useEffect(() => { setLoading(true); loadEntries(); }, [statusFilter, user]);

  async function handleApprove(entryId: string) {
    if (!user) return;
    setActionLoading(entryId);
    const supabase = createClient();
    const { error } = await approveEntry(supabase, entryId, user.id);
    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast("Entry approved successfully", "success");
    } else {
      toast("Failed to approve: " + (error as any).message, "error");
    }
    setActionLoading(null);
    setConfirmAction(null);
  }

  async function handleReject(entryId: string) {
    if (!user) return;
    setActionLoading(entryId);
    const supabase = createClient();
    const { error } = await rejectEntry(supabase, entryId, user.id, rejectNotes[entryId]);
    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast("Entry rejected", "warning");
      setShowRejectInput(null);
    } else {
      toast("Failed to reject: " + (error as any).message, "error");
    }
    setActionLoading(null);
    setConfirmAction(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve KPI entries</p>
        </div>
        <Link href="/dashboard/entries/new" className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> New Entry
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button key={status} onClick={() => setStatusFilter(status)} className={cn("rounded-lg px-3.5 py-2 text-sm font-medium transition-all capitalize", statusFilter === status ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-gray-500 hover:bg-gray-50 border border-transparent")}>
            {status}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center shadow-card">
          <p className="text-sm text-gray-500">No {statusFilter === "all" ? "" : statusFilter} entries found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const achievement = entry.kpi ? Math.min((entry.actual_value / entry.kpi.target_value) * 100, 150) : 0;
            return (
              <div key={entry.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600">
                        {entry.submitter?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{entry.submitter?.full_name || "Unknown"}</h3>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{entry.kpi?.department?.name || ""}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">{entry.kpi?.name || "KPI"}</span>{" · "}
                        <span className="font-mono text-brand-600">{entry.actual_value} {entry.kpi?.unit || ""}</span>
                        <span className="text-gray-400"> / {entry.kpi?.target_value} ({achievement.toFixed(0)}%)</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Period: {entry.period_start} → {entry.period_end} · {new Date(entry.created_at).toLocaleDateString("id-ID")}</p>
                      {entry.notes && <p className="text-xs text-gray-500 mt-1.5 italic border-l-2 border-gray-200 pl-2">{entry.notes}</p>}
                      {entry.review_notes && <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded px-2 py-1">Review: {entry.review_notes}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={cn("flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                      entry.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      entry.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    )}>
                      {entry.status === "pending" && <Clock className="h-3 w-3" />}
                      {entry.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                      {entry.status === "rejected" && <XCircle className="h-3 w-3" />}
                      <span className="capitalize">{entry.status}</span>
                    </span>

                    {entry.status === "pending" && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button onClick={() => setConfirmAction({ id: entry.id, action: "approve" })} disabled={actionLoading === entry.id} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50">
                          ✓ Approve
                        </button>
                        <button onClick={() => setShowRejectInput(showRejectInput === entry.id ? null : entry.id)} disabled={actionLoading === entry.id} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50">
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {showRejectInput === entry.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input type="text" placeholder="Reason for rejection..." value={rejectNotes[entry.id] || ""} onChange={(e) => setRejectNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-red-300" />
                    <button onClick={() => setConfirmAction({ id: entry.id, action: "reject" })} className="rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-600">
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog (#11) */}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.action === "approve" ? "Approve Entry" : "Reject Entry"}
        message={confirmAction?.action === "approve" ? "Are you sure you want to approve this entry? This action cannot be undone." : "Are you sure you want to reject this entry? The staff member will be notified."}
        confirmLabel={confirmAction?.action === "approve" ? "Approve" : "Reject"}
        variant={confirmAction?.action === "reject" ? "danger" : "default"}
        onConfirm={() => {
          if (confirmAction?.action === "approve") handleApprove(confirmAction.id);
          else if (confirmAction) handleReject(confirmAction.id);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
