"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Palette, Globe, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleGuard } from "@/components/ui/role-guard";
import { useTheme } from "@/lib/theme-context";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  return (
    <RoleGuard allowed={["admin"]}>
      <SettingsContent />
    </RoleGuard>
  );
}

function SettingsContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();

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

  const themes = [
    { id: "light" as const, label: "Light", icon: Sun },
    { id: "dark" as const, label: "Dark", icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ];

  const languages = [
    { id: "en" as const, label: "English", flag: "🇬🇧" },
    { id: "id" as const, label: "Bahasa Indonesia", flag: "🇮🇩" },
  ];

  return (
    <div ref={containerRef} className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Appearance and language preferences
        </p>
      </div>

      {/* Theme */}
      <div data-animate="section" className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
            <Palette className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Theme</h3>
            <p className="text-xs text-gray-500">Choose your preferred color scheme</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all",
                theme === t.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <t.icon className={cn("h-5 w-5", theme === t.id ? "text-brand-600" : "text-gray-400")} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div data-animate="section" className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Globe className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Language</h3>
            <p className="text-xs text-gray-500">Select interface language</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLocale(lang.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all",
                locale === lang.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
