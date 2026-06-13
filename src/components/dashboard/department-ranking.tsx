"use client";

import { cn } from "@/lib/utils";

// Mock department performance data
const departments = [
  { name: "Engineering", score: 94.2, color: "bg-emerald-500" },
  { name: "Sales & Marketing", score: 88.7, color: "bg-blue-500" },
  { name: "Product", score: 85.1, color: "bg-violet-500" },
  { name: "Operations", score: 79.4, color: "bg-amber-500" },
  { name: "Finance", score: 76.8, color: "bg-rose-500" },
  { name: "HR & Admin", score: 72.3, color: "bg-gray-500" },
];

export function DepartmentRanking() {
  return (
    <div
      data-animate="card"
      className="rounded-xl border border-border bg-surface p-5 shadow-card h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Department Ranking</h3>
          <p className="text-xs text-gray-500 mt-0.5">Monthly achievement scores</p>
        </div>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Jun 2026
        </span>
      </div>

      <div className="space-y-4">
        {departments.map((dept, index) => (
          <div key={dept.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400 w-4">
                  #{index + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {dept.name}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  dept.score >= 90
                    ? "text-emerald-600"
                    : dept.score >= 75
                    ? "text-amber-600"
                    : "text-red-600"
                )}
              >
                {dept.score}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                data-animate="progress"
                className={cn("h-full rounded-full", dept.color)}
                style={{ width: `${dept.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
