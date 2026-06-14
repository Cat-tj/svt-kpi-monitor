"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, Plus, Loader2, MessageSquare, Paperclip, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { approveEntry, rejectEntry, updateEntryDecision } from "@/lib/supabase/queries";
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
  score: number | null;
  created_at: string;
  kpi: { id: string; name: string; target_value: number; unit: string | null; department_id: string; department: { name: string } | null } | null;
  submitter: { full_name: string; email: string } | null;
  attachments?: { id: string; file_name: string; file_url: string }[];
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
  const [showApproveInput, setShowApproveInput] = useState<string | null>(null);
  const [approveScore, setApproveScore] = useState<Record<string, number>>({});
  const [approveNotes, setApproveNotes] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  // Edit-review panel (for already-decided entries)
  const [editReviewId, setEditReviewId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<"approved" | "rejected" | "pending">("approved");
  const [editScore, setEditScore] = useState(100);
  const [editNotes, setEditNotes] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  async function loadEntries() {
    if (!user) return;
    const supabase = createClient();

    let query = supabase
      .from("kpi_entries")
      .select("*, kpi:kpis(id, name, target_value, unit, department_id, department:departments(name)), submitter:profiles!submitted_by(full_name, email), attachments(id, file_name, file_url)")
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
    const score = approveScore[entryId] ?? 100;
    const { error } = await approveEntry(supabase, entryId, user.id, score, approveNotes[entryId]);
    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast(`Entry approved with score ${score}%`, "success");
      setShowApproveInput(null);
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

  function openEditReview(entry: Entry) {
    setEditReviewId(entry.id);
    setEditStatus(entry.status as "approved" | "rejected" | "pending");
    setEditScore(entry.score ?? 100);
    setEditNotes(entry.review_notes ?? "");
  }

  async function handleSaveReview(entryId: string) {
    if (!user) return;
    if (editStatus === "rejected" && !editNotes.trim()) {
      toast("Rejection reason is required", "error");
      return;
    }
    setSavingReview(true);
    const supabase = createClient();
    const { error } = await updateEntryDecision(supabase, entryId, user.id, editStatus, {
      score: editScore,
      notes: editNotes,
    });
    if (!error) {
      toast("Review updated", "success");
      setEditReviewId(null);
      await loadEntries();
    } else {
      toast("Failed to update: " + (error as any).message, "error");
    }
    setSavingReview(false);
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
                      {entry.attachments && entry.attachments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {entry.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-brand-50 border border-brand-200 px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                            >
                              <Paperclip className="h-3 w-3" />
                              {att.file_name.length > 24 ? att.file_name.slice(0, 24) + "..." : att.file_name}
                            </a>
                          ))}
                        </div>
                      )}
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
                        <button onClick={() => { setShowApproveInput(showApproveInput === entry.id ? null : entry.id); setShowRejectInput(null); }} disabled={actionLoading === entry.id} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50">
                          ✓ Approve
                        </button>
                        <button onClick={() => { setShowRejectInput(showRejectInput === entry.id ? null : entry.id); setShowApproveInput(null); }} disabled={actionLoading === entry.id} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50">
                          ✗ Reject
                        </button>
                      </div>
                    )}

                    {entry.status === "approved" && entry.score != null && (
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border",
                        entry.score >= 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        entry.score >= 75 ? "bg-blue-50 text-blue-700 border-blue-200" :
                        entry.score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        Score: {entry.score}%
                      </span>
                    )}

                    {entry.status !== "pending" && (
                      <button onClick={() => editReviewId === entry.id ? setEditReviewId(null) : openEditReview(entry)} disabled={savingReview} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-brand-600 hover:bg-brand-50 border border-gray-200 transition-colors disabled:opacity-50">
                        <Pencil className="h-3 w-3" /> Edit decision
                      </button>
                    )}
                  </div>
                </div>

                {editReviewId === entry.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <label className="text-xs font-medium text-gray-600">Change decision</label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {([
                        { val: "approved", label: "✓ Approved", on: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                        { val: "rejected", label: "✗ Rejected", on: "bg-red-50 text-red-700 border-red-200" },
                        { val: "pending", label: "↺ Back to pending", on: "bg-amber-50 text-amber-700 border-amber-200" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setEditStatus(opt.val)}
                          className={cn("rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors",
                            editStatus === opt.val ? opt.on : "text-gray-500 border-gray-200 hover:bg-gray-50")}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {editStatus === "approved" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-gray-500">Work score</label>
                          <span className="text-sm font-semibold text-emerald-700">{editScore}%</span>
                        </div>
                        <input type="range" min={0} max={100} step={5} value={editScore} onChange={(e) => setEditScore(Number(e.target.value))} className="w-full accent-emerald-500" />
                      </div>
                    )}

                    {editStatus !== "pending" && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder={editStatus === "rejected" ? "Reason for rejection (required)..." : "Note (optional)..."}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-300"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditReviewId(null)} disabled={savingReview} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                      <button onClick={() => handleSaveReview(entry.id)} disabled={savingReview || (editStatus === "rejected" && !editNotes.trim())} className="rounded-lg gradient-brand text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                        {savingReview ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}

                {showApproveInput === entry.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600">Work score — does it meet the target?</label>
                      <span className="text-sm font-semibold text-emerald-700">{approveScore[entry.id] ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={approveScore[entry.id] ?? 100}
                      onChange={(e) => setApproveScore((prev) => ({ ...prev, [entry.id]: Number(e.target.value) }))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[50, 75, 90, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setApproveScore((prev) => ({ ...prev, [entry.id]: preset }))}
                          className={cn(
                            "rounded-md px-2 py-1 text-[11px] font-medium border transition-colors",
                            (approveScore[entry.id] ?? 100) === preset
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "text-gray-500 border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          {preset === 100 ? "100% (Sesuai penuh)" : `${preset}%`}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <input type="text" placeholder="Approval note (optional)..." value={approveNotes[entry.id] || ""} onChange={(e) => setApproveNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-300" />
                      <button onClick={() => setConfirmAction({ id: entry.id, action: "approve" })} disabled={actionLoading === entry.id} className="rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-600 disabled:opacity-50">
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                {showRejectInput === entry.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input type="text" placeholder="Reason for rejection (required)..." value={rejectNotes[entry.id] || ""} onChange={(e) => setRejectNotes((prev) => ({ ...prev, [entry.id]: e.target.value }))} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-red-300" />
                    <button onClick={() => setConfirmAction({ id: entry.id, action: "reject" })} disabled={!rejectNotes[entry.id]?.trim()} className="rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed">
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
        message={confirmAction?.action === "approve" ? `Approve this entry with a work score of ${confirmAction ? (approveScore[confirmAction.id] ?? 100) : 100}%? This will be recorded and cannot be undone.` : "Are you sure you want to reject this entry? The staff member will be notified."}
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
