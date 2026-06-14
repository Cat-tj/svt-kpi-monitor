"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import Link from "next/link";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// Mock: KPIs assigned to the current staff member
const myKpis = [
  {
    id: "1",
    name: "Sprint Velocity",
    department: "Engineering",
    target: 50,
    actual: 42,
    unit: "points",
    timeframe: "Weekly",
    deadline: "Jun 15, 2026",
    lastSubmission: "Jun 8, 2026",
    status: "on_track" as const,
  },
  {
    id: "2",
    name: "Code Review Turnaround",
    department: "Engineering",
    target: 24,
    actual: 18,
    unit: "hours",
    timeframe: "Weekly",
    deadline: "Jun 15, 2026",
    lastSubmission: "Jun 8, 2026",
    status: "exceeding" as const,
  },
  {
    id: "3",
    name: "Bug Resolution Rate",
    department: "Engineering",
    target: 90,
    actual: 78,
    unit: "%",
    timeframe: "Monthly",
    deadline: "Jun 30, 2026",
    lastSubmission: "May 31, 2026",
    status: "at_risk" as const,
  },
  {
    id: "4",
    name: "Documentation Coverage",
    department: "Engineering",
    target: 80,
    actual: 65,
    unit: "%",
    timeframe: "Monthly",
    deadline: "Jun 30, 2026",
    lastSubmission: null,
    status: "behind" as const,
  },
];

const myRecentEntries = [
  { id: "1", kpi: "Sprint Velocity", value: "42 points", period: "Jun 2-8", status: "approved" as const, date: "Jun 9" },
  { id: "2", kpi: "Code Review Turnaround", value: "18 hours", period: "Jun 2-8", status: "approved" as const, date: "Jun 9" },
  { id: "3", kpi: "Bug Resolution Rate", value: "78%", period: "May 2026", status: "pending" as const, date: "Jun 1" },
  { id: "4", kpi: "Sprint Velocity", value: "45 points", period: "May 26 - Jun 1", status: "approved" as const, date: "Jun 2" },
];

const statusConfig = {
  exceeding: { label: "Exceeding", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: TrendingUp },
  on_track: { label: "On Track", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: Target },
  at_risk: { label: "At Risk", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: AlertTriangle },
  behind: { label: "Behind", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: TrendingDown },
};

const entryStatusConfig = {
  approved: { label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50" },
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50" },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50" },
};

export default function MyKpisPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
      gsap.fromTo(
        "[data-animate='progress']",
        { scaleX: 0 },
        { scaleX: 1, duration: 1, delay: 0.3, stagger: 0.05, ease: "power2.out", transformOrigin: "left center" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const overallAchievement = myKpis.reduce((acc, kpi) => {
    return acc + Math.min((kpi.actual / kpi.target) * 100, 150);
  }, 0) / myKpis.length;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" data-animate="card">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My KPIs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your assigned performance indicators and progress
          </p>
        </div>
        <Link
          href="/dashboard/entries/new"
          className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="h-4 w-4" />
          Submit Entry
        </Link>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-gray-500">Overall Achievement</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{overallAchievement.toFixed(1)}%</p>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-gray-500">Assigned KPIs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{myKpis.length}</p>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-gray-500">Pending Submissions</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {myRecentEntries.filter((e) => e.status === "pending").length}
          </p>
        </div>
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-gray-500">Due This Week</p>
          <p className="text-2xl font-bold text-red-600 mt-1">2</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {myKpis.map((kpi) => {
          const achievement = Math.min((kpi.actual / kpi.target) * 100, 150);
          const config = statusConfig[kpi.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={kpi.id}
              data-animate="card"
              className="rounded-xl border border-border bg-surface p-5 shadow-card hover:shadow-elevated transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{kpi.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{kpi.timeframe} · Due {kpi.deadline}</p>
                </div>
                <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 border text-[10px] font-medium", config.bg, config.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-mono font-medium text-gray-800">
                    {kpi.actual} / {kpi.target} {kpi.unit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    data-animate="progress"
                    className={cn(
                      "h-full rounded-full",
                      achievement >= 100 ? "bg-emerald-500" :
                      achievement >= 75 ? "bg-blue-500" :
                      achievement >= 50 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(achievement, 100)}%` }}
                  />
                </div>
                <p className="text-right text-[10px] text-gray-400 mt-1">
                  {achievement.toFixed(1)}% achieved
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-400">
                  {kpi.lastSubmission ? `Last submitted: ${kpi.lastSubmission}` : "No submission yet"}
                </p>
                <Link
                  href="/dashboard/entries/new"
                  className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
                >
                  Submit →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Submissions */}
      <div data-animate="card" className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">My Recent Submissions</h3>
        <div className="space-y-2">
          {myRecentEntries.map((entry) => {
            const config = entryStatusConfig[entry.status];
            return (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Target className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{entry.kpi}</p>
                    <p className="text-[11px] text-gray-500">{entry.value} · {entry.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400">{entry.date}</span>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", config.bg, config.color)}>
                    {config.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
