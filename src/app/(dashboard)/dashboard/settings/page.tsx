"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  Settings,
  Shield,
  Bell,
  Palette,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("notifications");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='section']",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const tabs = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data Management", icon: Database },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure system preferences and notifications
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div data-animate="section" className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-brand-600" : "text-gray-400")} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "notifications" && (
            <div data-animate="section" className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: "KPI entry submitted for approval", enabled: true },
                  { label: "Entry approved/rejected", enabled: true },
                  { label: "KPI deadline approaching", enabled: true },
                  { label: "Weekly performance summary", enabled: true },
                  { label: "Department ranking changes", enabled: false },
                  { label: "System maintenance alerts", enabled: true },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700">{pref.label}</span>
                    <button className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      pref.enabled ? "bg-brand-500" : "bg-gray-200"
                    )}>
                      <span className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        pref.enabled ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div data-animate="section" className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Session Timeout</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">Auto-logout after inactivity</p>
                  <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-48">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>8 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">Add an extra layer of security</p>
                  <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Enable 2FA
                  </button>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Password Policy</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">Minimum requirements for user passwords</p>
                  <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-48">
                    <option>Standard (8+ chars)</option>
                    <option>Strong (12+ chars, mixed)</option>
                    <option>Enterprise (16+ chars, symbols)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div data-animate="section" className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Data Management</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data Retention</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">How long to keep historical KPI entries</p>
                  <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-48">
                    <option>1 year</option>
                    <option>2 years</option>
                    <option>5 years</option>
                    <option>Unlimited</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Export Format</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">Default format for data exports</p>
                  <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-48">
                    <option>CSV</option>
                    <option>Excel (.xlsx)</option>
                    <option>JSON</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Backup Schedule</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">Automated database backup frequency</p>
                  <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-48">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div data-animate="section" className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Appearance</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Theme</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">Choose your preferred color scheme</p>
                  <div className="flex items-center gap-3">
                    {["Light", "Dark", "System"].map((theme) => (
                      <button
                        key={theme}
                        className={cn(
                          "rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                          theme === "Light"
                            ? "border-brand-200 bg-brand-50 text-brand-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Dashboard Density</label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">Adjust information density</p>
                  <div className="flex items-center gap-3">
                    {["Compact", "Comfortable", "Spacious"].map((density) => (
                      <button
                        key={density}
                        className={cn(
                          "rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                          density === "Comfortable"
                            ? "border-brand-200 bg-brand-50 text-brand-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
