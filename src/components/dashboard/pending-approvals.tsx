"use client";

import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock pending approval entries
const pendingEntries = [
  {
    id: "1",
    staffName: "Andi Setiawan",
    department: "Engineering",
    kpiName: "Sprint Velocity",
    value: "42 points",
    submittedAt: "2 hours ago",
  },
  {
    id: "2",
    staffName: "Dina Pratiwi",
    department: "Sales & Marketing",
    kpiName: "Lead Conversion Rate",
    value: "23.4%",
    submittedAt: "5 hours ago",
  },
  {
    id: "3",
    staffName: "Rizky Firmansyah",
    department: "Product",
    kpiName: "Feature Delivery",
    value: "8/10 features",
    submittedAt: "1 day ago",
  },
  {
    id: "4",
    staffName: "Sari Wulandari",
    department: "Operations",
    kpiName: "SLA Compliance",
    value: "96.2%",
    submittedAt: "1 day ago",
  },
];

export function PendingApprovals() {
  return (
    <div
      data-animate="card"
      className="rounded-xl border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Pending Approvals</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {pendingEntries.length} entries awaiting review
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 border border-amber-200">
          <Clock className="h-3 w-3 text-amber-600" />
          <span className="text-[11px] font-medium text-amber-700">
            {pendingEntries.length} pending
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {pendingEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-600">
                  {entry.staffName.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{entry.staffName}</p>
                <p className="text-[11px] text-gray-500">
                  {entry.kpiName} · <span className="font-medium">{entry.value}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 mr-2">{entry.submittedAt}</span>
              <button className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors">
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
