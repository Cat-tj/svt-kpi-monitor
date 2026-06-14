"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Building2, Plus, Loader2, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RoleGuard } from "@/components/ui/role-guard";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function DepartmentsPage() {
  return (
    <RoleGuard allowed={["admin"]}>
      <DepartmentsContent />
    </RoleGuard>
  );
}

function DepartmentsContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  async function loadDepartments() {
    const supabase = createClient();
    const { data } = await supabase.from("departments").select("*").order("name");
    if (data) setDepartments(data as Department[]);
    setLoading(false);
  }

  useEffect(() => { loadDepartments(); }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='dept']", { opacity: 0, y: 20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  function openCreate() {
    setEditing(null);
    setName("");
    setDesc("");
    setShowForm(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setName(dept.name);
    setDesc(dept.description || "");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    if (editing) {
      // Update
      const { error } = await (supabase.from("departments") as any)
        .update({ name, description: desc || null })
        .eq("id", editing.id);
      if (!error) {
        toast("Department updated", "success");
        setShowForm(false);
        await loadDepartments();
      } else {
        toast("Failed to update: " + error.message, "error");
      }
    } else {
      // Create
      const { error } = await supabase.from("departments").insert({ name, description: desc || null } as any);
      if (!error) {
        toast("Department created", "success");
        setShowForm(false);
        await loadDepartments();
      } else {
        toast("Failed to create: " + error.message, "error");
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const supabase = createClient();
    const { error } = await supabase.from("departments").delete().eq("id", deleteTarget.id);
    if (!error) {
      toast("Department deleted", "success");
      await loadDepartments();
    } else {
      toast("Cannot delete: department may have KPIs or members assigned. " + error.message, "error");
    }
    setDeleteTarget(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">{departments.length} departments</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Department
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{editing ? "Edit Department" : "New Department"}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSave} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="Department name" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none" placeholder="Optional" />
            </div>
            <button type="submit" disabled={saving} className="rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {saving ? "..." : editing ? "Update" : "Create"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} data-animate="dept" className="rounded-xl border border-border bg-surface p-5 shadow-card group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2"><Building2 className="h-4 w-4 text-blue-600" /></div>
                <h3 className="text-sm font-semibold text-gray-900">{dept.name}</h3>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(dept)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(dept)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {dept.description && <p className="text-xs text-gray-500 mb-3">{dept.description}</p>}
            <p className="text-[10px] text-gray-400">Created {new Date(dept.created_at).toLocaleDateString("id-ID")}</p>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Department"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. KPIs and members assigned to this department must be reassigned first.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
