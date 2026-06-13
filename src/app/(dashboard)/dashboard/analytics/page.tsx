"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

// Mock data for various charts
const monthlyAchievement = [
  { month: "Jan", achievement: 72, entries: 45 },
  { month: "Feb", achievement: 76, entries: 52 },
  { month: "Mar", achievement: 81, entries: 61 },
  { month: "Apr", achievement: 79, entries: 58 },
  { month: "May", achievement: 84, entries: 67 },
  { month: "Jun", achievement: 87, entries: 72 },
];

const departmentComparison = [
  { name: "Engineering", score: 94.2 },
  { name: "Sales", score: 88.7 },
  { name: "Product", score: 85.1 },
  { name: "Operations", score: 79.4 },
  { name: "Finance", score: 76.8 },
  { name: "HR", score: 72.3 },
];

const kpiDistribution = [
  { name: "On Track (≥100%)", value: 24, color: "#10b981" },
  { name: "At Risk (75-99%)", value: 5, color: "#f59e0b" },
  { name: "Behind (<75%)", value: 2, color: "#ef4444" },
];

const entryTrend = [
  { week: "W1", pending: 12, approved: 34, rejected: 3 },
  { week: "W2", pending: 8, approved: 41, rejected: 2 },
  { week: "W3", pending: 15, approved: 38, rejected: 5 },
  { week: "W4", pending: 6, approved: 45, rejected: 1 },
  { week: "W5", pending: 10, approved: 42, rejected: 4 },
  { week: "W6", pending: 14, approved: 48, rejected: 2 },
];

export default function AnalyticsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='chart']",
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Deep-dive performance analytics and trend visualization
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Jan - Jun 2026</span>
        </div>
      </div>

      {/* Row 1: Achievement Trend + KPI Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Achievement Trend */}
        <div
          data-animate="chart"
          className="xl:col-span-2 rounded-xl border border-border bg-surface p-5 shadow-card"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Achievement Trend</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly company-wide KPI achievement rate</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAchievement} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAchieve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4c6ef5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#868e96" }} />
                <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#868e96" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e9ecef", fontSize: "12px" }} />
                <Area type="monotone" dataKey="achievement" stroke="#4c6ef5" strokeWidth={2.5} fill="url(#gradAchieve)" dot={{ r: 4, fill: "#4c6ef5", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI Distribution Pie */}
        <div
          data-animate="chart"
          className="rounded-xl border border-border bg-surface p-5 shadow-card"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-1">KPI Status Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Current period breakdown</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpiDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {kpiDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e9ecef", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {kpiDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Department Comparison + Entry Workflow */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Department Comparison Bar */}
        <div
          data-animate="chart"
          className="rounded-xl border border-border bg-surface p-5 shadow-card"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Department Comparison</h3>
          <p className="text-xs text-gray-500 mb-4">Achievement scores by department</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentComparison} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#868e96" }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#495057" }} width={80} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e9ecef", fontSize: "12px" }} formatter={(value: number) => [`${value}%`, "Score"]} />
                <Bar dataKey="score" fill="#4c6ef5" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Entry Workflow Trend */}
        <div
          data-animate="chart"
          className="rounded-xl border border-border bg-surface p-5 shadow-card"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Submission Workflow</h3>
          <p className="text-xs text-gray-500 mb-4">Weekly entry submissions by status</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entryTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#868e96" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#868e96" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e9ecef", fontSize: "12px" }} />
                <Bar dataKey="approved" fill="#10b981" radius={[2, 2, 0, 0]} stackId="stack" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[2, 2, 0, 0]} stackId="stack" />
                <Bar dataKey="rejected" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="text-[11px] text-gray-500">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <span className="text-[11px] text-gray-500">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
              <span className="text-[11px] text-gray-500">Rejected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
