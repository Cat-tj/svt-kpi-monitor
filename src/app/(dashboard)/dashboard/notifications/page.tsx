"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "approved" | "rejected" | "deadline" | "assigned";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "approved",
    title: "Entry Approved",
    message: "Your SLA Compliance entry for May 2026 has been approved by Admin.",
    timestamp: "30 min ago",
    isRead: false,
  },
  {
    id: "2",
    type: "rejected",
    title: "Entry Rejected",
    message: 'Employee Retention entry was rejected. Reason: "Data needs revalidation - some departures miscategorized".',
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "3",
    type: "deadline",
    title: "KPI Deadline Approaching",
    message: "Sprint Velocity report for Jun 9-15 is due in 2 days. Please submit your entry.",
    timestamp: "5 hours ago",
    isRead: false,
  },
  {
    id: "4",
    type: "assigned",
    title: "New KPI Assigned",
    message: 'You have been assigned a new KPI: "Client Response Time" under Operations department.',
    timestamp: "1 day ago",
    isRead: true,
  },
  {
    id: "5",
    type: "approved",
    title: "Entry Approved",
    message: "Your Monthly Revenue entry for May 2026 has been approved by Finance Lead.",
    timestamp: "2 days ago",
    isRead: true,
  },
  {
    id: "6",
    type: "deadline",
    title: "KPI Deadline Approaching",
    message: "Lead Conversion Rate report for Jun 2026 is due in 5 days.",
    timestamp: "3 days ago",
    isRead: true,
  },
  {
    id: "7",
    type: "assigned",
    title: "New KPI Assigned",
    message: 'Team KPI "Customer Onboarding Time" has been added to your department goals.',
    timestamp: "5 days ago",
    isRead: true,
  },
  {
    id: "8",
    type: "rejected",
    title: "Entry Rejected",
    message: 'Feature Delivery entry needs revision. Reason: "Please break down by feature category".',
    timestamp: "1 week ago",
    isRead: true,
  },
];

const typeConfig: Record<
  NotificationType,
  { icon: typeof CheckCircle2; color: string; bg: string; label: string }
> = {
  approved: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Rejected" },
  deadline: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Deadline" },
  assigned: { icon: Target, color: "text-blue-500", bg: "bg-blue-50", label: "Assigned" },
};

export default function NotificationsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filterType, setFilterType] = useState<"all" | NotificationType>("all");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='notif']",
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  function toggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  }

  const filtered = notifications.filter(
    (n) => filterType === "all" || n.type === filterType
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filterOptions: Array<{ value: "all" | NotificationType; label: string }> = [
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "deadline", label: "Deadline" },
    { value: "assigned", label: "Assigned" },
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated on your KPI submissions and assignments
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 border border-red-200">
            <Bell className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700">
              {unreadCount} unread
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterType(opt.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              filterType === opt.value
                ? "bg-brand-50 text-brand-700 border border-brand-200"
                : "text-gray-500 hover:bg-gray-50 border border-transparent"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.map((notif) => {
          const config = typeConfig[notif.type];
          const Icon = config.icon;
          return (
            <div
              key={notif.id}
              data-animate="notif"
              className={cn(
                "rounded-xl border p-4 transition-all cursor-pointer hover:shadow-card",
                notif.isRead
                  ? "border-border bg-surface"
                  : "border-brand-200 bg-brand-50/30"
              )}
              onClick={() => toggleRead(notif.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    config.bg
                  )}
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          notif.isRead ? "text-gray-700" : "text-gray-900"
                        )}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 ml-12">
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    config.bg,
                    config.color
                  )}
                >
                  {config.label}
                </span>
                <span className="text-[10px] text-gray-400">
                  {notif.isRead ? "Read" : "Click to mark as read"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
