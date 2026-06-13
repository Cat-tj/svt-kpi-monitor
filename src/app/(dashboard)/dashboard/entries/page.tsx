"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EntryStatus = "pending" | "approved" | "rejected";

interface KpiEntry {
  id: string;
  staffName: string;
  staffAvatar: string;
  department: string;
  kpiName: string;
  value: string;
  target: string;
  period: string;
  status: EntryStatus;
  submittedAt: string;
  notes: string;
}

const entries: KpiEntry[] = [
  {
    id: "1",
    staffName: "Andi Setiawan",
    staffAvatar: "AS",
    department: "Engineering",
    kpiName: "Sprint Velocity",
    value: "42 points",
    target: "50 points",
    period: "Jun 2-8, 2026",
    status: "pending",
    submittedAt: "2 hours ago",
    notes: "Team was short 1 member this sprint due to sick leave",
  },
  {
    id: "2",
    staffName: "Dina Pratiwi",
    staffAvatar: "DP",
    department: "Sales & Marketing",
    kpiName: "Lead Conversion Rate",
    value: "23.4%",
    target: "30%",
    period: "May 2026",
    status: "pending",
    submittedAt: "5 hours ago",
    notes: "New campaign launching next week should improve numbers",
  },
  {
    id: "3",
    staffName: "Rizky Firmansyah",
    staffAvatar: "RF",
    department: "Product",
    kpiName: "Feature Delivery",
    value: "8/10 features",
    target: "10 features",
    period: "May 2026",
    status: "pending",
    submittedAt: "1 day ago",
    notes: "2 features pushed to next sprint due to dependency on backend",
  },
  {
    id: "4",
    staffName: "Sari Wulandari",
    staffAvatar: "SW",
    department: "Operations",
    kpiName: "SLA Compliance",
    value: "96.2%",
    target: "99%",
    period: "May 2026",
    status: "approved",
    submittedAt: "3 days ago",
    notes: "Downtime on May 15 impacted SLA",
  },
  {
    id: "5",
    staffName: "Budi Santoso",
    staffAvatar: "BS",
    department: "Finance",
    kpiName: "Cost Reduction",
    value: "11.2%",
    target: "15%",
    period: "Q1 2026",
    status: "approved",
    submittedAt: "1 week ago",
    notes: "Negotiated new vendor contracts, savings reflected in Q2",
  },
  {
    id: "6",
    staffName: "Maya Anggraini",
    staffAvatar: "MA",
    department: "HR & Admin",
    kpiName: "Employee Retention",
    value: "87.5%",
    target: "90%",
    period: "H1 2026",
    status: "rejected",
    submittedAt: "2 weeks ago",
    notes: "Data needs revalidation - some departures miscategorized",
  },
];

const statusConfig = {
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
};

export default function EntriesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | EntryStatus>("all");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='entry']",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const filtered = entries.filter(
    (e) => statusFilter === "all" || e.status === statusFilter
  );

  const counts = {
    all: entries.length,
    pending: entries.filter((e) => e.status === "pending").length,
    approved: entries.filter((e) => e.status === "approved").length,
    rejected: entries.filter((e) => e.status === "rejected").length,
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve KPI entry submissions
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              statusFilter === status
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent"
            )}
          >
            <span className="capitalize">{status}</span>
            <span className="ml-1.5 text-[11px] text-gray-400">({counts[status]})</span>
          </button>
        ))}
      </div>

      {/* Entry Cards */}
      <div className="space-y-3">
        {filtered.map((entry) => {
          const config = statusConfig[entry.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={entry.id}
              data-animate="entry"
              className="rounded-xl border border-border bg-surface p-5 shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600">
                      {entry.staffAvatar}
                    </span>
                  </div>

                  {/* Details */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {entry.staffName}
                      </h3>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {entry.department}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">{entry.kpiName}</span>
                      {" · "}
                      <span className="font-mono text-brand-600">{entry.value}</span>
                      <span className="text-gray-400"> / {entry.target}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Period: {entry.period} · Submitted {entry.submittedAt}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-gray-500 mt-1.5 italic border-l-2 border-gray-200 pl-2">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[11px] font-medium",
                    config.bg, config.color
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </div>

                  {entry.status === "pending" && (
                    <div className="flex items-center gap-1.5">
                      <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 transition-colors" title="Approve">
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <button className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors" title="Reject">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
