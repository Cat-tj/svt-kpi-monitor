"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Users, Shield, Loader2, Plus, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  department: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Admin", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  manager: { label: "Manager", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  staff: { label: "Staff", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

export default function TeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  // Invite form
  const [invEmail, setInvEmail] = useState("");
  const [invPassword, setInvPassword] = useState("");
  const [invName, setInvName] = useState("");
  const [invRole, setInvRole] = useState("staff");
  const [invDept, setInvDept] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invError, setInvError] = useState("");
  const [invSuccess, setInvSuccess] = useState("");

  async function loadData() {
    const supabase = createClient();
    const [membersRes, deptRes] = await Promise.all([
      supabase.from("profiles").select("*, department:departments(id, name)").eq("is_active", true).order("full_name"),
      supabase.from("departments").select("id, name").order("name"),
    ]);
    if (membersRes.data) setMembers(membersRes.data as unknown as Member[]);
    if (deptRes.data) setDepartments(deptRes.data as Department[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='member']", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInvError("");
    setInvSuccess("");

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: invEmail,
        password: invPassword,
        full_name: invName,
        role: invRole,
        department_id: invDept || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setInvError(data.error || "Failed to create user");
    } else {
      setInvSuccess(`User ${data.user.email} created successfully as ${data.user.role}!`);
      setInvEmail(""); setInvPassword(""); setInvName(""); setInvRole("staff"); setInvDept("");
      await loadData();
    }
    setInviting(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id, hardDelete: true }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`${deleteTarget.full_name} removed`, "success");
      await loadData();
    } else {
      toast(data.error || "Failed to delete user", "error");
    }
    setDeleteTarget(null);
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} members</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Create New Member</h3>
            <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full Name *</label>
              <input type="text" required value={invName} onChange={(e) => setInvName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email *</label>
              <input type="email" required value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="user@sentravisi.com" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password *</label>
              <input type="text" required value={invPassword} onChange={(e) => setInvPassword(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Role *</label>
              <select value={invRole} onChange={(e) => setInvRole(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Department</label>
              <select value={invDept} onChange={(e) => setInvDept(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                <option value="">No department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={inviting} className="rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                {inviting ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
          {invError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{invError}</p>}
          {invSuccess && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 mt-3">{invSuccess}</p>}
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-tertiary">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Member</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Joined</th>
              {isAdmin && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map((member) => {
              const config = roleConfig[member.role] || roleConfig.staff;
              const initials = member.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <tr key={member.id} data-animate="member" className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">{initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                        <p className="text-[11px] text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border", config.bg, config.color)}>
                      <Shield className="h-3 w-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{member.department?.name || "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(member.created_at).toLocaleDateString("id-ID")}</td>
                  {isAdmin && (
                    <td className="px-5 py-3.5">
                      {member.id !== user?.id && (
                        <button onClick={() => setDeleteTarget(member)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Team Member"
        message={`Permanently remove ${deleteTarget?.full_name} (${deleteTarget?.email})? Their account and access will be deleted. This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
