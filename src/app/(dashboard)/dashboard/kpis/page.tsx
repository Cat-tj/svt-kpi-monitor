"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Target, Plus, Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

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
  department: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

export default function KpisPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, isManager } = useAuth();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newType, setNewType] = useState("numerical");
  const [newTimeframe, setNewTimeframe] = useState("monthly");
  const [newTarget, setNewTarget] = useState("");
  const [newWeight, setNewWeight] = useState("10");
  const [newUnit, setNewUnit] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadData() {
    const supabase = createClient();
    const [kpiRes, deptRes] = await Promise.all([
      supabase.from("kpis").select("*, department:departments(id, name)").eq("is_active", true).order("name"),
      supabase.from("departments").select("id, name").order("name"),
    ]);
    if (kpiRes.data) setKpis(kpiRes.data as unknown as Kpi[]);
    if (deptRes.data) setDepartments(deptRes.data as Department[]);
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
      created_by: user?.id,
    } as any);

    if (!error) {
      setShowCreateForm(false);
      setNewName(""); setNewDesc(""); setNewDept(""); setNewTarget(""); setNewUnit("");
      await loadData();
    }
    setCreating(false);
  }

  const filtered = kpis.filter((kpi) =>
    kpi.name.toLowerCase().includes(search.toLowerCase())
  );

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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((kpi) => (
              <tr key={kpi.id} data-animate="row" className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="text-sm font-medium text-gray-800">{kpi.name}</span>
                  {kpi.description && <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">{kpi.description}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{kpi.department?.name || "—"}</span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-600 capitalize">{kpi.type}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700 font-mono">{kpi.target_value} {kpi.unit || ""}</td>
                <td className="px-5 py-3.5 text-xs text-gray-600 capitalize">{kpi.timeframe}</td>
                <td className="px-5 py-3.5 text-xs text-gray-600">{kpi.weight}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No KPIs found.</p>
        )}
      </div>
    </div>
  );
}
