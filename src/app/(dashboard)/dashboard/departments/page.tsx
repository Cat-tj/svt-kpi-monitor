"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Building2, Users, Target, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const departments = [
  {
    id: "1",
    name: "Engineering",
    description: "Software development, infrastructure, and technical operations",
    headCount: 42,
    kpiCount: 8,
    achievement: 94.2,
    manager: "Andi Setiawan",
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
  },
  {
    id: "2",
    name: "Sales & Marketing",
    description: "Revenue generation, brand management, and customer acquisition",
    headCount: 35,
    kpiCount: 6,
    achievement: 88.7,
    manager: "Dina Pratiwi",
    color: "bg-violet-500",
    lightColor: "bg-violet-50",
  },
  {
    id: "3",
    name: "Product",
    description: "Product strategy, roadmap planning, and feature prioritization",
    headCount: 18,
    kpiCount: 5,
    achievement: 85.1,
    manager: "Rizky Firmansyah",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
  },
  {
    id: "4",
    name: "Operations",
    description: "Service delivery, SLA management, and operational efficiency",
    headCount: 24,
    kpiCount: 7,
    achievement: 79.4,
    manager: "Sari Wulandari",
    color: "bg-amber-500",
    lightColor: "bg-amber-50",
  },
  {
    id: "5",
    name: "Finance",
    description: "Financial planning, budgeting, cost management, and reporting",
    headCount: 12,
    kpiCount: 4,
    achievement: 76.8,
    manager: "Budi Santoso",
    color: "bg-rose-500",
    lightColor: "bg-rose-50",
  },
  {
    id: "6",
    name: "HR & Admin",
    description: "Talent acquisition, employee development, and administration",
    headCount: 11,
    kpiCount: 3,
    achievement: 72.3,
    manager: "Maya Anggraini",
    color: "bg-gray-500",
    lightColor: "bg-gray-50",
  },
];

export default function DepartmentsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='dept']",
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage organizational units and their KPI assignments
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              <p className="text-xs text-gray-500">Total Departments</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2.5">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {departments.reduce((acc, d) => acc + d.headCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {departments.reduce((acc, d) => acc + d.kpiCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Active KPIs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            data-animate="dept"
            className="rounded-xl border border-border bg-surface p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-3 w-3 rounded-full", dept.color)} />
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                  {dept.name}
                </h3>
              </div>
              <span className={cn(
                "text-xs font-bold",
                dept.achievement >= 90 ? "text-emerald-600" :
                dept.achievement >= 75 ? "text-amber-600" : "text-red-600"
              )}>
                {dept.achievement}%
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{dept.description}</p>

            {/* Achievement Bar */}
            <div className="mb-4">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", dept.color)}
                  style={{ width: `${dept.achievement}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{dept.headCount} staff</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                <span>{dept.kpiCount} KPIs</span>
              </div>
              <span className="text-gray-400">Mgr: {dept.manager.split(" ")[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
