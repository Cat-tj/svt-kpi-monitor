"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { FileText, Sparkles, Bug, Wrench } from "lucide-react";

const changelog = [
  { version: "1.5.0", date: "2026-06-14", title: "Full Production Release", changes: ["All 52 features implemented", "Real Supabase data across all pages", "Export to Excel/CSV/PDF", "Dark mode & Indonesian language support", "KPI templates and bulk operations"] },
  { version: "1.4.0", date: "2026-06-13", title: "Role-Based Access & Approvals", changes: ["Three-tier RBAC: Admin, Manager, Staff", "Approval workflow with confirm dialogs", "Department-filtered data views", "Toast notifications on all actions"] },
  { version: "1.3.0", date: "2026-06-12", title: "KPI Management", changes: ["Create/deactivate KPIs with form", "KPI detail page with progress ring", "Department management", "Team member creation by admin"] },
  { version: "1.2.0", date: "2026-06-11", title: "Core Dashboard", changes: ["Executive Dashboard with real stats", "Submissions page with approve/reject", "My KPIs page for staff", "Analytics with achievement breakdown"] },
  { version: "1.1.0", date: "2026-06-10", title: "Authentication & Security", changes: ["Supabase Auth integration", "Row-Level Security policies", "Session management via middleware", "Password change functionality"] },
  { version: "1.0.0", date: "2026-06-09", title: "Initial Setup", changes: ["Next.js 14 project scaffolding", "Tailwind CSS + GSAP animations", "Database schema design", "Login page"] },
];

function getIcon(version: string) {
  if (version.endsWith(".0.0")) return Sparkles;
  if (version.startsWith("1.5") || version.startsWith("1.4")) return Wrench;
  return Bug;
}

export default function ChangelogPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='card']", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Changelog</h1><p className="text-sm text-gray-500 mt-1">Version history and release notes</p></div>
      <div className="space-y-4">
        {changelog.map((entry) => {
          const Icon = getIcon(entry.version);
          return (
            <div key={entry.version} data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-brand-50 p-2.5 mt-0.5"><Icon className="h-4 w-4 text-brand-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">v{entry.version}</span>
                    <span className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mt-2">{entry.title}</h3>
                  <ul className="mt-2 space-y-1">
                    {entry.changes.map((change, i) => (<li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-300 flex-shrink-0" />{change}</li>))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
