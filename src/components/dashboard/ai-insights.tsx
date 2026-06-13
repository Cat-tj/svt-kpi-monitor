"use client";

import { ClipboardCheck, CheckCircle2, Target, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: "1",
    type: "entry_submitted",
    icon: ClipboardCheck,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    title: "KPI entry submitted",
    description:
      "Andi Setiawan submitted Sprint Velocity data for Jun 2-8, 2026.",
    timestamp: "30 min ago",
  },
  {
    id: "2",
    type: "entry_approved",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    title: "Entry approved",
    description:
      "SLA Compliance entry by Sari Wulandari was approved by Admin.",
    timestamp: "2 hours ago",
  },
  {
    id: "3",
    type: "kpi_updated",
    icon: Target,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50",
    title: "KPI target updated",
    description:
      "Monthly Revenue target for Q3 2026 has been updated to Rp 3.5B.",
    timestamp: "5 hours ago",
  },
  {
    id: "4",
    type: "member_added",
    icon: UserPlus,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    title: "New team member added",
    description:
      "Fajar Hidayat joined the Engineering department as Backend Developer.",
    timestamp: "1 day ago",
  },
];

export function AiInsights() {
  return (
    <div
      data-animate="card"
      className="rounded-xl border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Latest actions across the platform
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 border border-blue-200">
          <ClipboardCheck className="h-3 w-3 text-blue-600" />
          <span className="text-[11px] font-medium text-blue-700">4 new</span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                  activity.iconBg
                )}
              >
                <activity.icon className={cn("h-4 w-4", activity.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {activity.title}
                  </p>
                  <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                    {activity.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                  {activity.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
