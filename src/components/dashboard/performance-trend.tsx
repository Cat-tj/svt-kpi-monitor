"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Mock trend data for the last 6 months
const trendData = [
  { month: "Jan", achievement: 72, target: 80, revenue: 1.8 },
  { month: "Feb", achievement: 76, target: 80, revenue: 2.1 },
  { month: "Mar", achievement: 81, target: 82, revenue: 2.3 },
  { month: "Apr", achievement: 79, target: 83, revenue: 2.2 },
  { month: "May", achievement: 84, target: 85, revenue: 2.6 },
  { month: "Jun", achievement: 87, target: 85, revenue: 2.84 },
];

export function PerformanceTrend() {
  return (
    <div
      data-animate="card"
      className="rounded-xl border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Performance Trend</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Achievement vs Target · 6-month overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="text-[11px] text-gray-500">Achievement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gray-300" />
            <span className="text-[11px] text-gray-500">Target</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientAchievement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4c6ef5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#868e96" }}
            />
            <YAxis
              domain={[60, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#868e96" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}%`]}
            />
            <Area
              type="monotone"
              dataKey="achievement"
              stroke="#4c6ef5"
              strokeWidth={2.5}
              fill="url(#gradientAchievement)"
              dot={{ r: 4, fill: "#4c6ef5", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, stroke: "#4c6ef5", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#ced4da"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
