"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { KpiSummaryCards } from "./kpi-summary-cards";
import { DepartmentRanking } from "./department-ranking";
import { PerformanceTrend } from "./performance-trend";
import { PendingApprovals } from "./pending-approvals";
import { AiInsights } from "./ai-insights";

/**
 * Executive Dashboard
 * High-level, data-dense overview with GSAP entrance animations.
 * Designed for C-Level stakeholders to get instant company health insights.
 */
export function ExecutiveDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger-animate all dashboard cards on mount
      gsap.fromTo(
        "[data-animate='card']",
        {
          opacity: 0,
          y: 24,
          scale: 0.97,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        }
      );

      // Animate the progress bars after cards are visible
      gsap.fromTo(
        "[data-animate='progress']",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          delay: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          transformOrigin: "left center",
        }
      );

      // Counter animation for numeric values
      const counters = document.querySelectorAll("[data-animate='counter']");
      counters.forEach((el) => {
        const target = parseFloat(el.getAttribute("data-value") || "0");
        const obj = { value: 0 };
        gsap.to(obj, {
          value: target,
          duration: 1.5,
          delay: 0.3,
          ease: "power2.out",
          onUpdate: () => {
            const prefix = el.getAttribute("data-prefix") || "";
            const suffix = el.getAttribute("data-suffix") || "";
            const decimals = parseInt(el.getAttribute("data-decimals") || "0");
            el.textContent = `${prefix}${obj.value.toFixed(decimals)}${suffix}`;
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Page Header */}
      <div data-animate="card">
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Company-wide performance overview · June 2026
        </p>
      </div>

      {/* Summary Cards Row */}
      <KpiSummaryCards />

      {/* Main Grid: Trend + Department Ranking */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PerformanceTrend />
        </div>
        <div>
          <DepartmentRanking />
        </div>
      </div>

      {/* Bottom Row: Approvals + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PendingApprovals />
        <AiInsights />
      </div>
    </div>
  );
}
