/**
 * Simple i18n system (EN/ID) using React context
 */
"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Locale = "en" | "id";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "dashboard": "Dashboard",
    "my_kpis": "My KPIs",
    "submit_entry": "Submit Entry",
    "kpi_metrics": "KPI Metrics",
    "submissions": "Submissions",
    "departments": "Departments",
    "team": "Team",
    "analytics": "Analytics",
    "notifications": "Notifications",
    "profile": "Profile",
    "settings": "Settings",
    "approve": "Approve",
    "reject": "Reject",
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected",
    "search": "Search",
    "create": "Create",
    "delete": "Delete",
    "edit": "Edit",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "loading": "Loading...",
    "no_data": "No data available",
    "export": "Export",
    "import": "Import",
    "logout": "Log Out",
    "welcome_back": "Welcome back",
    "overall_achievement": "Overall Achievement",
    "active_kpis": "Active KPIs",
    "team_members": "Team Members",
    "pending_review": "Pending Review",
    "submit_kpi_entry": "Submit KPI Entry",
    "select_kpi": "Select KPI",
    "reporting_period": "Reporting Period",
    "actual_value": "Actual Value",
    "notes": "Notes",
    "start_date": "Start Date",
    "end_date": "End Date",
    "target": "Target",
    "achievement": "Achievement",
    "weight": "Weight",
    "timeframe": "Timeframe",
    "department": "Department",
    "role": "Role",
    "actions": "Actions",
    "overdue": "Overdue",
    "on_track": "On Track",
    "at_risk": "At Risk",
    "exceeding": "Exceeding",
  },
  id: {
    "dashboard": "Dasbor",
    "my_kpis": "KPI Saya",
    "submit_entry": "Kirim Entri",
    "kpi_metrics": "Metrik KPI",
    "submissions": "Pengajuan",
    "departments": "Departemen",
    "team": "Tim",
    "analytics": "Analitik",
    "notifications": "Notifikasi",
    "profile": "Profil",
    "settings": "Pengaturan",
    "approve": "Setujui",
    "reject": "Tolak",
    "pending": "Menunggu",
    "approved": "Disetujui",
    "rejected": "Ditolak",
    "search": "Cari",
    "create": "Buat",
    "delete": "Hapus",
    "edit": "Ubah",
    "save": "Simpan",
    "cancel": "Batal",
    "confirm": "Konfirmasi",
    "loading": "Memuat...",
    "no_data": "Tidak ada data",
    "export": "Ekspor",
    "import": "Impor",
    "logout": "Keluar",
    "welcome_back": "Selamat datang kembali",
    "overall_achievement": "Pencapaian Keseluruhan",
    "active_kpis": "KPI Aktif",
    "team_members": "Anggota Tim",
    "pending_review": "Menunggu Review",
    "submit_kpi_entry": "Kirim Entri KPI",
    "select_kpi": "Pilih KPI",
    "reporting_period": "Periode Pelaporan",
    "actual_value": "Nilai Aktual",
    "notes": "Catatan",
    "start_date": "Tanggal Mulai",
    "end_date": "Tanggal Selesai",
    "target": "Target",
    "achievement": "Pencapaian",
    "weight": "Bobot",
    "timeframe": "Jangka Waktu",
    "department": "Departemen",
    "role": "Peran",
    "actions": "Aksi",
    "overdue": "Terlambat",
    "on_track": "Sesuai Target",
    "at_risk": "Berisiko",
    "exceeding": "Melebihi Target",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("kpi-locale") as Locale | null;
    if (saved && (saved === "en" || saved === "id")) {
      setLocale(saved);
    }
  }, []);

  function changeLocale(l: Locale) {
    setLocale(l);
    localStorage.setItem("kpi-locale", l);
  }

  function t(key: string): string {
    return translations[locale][key] || key;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
