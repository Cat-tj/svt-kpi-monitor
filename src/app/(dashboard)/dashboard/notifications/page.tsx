"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

interface NotifEntry {
  id: string;
  status: string;
  actual_value: number;
  period_start: string;
  period_end: string;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  kpi: { name: string; unit: string | null } | null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NotifEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("kpi_entries")
        .select("id, status, actual_value, period_start, period_end, review_notes, reviewed_at, created_at, kpi:kpis(name, unit)")
        .eq("submitted_by", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setEntries(data as unknown as NotifEntry[]);
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Status updates on your KPI submissions</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 border border-blue-200">
          <Bell className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-medium text-blue-700">{entries.length} entries</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-gray-500">No submissions yet. Submit a KPI entry to see notifications here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className={cn(
              "rounded-xl border p-4",
              entry.status === "approved" ? "border-emerald-200 bg-emerald-50/30" :
              entry.status === "rejected" ? "border-red-200 bg-red-50/30" :
              "border-border bg-surface"
            )}>
              <div className="flex items-start gap-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  entry.status === "approved" ? "bg-emerald-50" :
                  entry.status === "rejected" ? "bg-red-50" : "bg-amber-50"
                )}>
                  {entry.status === "approved" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {entry.status === "rejected" && <XCircle className="h-4 w-4 text-red-500" />}
                  {entry.status === "pending" && <Clock className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.kpi?.name || "KPI"} — {entry.status === "approved" ? "Approved ✓" : entry.status === "rejected" ? "Rejected ✗" : "Pending Review"}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(entry.reviewed_at || entry.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    You submitted {entry.actual_value} {entry.kpi?.unit || ""} for period {entry.period_start} → {entry.period_end}
                  </p>
                  {entry.review_notes && (
                    <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded px-2 py-1 inline-block">
                      Reviewer: {entry.review_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
