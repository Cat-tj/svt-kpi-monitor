"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Building2, Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function DepartmentsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { error } = await supabase.from("departments").insert({ name: newName, description: newDesc || null } as any);
    if (!error) {
      setShowCreate(false);
      setNewName(""); setNewDesc("");
      await loadDepartments();
    }
    setCreating(false);
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
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Department
          </button>
        )}
      </div>

      {showCreate && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">New Department</h3>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="Department name" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none" placeholder="Optional" />
            </div>
            <button type="submit" disabled={creating} className="rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {creating ? "..." : "Create"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} data-animate="dept" className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-blue-50 p-2"><Building2 className="h-4 w-4 text-blue-600" /></div>
              <h3 className="text-sm font-semibold text-gray-900">{dept.name}</h3>
            </div>
            {dept.description && <p className="text-xs text-gray-500 mb-3">{dept.description}</p>}
            <p className="text-[10px] text-gray-400">Created {new Date(dept.created_at).toLocaleDateString("id-ID")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
