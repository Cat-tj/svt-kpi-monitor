"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Hard redirect to ensure middleware picks up the new session
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="Etam Daya"
            width={64}
            height={64}
            className="mx-auto mb-4 h-16 w-16 rounded-xl object-contain"
            priority
          />
          <h1 className="text-xl font-bold text-gray-900">KPI Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">PT Chief Level Indonesia</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@chieflevel.co.id"
              required
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!email) { setError("Enter your email first"); return; }
              const supabase = createClient();
              const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback`,
              });
              if (resetErr) setError(resetErr.message);
              else setError("");
              alert(resetErr ? resetErr.message : "Password reset link sent to your email!");
            }}
            className="w-full text-center text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            Forgot password?
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Enterprise access only. Contact IT for credentials.
        </p>
      </div>
    </div>
  );
}
