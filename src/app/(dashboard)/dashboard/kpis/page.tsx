"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Target, Plus, Search, Loader2, X, Trash2, Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Kpi {
  id: string;
  name: string;
  description: string | null;
  type: string;
  timeframe: string;
  target_value: number;
  weight: number;
  unit: string | null;
  is_active: boolean;
  start_date: string | null;
  due_date: string | null;
  assigned_to: string | null;
  assignee: { id: string; full_name: string } | null;
  department: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

interface Member {
  id: string;
  full_name: string;
  department_id: string | null;
}

export default function KpisPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, isManager } = useAuth();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newType, setNewType] = useState("numerical");
  const [newTimeframe, setNewTimeframe] = useState("monthly");
  const [newTarget, setNewTarget] = useState("");
  const [newWeight, setNewWeight] = useState("10");
  const [newUnit, setNewUnit] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit form state
  const [editKpi, setEditKpi] = useState<Kpi | null>(null);
  const [edtName, setEdtName] = useState("");
  const [edtDesc, setEdtDesc] = useState("");
  const [edtType, setEdtType] = useState("numerical");
  const [edtTimeframe, setEdtTimeframe] = useState("monthly");
  const [edtTarget, setEdtTarget] = useState("");
  const [edtWeight, setEdtWeight] = useState("10");
  const [edtUnit, setEdtUnit] = useState("");
  const [edtStart, setEdtStart] = useState("");
  const [edtDue, setEdtDue] = useState("");
  const [edtAssignee, setEdtAssignee] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadData() {
    const supabase = createClient();
    const [kpiRes, deptRes, memberRes] = await Promise.all([
      supabase.from("kpis").select("*, department:departments(id, name), assignee:profiles!assigned_to(id, full_name)").eq("is_active", true).order("name"),
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("profiles").select("id, full_name, department_id").eq("is_active", true).order("full_name"),
    ]);
    if (kpiRes.data) setKpis(kpiRes.data as unknown as Kpi[]);
    if (deptRes.data) setDepartments(deptRes.data as Department[]);
    if (memberRes.data) setMembers(memberRes.data as Member[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='row']", { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  async function handleCreateKpi(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { error } = await supabase.from("kpis").insert({
      name: newName,
      description: newDesc || null,
      department_id: newDept,
      type: newType,
      timeframe: newTimeframe,
      target_value: parseFloat(newTarget),
      weight: parseFloat(newWeight),
      unit: newUnit || null,
      start_date: newStart || null,
      due_date: newDue || null,
      assigned_to: newAssignee || null,
      created_by: user?.id,
    } as any);

    if (!error) {
      setShowCreateForm(false);
      setNewName(""); setNewDesc(""); setNewDept(""); setNewTarget(""); setNewUnit("");
      setNewStart(""); setNewDue(""); setNewAssignee("");
      toast("KPI created successfully", "success");
      await loadData();
    } else {
      toast("Failed to create KPI", "error");
    }
    setCreating(false);
  }

  function openEdit(kpi: Kpi) {
    setEditKpi(kpi);
    setEdtName(kpi.name);
    setEdtDesc(kpi.description || "");
    setEdtType(kpi.type);
    setEdtTimeframe(kpi.timeframe);
    setEdtTarget(String(kpi.target_value));
    setEdtWeight(String(kpi.weight));
    setEdtUnit(kpi.unit || "");
    setEdtStart(kpi.start_date || "");
    setEdtDue(kpi.due_date || "");
    setEdtAssignee(kpi.assigned_to || "");
  }

  async function handleEditKpi(e: React.FormEvent) {
    e.preventDefault();
    if (!editKpi) return;
    setSavingEdit(true);
    const supabase = createClient();
    const { error } = await (supabase.from("kpis") as any)
      .update({
        name: edtName,
        description: edtDesc || null,
        type: edtType,
        timeframe: edtTimeframe,
        target_value: parseFloat(edtTarget),
        weight: parseFloat(edtWeight),
        unit: edtUnit || null,
        start_date: edtStart || null,
        due_date: edtDue || null,
        assigned_to: edtAssignee || null,
      })
      .eq("id", editKpi.id);

    if (!error) {
      toast("KPI updated successfully", "success");
      setEditKpi(null);
      await loadData();
    } else {
      toast("Failed to update KPI: " + error.message, "error");
    }
    setSavingEdit(false);
  }

  async function handleDeleteKpi() {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await (supabase.from("kpis") as any).update({ is_active: false }).eq("id", deleteId);
    if (!error) {
      toast("KPI deactivated", "success");
      await loadData();
    } else {
      toast("Failed to delete: " + error.message, "error");
    }
    setDeleteId(null);
  }

  const filtered = kpis.filter((kpi) =>
    kpi.name.toLowerCase().includes(search.toLowerCase())
  );

  // Total weight per department (across all active KPIs, ignoring search filter)
  const weightByDept = (() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const kpi of kpis) {
      const id = kpi.department?.id || "none";
      const name = kpi.department?.name || "No department";
      const cur = map.get(id) || { name, total: 0, count: 0 };
      cur.total += Number(kpi.weight) || 0;
      cur.count += 1;
      map.set(id, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Metrics</h1>
          <p className="text-sm text-gray-500 mt-1">{kpis.length} active KPIs</p>
        </div>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New KPI
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-2 max-w-sm">
        <Search className="h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search KPIs..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
      </div>

      {/* Weight totals per department */}
      {weightByDept.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Weight Distribution</h3>
            <span className="text-[11px] text-gray-400">Target: 100% per department</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {weightByDept.map((d) => {
              const ok = Math.round(d.total) === 100;
              const over = d.total > 100;
              return (
                <div key={d.name} className="rounded-lg border border-gray-100 bg-surface-tertiary/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 truncate">{d.name}</span>
                    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold",
                      ok ? "text-emerald-600" : over ? "text-red-600" : "text-amber-600"
                    )}>
                      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {d.total}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", ok ? "bg-emerald-500" : over ? "bg-red-500" : "bg-amber-500")}
                      style={{ width: `${Math.min(d.total, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {d.count} KPI{d.count !== 1 ? "s" : ""}
                    {!ok && (over ? ` · ${(d.total - 100).toFixed(0)}% over` : ` · ${(100 - d.total).toFixed(0)}% remaining`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create KPI Modal */}
      {showCreateForm && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Create New KPI</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleCreateKpi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="e.g. Sprint Velocity" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Department *</label>
              <select required value={newDept} onChange={(e) => setNewDept(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                <option value="numerical">Numerical</option>
                <option value="percentage">Percentage</option>
                <option value="currency">Currency</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Timeframe</label>
              <select value={newTimeframe} onChange={(e) => setNewTimeframe(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Target Value *</label>
              <input type="number" step="any" required value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none" placeholder="e.g. 50" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unit</label>
              <input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none" placeholder="e.g. points, %, IDR" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Weight (%)</label>
              <input type="number" min="1" max="100" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Deadline</label>
              <input type="date" value={newDue} min={newStart || undefined} onChange={(e) => setNewDue(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Assignee</label>
              <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                <option value="">Unassigned</option>
                {members
                  .filter((m) => !newDept || m.department_id === newDept)
                  .map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none" placeholder="Optional description" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={creating} className="rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {creating ? "Creating..." : "Create KPI"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-tertiary">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Name</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Type</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Target</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Timeframe</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Weight</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Schedule</th>
              {(isAdmin || isManager) && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((kpi) => (
              <tr key={kpi.id} data-animate="row" className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link href={`/dashboard/kpis/${kpi.id}`} className="text-sm font-medium text-gray-800 hover:text-brand-600 transition-colors">{kpi.name}</Link>
                  {kpi.description && <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">{kpi.description}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{kpi.department?.name || "—"}</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-600 capitalize">{kpi.type}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700 font-mono">{kpi.target_value} {kpi.unit || ""}</td>
                <td className="px-5 py-3.5 text-xs text-gray-600 capitalize">{kpi.timeframe}</td>
                <td className="px-5 py-3.5 text-xs text-gray-600">{kpi.weight}%</td>
                <td className="px-5 py-3.5 text-xs text-gray-600">
                  {kpi.start_date || kpi.due_date ? (
                    <span className="whitespace-nowrap">{kpi.start_date || "…"} → {kpi.due_date || "…"}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                  {kpi.assignee && <p className="text-[11px] text-gray-400 mt-0.5">{kpi.assignee.full_name}</p>}
                </td>
                {(isAdmin || isManager) && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(kpi)} className="p-1 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-500 transition-colors" title="Edit KPI">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => setDeleteId(kpi.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Deactivate KPI">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No KPIs found.</p>
        )}
      </div>

      {/* Edit KPI Modal */}
      {editKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !savingEdit && setEditKpi(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Edit KPI — {editKpi.name}</h3>
              <button onClick={() => setEditKpi(null)} disabled={savingEdit} className="text-gray-400 hover:text-gray-600 disabled:opacity-50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleEditKpi} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                <input type="text" required value={edtName} onChange={(e) => setEdtName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select value={edtType} onChange={(e) => setEdtType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                  <option value="numerical">Numerical</option>
                  <option value="percentage">Percentage</option>
                  <option value="currency">Currency</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Timeframe</label>
                <select value={edtTimeframe} onChange={(e) => setEdtTimeframe(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Target Value *</label>
                <input type="number" step="any" required value={edtTarget} onChange={(e) => setEdtTarget(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Weight (%) *</label>
                <input type="number" min="1" max="100" required value={edtWeight} onChange={(e) => setEdtWeight(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <input type="date" value={edtStart} onChange={(e) => setEdtStart(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Deadline</label>
                <input type="date" value={edtDue} min={edtStart || undefined} onChange={(e) => setEdtDue(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Assignee</label>
                <select value={edtAssignee} onChange={(e) => setEdtAssignee(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                <input type="text" value={edtUnit} onChange={(e) => setEdtUnit(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="e.g. points, %, IDR" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <input type="text" value={edtDesc} onChange={(e) => setEdtDesc(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="Optional description" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditKpi(null)} disabled={savingEdit} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={savingEdit} className="rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate KPI"
        message="This will hide the KPI from all users. Existing entries will be preserved. Continue?"
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleDeleteKpi}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
