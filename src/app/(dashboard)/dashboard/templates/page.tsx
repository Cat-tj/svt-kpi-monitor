"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Layers, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RoleGuard } from "@/components/ui/role-guard";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface KpiTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  kpi_data: any[];
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

export default function TemplatesPage() {
  return (
    <RoleGuard allowed={["admin", "manager"]}>
      <TemplatesContent />
    </RoleGuard>
  );
}

function TemplatesContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<KpiTemplate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [applyingTemplate, setApplyingTemplate] = useState<KpiTemplate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [templatesRes, deptsRes] = await Promise.all([
        supabase.from("kpi_templates").select("*").order("category") as unknown as { data: KpiTemplate[] },
        supabase.from("departments").select("id, name").order("name") as unknown as { data: Department[] },
      ]);

      setTemplates(templatesRes.data || []);
      setDepartments(deptsRes.data || []);
      setLoading(false);
    }

    loadData();
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

  function handleApplyClick(template: KpiTemplate) {
    if (!selectedDept) {
      toast("Please select a department first", "warning");
      return;
    }
    setApplyingTemplate(template);
    setConfirmOpen(true);
  }

  async function handleConfirmApply() {
    if (!applyingTemplate || !selectedDept) return;
    setConfirmOpen(false);
    setApplying(true);

    const supabase = createClient();
    const kpisToInsert = (applyingTemplate.kpi_data || []).map((kpi: any) => ({
      name: kpi.name,
      description: kpi.description || null,
      unit: kpi.unit || "number",
      target_value: kpi.target_value || 0,
      weight: kpi.weight || 10,
      type: kpi.type || "numerical",
      department_id: selectedDept,
      timeframe: kpi.timeframe || "monthly",
      is_active: true,
    }));

    if (kpisToInsert.length === 0) {
      toast("Template has no KPIs to apply", "warning");
      setApplying(false);
      return;
    }

    const { error } = await supabase.from("kpis").insert(kpisToInsert as any);

    if (error) {
      toast("Failed to apply template", "error");
    } else {
      toast(`Applied ${kpisToInsert.length} KPIs from template`, "success");
    }

    setApplying(false);
    setApplyingTemplate(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const categories = Array.from(new Set(templates.map((t) => t.category || "Uncategorized")));

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pre-defined KPI sets for quick department setup
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Target Department:</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
          >
            <option value="">Select department...</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {templates.length === 0 ? (
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-10 shadow-card text-center">
          <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No templates available</p>
          <p className="text-xs text-gray-400 mt-1">Templates can be added to the kpi_templates table</p>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates
                .filter((t) => (t.category || "Uncategorized") === category)
                .map((template) => (
                  <div
                    key={template.id}
                    data-animate="card"
                    className="rounded-xl border border-border bg-surface p-5 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-indigo-50 p-2">
                        <Layers className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                        {template.description && (
                          <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">
                          {Array.isArray(template.kpi_data) ? template.kpi_data.length : 0} KPIs included
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyClick(template)}
                      disabled={applying}
                      className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Apply Template
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Apply Template"
        message={`This will create ${
          applyingTemplate?.kpi_data?.length || 0
        } KPIs from "${applyingTemplate?.name || ""}" for the selected department. Continue?`}
        confirmLabel="Apply"
        cancelLabel="Cancel"
        onConfirm={handleConfirmApply}
        onCancel={() => {
          setConfirmOpen(false);
          setApplyingTemplate(null);
        }}
      />
    </div>
  );
}

