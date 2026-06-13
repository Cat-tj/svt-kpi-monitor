"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Target,
  Building2,
  Calendar,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mock KPI detail data
const kpiDetail = {
  id: "1",
  name: "Monthly Revenue",
  description:
    "Total monthly revenue generated across all business lines including recurring subscriptions and one-time contracts.",
  department: "Sales & Marketing",
  type: "Currency",
  timeframe: "Monthly",
  target: 3000000000,
  actual: 2840000000,
  unit: "IDR",
  weight: 25,
};

const historicalEntries = [
  { period: "Jan 2026", actual: 2450000000, target: 2800000000, achievement: 87.5 },
  { period: "Feb 2026", actual: 2600000000, target: 2800000000, achievement: 92.9 },
  { period: "Mar 2026", actual: 2720000000, target: 3000000000, achievement: 90.7 },
  { period: "Apr 2026", actual: 2900000000, target: 3000000000, achievement: 96.7 },
  { period: "May 2026", actual: 2780000000, target: 3000000000, achievement: 92.7 },
  { period: "Jun 2026", actual: 2840000000, target: 3000000000, achievement: 94.7 },
];

function formatCurrencyShort(value: number): string {
  return `Rp ${(value / 1000000000).toFixed(2)}B`;
}

export default function KpiDetailPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const achievement = Math.min(
    (kpiDetail.actual / kpiDetail.target) * 100,
    150
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 20, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        }
      );

      // Animate progress ring
      gsap.fromTo(
        "[data-animate='ring']",
        { strokeDashoffset: 283 },
        {
          strokeDashoffset: 283 - (283 * Math.min(achievement, 100)) / 100,
          duration: 1.5,
          delay: 0.4,
          ease: "power2.out",
        }
      );

      // Animate sparkline bars
      gsap.fromTo(
        "[data-animate='bar']",
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.6,
          stagger: 0.08,
          delay: 0.3,
          ease: "back.out(1.5)",
          transformOrigin: "bottom center",
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [achievement]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Back Link + Header */}
      <div data-animate="card">
        <Link
          href="/dashboard/kpis"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to KPI Metrics
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{kpiDetail.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{kpiDetail.description}</p>
      </div>

      {/* Info + Progress Ring */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* KPI Info */}
        <div
          data-animate="card"
          className="rounded-xl border border-border bg-surface p-5 shadow-card lg:col-span-2"
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            KPI Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Department</p>
                <p className="text-sm font-medium text-gray-800">
                  {kpiDetail.department}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Target className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Type</p>
                <p className="text-sm font-medium text-gray-800">
                  {kpiDetail.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Timeframe</p>
                <p className="text-sm font-medium text-gray-800">
                  {kpiDetail.timeframe}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Target</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatCurrencyShort(kpiDetail.target)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Weight in overall score</span>
              <span className="text-sm font-semibold text-gray-800">{kpiDetail.weight}%</span>
            </div>
          </div>
        </div>

        {/* Progress Ring */}
        <div
          data-animate="card"
          className="rounded-xl border border-border bg-surface p-5 shadow-card flex flex-col items-center justify-center"
        >
          <p className="text-xs text-gray-500 mb-3">Achievement</p>
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="10"
              />
              <circle
                data-animate="ring"
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke={
                  achievement >= 100
                    ? "#10b981"
                    : achievement >= 75
                    ? "#f59e0b"
                    : "#ef4444"
                }
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset="283"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={cn(
                  "text-xl font-bold",
                  achievement >= 100
                    ? "text-emerald-600"
                    : achievement >= 75
                    ? "text-amber-600"
                    : "text-red-600"
                )}
              >
                {achievement.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm font-medium text-gray-800">
              {formatCurrencyShort(kpiDetail.actual)}
            </p>
            <p className="text-xs text-gray-400">
              of {formatCurrencyShort(kpiDetail.target)}
            </p>
          </div>
        </div>
      </div>

      {/* Sparkline / Trend Chart */}
      <div
        data-animate="card"
        className="rounded-xl border border-border bg-surface p-5 shadow-card"
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Performance Trend
        </h3>
        <div className="flex items-end gap-3 h-32">
          {historicalEntries.map((entry) => {
            const height = (entry.achievement / 100) * 100;
            return (
              <div key={entry.period} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500 font-medium">
                  {entry.achievement.toFixed(0)}%
                </span>
                <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: "100px" }}>
                  <div
                    data-animate="bar"
                    className={cn(
                      "absolute bottom-0 left-0 right-0 rounded-t-md",
                      entry.achievement >= 100
                        ? "bg-emerald-400"
                        : entry.achievement >= 90
                        ? "bg-blue-400"
                        : entry.achievement >= 75
                        ? "bg-amber-400"
                        : "bg-red-400"
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {entry.period.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Entries Table */}
      <div
        data-animate="card"
        className="rounded-xl border border-border bg-surface shadow-card overflow-hidden"
      >
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Historical Entries
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 6 reporting periods</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-t border-b border-border bg-surface-tertiary">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Actual
              </th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Achievement
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {historicalEntries.map((entry) => (
              <tr key={entry.period} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                  {entry.period}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600 font-mono">
                  {formatCurrencyShort(entry.target)}
                </td>
                <td className="px-5 py-3 text-sm text-gray-900 font-mono font-medium">
                  {formatCurrencyShort(entry.actual)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      entry.achievement >= 100
                        ? "bg-emerald-50 text-emerald-700"
                        : entry.achievement >= 90
                        ? "bg-blue-50 text-blue-700"
                        : entry.achievement >= 75
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    )}
                  >
                    {entry.achievement.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
