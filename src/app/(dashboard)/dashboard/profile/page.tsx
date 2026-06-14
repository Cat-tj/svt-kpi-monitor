"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Mail, Building2, Shield, Lock, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate='card']", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [authLoading]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(""); setPasswordErr("");

    if (newPassword.length < 6) {
      setPasswordErr("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr("Passwords do not match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordErr(error.message);
    } else {
      setPasswordMsg("Password updated successfully!");
      setNewPassword(""); setConfirmPassword("");
    }
    setSaving(false);
  }

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  const initials = user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div ref={containerRef} className="space-y-6">
      <div data-animate="card">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account information</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full gradient-brand flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{user.role}</p>
            <div className="w-full mt-5 space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 capitalize">{user.role} Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div data-animate="card" className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all" />
            </div>
            {passwordErr && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{passwordErr}</p>}
            {passwordMsg && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{passwordMsg}</p>}
            <button type="submit" disabled={saving} className="rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
