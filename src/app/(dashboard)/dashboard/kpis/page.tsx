"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  Target,
  Plus,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock KPI data
const kpiData = [
  {
    id: "1",
    name: "Monthly Revenue",
    department: "Sales & Marketing",
    type: "currency" as const,
    timeframe: "monthly" as const,
    target: 3000000000,
    actual: 2840000000,
    weight: 25,
    unit: "IDR",
    trend: +12.5,
    isActive: true,
  },
  {
    id: "2",
    name: "Sprint Velocity",
    department: "Engineering",
    type: "numerical" as const,
    timeframe: "weekly" as const,
    target: 50,
    actual: 42,
    weight: 15,
    unit: "points",
    trend: +8.2,
    isActive: true,
  },
  {
    id: "3",
    name: "Customer Satisfaction",
    department: "Operations",
    type: "percentage" as const,
    timeframe: "monthly" as const,
    target: 95,
    actual: 96.2,
    weight: 20,
    unit: "%",
    trend: +1.1,
    isActive: true,
  },
  {
    id: "4",
    name: "Lead Conversion Rate",
    department: "Sales & Marketing",
    type: "percentage" as const,
    timeframe: "monthly" as const,
    target: 30,
    actual: 23.4,
    weight: 20,
    unit: "%",
    trend: -2.3,
    isActive: true,
  },
  {
    id: "5",
    name: "Feature Delivery",
    department: "Product",
    type: "numerical" as const,
    timeframe: "monthly" as const,
    target: 10,
    actual: 8,
    weight: 15,
    unit: "features",
    trend: +5.0,
    isActive: true,
  },
  {
    id: "6",
    name: "Employee Retention",
    department: "HR & Admin",
    type: "percentage" as const,
    timeframe: "annually" as const,
    target: 90,
    actual: 87.5,
    weight: 10,
    unit: "%",
    trend: -1.5,
    isActive: true,
  },
  {
    id: "7",
    name: "SLA Compliance",
    department: "Operations",
    type: "percentage" as const,
    timeframe: "monthly" as const,
    target: 99,
    actual: 96.2,
    weight: 20,
    unit: "%",
    trend: -3.8,
    isActive: true,
  },
  {
    id: "8",
    name: "Operational Cost Reduction",
    department: "Finance",
    type: "percentage" as const,
    timeframe: "annually" as const,
    target: 15,
    actual: 11.2,
    weight: 15,
    unit: "%",
    trend: +2.1,
    isActive: false,
  },
];

function formatValue(value: number, type: string, unit: string): string {
  if (type === "currency") {
    return `Rp ${(value / 1000000000).toFixed(2)}B`;
  }
  if (type === "percentage") {
    return `${value}%`;
  }
  return `${value} ${unit}`;
}

export default function KpisPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='row']",
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const filtered = kpiData.filter((kpi) => {
    const matchSearch = kpi.name.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "all" || kpi.department === filterDept;
    return matchSearch && matchDept;
  });

  const departments = Array.from(new Set(kpiData.map((k) => k.department)));

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Metrics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor all performance indicators
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          New KPI
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search KPIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-700 outline-none"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* KPI Table */}
      <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-tertiary">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">KPI Name</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actual</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Achievement</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Weight</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Trend</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((kpi) => {
              const achievement = Math.min((kpi.actual / kpi.target) * 100, 150);
              return (
                <tr
                  key={kpi.id}
                  data-animate="row"
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        kpi.isActive ? "bg-emerald-400" : "bg-gray-300"
                      )} />
                      <span className="text-sm font-medium text-gray-800">{kpi.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {kpi.department}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-600 capitalize">{kpi.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 font-mono">
                    {formatValue(kpi.target, kpi.type, kpi.unit)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-900 font-mono font-medium">
                    {formatValue(kpi.actual, kpi.type, kpi.unit)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            achievement >= 100 ? "bg-emerald-500" :
                            achievement >= 75 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(achievement, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-semibold",
                        achievement >= 100 ? "text-emerald-600" :
                        achievement >= 75 ? "text-amber-600" : "text-red-600"
                      )}>
                        {achievement.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600 font-medium">
                    {kpi.weight}%
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {kpi.trend > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        kpi.trend > 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {kpi.trend > 0 ? "+" : ""}{kpi.trend}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
