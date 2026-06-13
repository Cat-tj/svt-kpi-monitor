"use client";

import { TrendingUp, TrendingDown, Target, Users, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data representing company-wide KPI health
const summaryData = [
  {
    label: "Overall Achievement",
    value: 87.3,
    prefix: "",
    suffix: "%",
    decimals: 1,
    change: +4.2,
    icon: Target,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Revenue Target",
    value: 2.84,
    prefix: "Rp ",
    suffix: "B",
    decimals: 2,
    change: +12.5,
    icon: DollarSign,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Active Staff",
    value: 142,
    prefix: "",
    suffix: "",
    decimals: 0,
    change: +3,
    icon: Users,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    label: "KPIs On Track",
    value: 24,
    prefix: "",
    suffix: "/31",
    decimals: 0,
    change: -2,
    icon: Activity,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export function KpiSummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryData.map((item) => (
        <div
          key={item.label}
          data-animate="card"
          className="rounded-xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-elevated"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {item.label}
            </span>
            <div className={cn("rounded-lg p-2", item.bg)}>
              <item.icon className={cn("h-4 w-4", item.color)} />
            </div>
          </div>

          <div className="mt-3">
            <span
              data-animate="counter"
              data-value={item.value}
              data-prefix={item.prefix}
              data-suffix={item.suffix}
              data-decimals={item.decimals}
              className="text-2xl font-bold text-gray-900"
            >
              {item.prefix}0{item.suffix}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            {item.change > 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                item.change > 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {item.change > 0 ? "+" : ""}
              {item.change}%
            </span>
            <span className="text-xs text-gray-400">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}
