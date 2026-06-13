"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  User,
  Mail,
  Building2,
  Shield,
  Lock,
  Clock,
  ClipboardCheck,
  CheckCircle2,
  Target,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const profileData = {
  name: "COO Admin",
  email: "admin@sentravisi.com",
  role: "Chief Operating Officer",
  department: "Executive",
  joinedDate: "January 2024",
  avatar: "COO",
};

const activityLog = [
  {
    id: "1",
    action: "Approved KPI entry",
    detail: "SLA Compliance by Sari Wulandari",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    action: "Submitted KPI entry",
    detail: "Monthly Revenue for Jun 2026",
    icon: ClipboardCheck,
    iconColor: "text-blue-500",
    timestamp: "1 day ago",
  },
  {
    id: "3",
    action: "Updated KPI target",
    detail: "Sprint Velocity target changed to 55 points",
    icon: Target,
    iconColor: "text-violet-500",
    timestamp: "2 days ago",
  },
  {
    id: "4",
    action: "Added team member",
    detail: "Fajar Hidayat added to Engineering",
    icon: UserPlus,
    iconColor: "text-amber-500",
    timestamp: "3 days ago",
  },
  {
    id: "5",
    action: "Changed settings",
    detail: "Updated notification preferences",
    icon: Shield,
    iconColor: "text-gray-500",
    timestamp: "5 days ago",
  },
];

export default function ProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div data-animate="card">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage your account information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div
          data-animate="card"
          className="rounded-xl border border-border bg-surface p-6 shadow-card"
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full gradient-brand flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">
                {profileData.avatar}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {profileData.name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{profileData.role}</p>
            <div className="w-full mt-5 space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{profileData.department}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">C-Level Access</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">
                  Joined {profileData.joinedDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Change Password */}
          <div
            data-animate="card"
            className="rounded-xl border border-border bg-surface p-6 shadow-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">
                Change Password
              </h3>
            </div>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
              <button className="rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                Update Password
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div
            data-animate="card"
            className="rounded-xl border border-border bg-surface p-6 shadow-card"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {activityLog.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className={cn("h-4 w-4", item.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {item.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {item.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
