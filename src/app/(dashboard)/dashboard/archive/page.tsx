"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Archive, RotateCcw, Loader2, Target } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RoleGuard } from "@/components/ui/role-guard";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ArchivedKpi {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  target_value: number;
  frequency: string;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ArchivePage() {
  return (
    <RoleGuard allowed={["admin"]}>
      <ArchiveContent />
    </RoleGuard>
  );
}

function ArchiveContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [kpis, setKpis] = useState<ArchivedKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function loadArchived() {
    const supabase = createClient();
    const { data } = await supabase
      .from("kpis")
      .select("*")
      .eq("is_active", false)
      .order("created_at", { ascending: false }) as unknown as { data: ArchivedKpi[] };
    setKpis(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadArchived();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  function handleReactivate(id: string) {
    setReactivatingId(id);
    setConfirmOpen(true);
  }

  async function confirmReactivate() {
    if (!reactivatingId) return;
    setConfirmOpen(false);
    setProcessing(true);

    const supabase = createClient() as any;
    const { error } = await supabase
      .from("kpis")
      .update({ is_active: true })
      .eq("id", reactivatingId);

    if (error) {
      toast("Failed to reactivate KPI", "error");
    } else {
      toast("KPI reactivated successfully", "success");
      await loadArchived();
    }

    setProcessing(false);
    setReactivatingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
        <p className="text-sm text-gray-500 mt-1">
          Deactivated KPIs · {kpis.length} items
        </p>
      </div>

      {kpis.length === 0 ? (
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-10 shadow-card text-center">
          <Archive className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No archived KPIs</p>
          <p className="text-xs text-gray-400 mt-1">Deactivated KPIs will appear here</p>
        </div>
      ) : (
        <div data-animate="card" className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">KPI Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Unit</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Target</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Frequency</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Archived On</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kpis.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-md bg-gray-100 p-1.5">
                          <Target className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{kpi.name}</p>
                          {kpi.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                              {kpi.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{kpi.unit}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{kpi.target_value}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">
                        {kpi.frequency}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(kpi.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleReactivate(kpi.id)}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Reactivate KPI"
        message="This will restore the KPI to active status. Team members will be able to submit entries for it again."
        confirmLabel="Reactivate"
        cancelLabel="Cancel"
        onConfirm={confirmReactivate}
        onCancel={() => {
          setConfirmOpen(false);
          setReactivatingId(null);
        }}
      />
    </div>
  );
}
