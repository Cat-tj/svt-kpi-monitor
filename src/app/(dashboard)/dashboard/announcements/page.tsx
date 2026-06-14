"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Megaphone, Plus, Loader2, X, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RoleGuard } from "@/components/ui/role-guard";
import { useToast } from "@/components/ui/toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export default function AnnouncementsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === "admin";

  async function loadAnnouncements() {
    const supabase = createClient();
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false }) as unknown as { data: Announcement[] };
    setAnnouncements(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate='card']",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      content: content.trim(),
      is_active: true,
      created_by: user?.id || null,
    } as any);

    if (error) {
      toast("Failed to create announcement", "error");
    } else {
      toast("Announcement created successfully", "success");
      setTitle("");
      setContent("");
      setShowForm(false);
      await loadAnnouncements();
    }
    setSubmitting(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const { error } = await (createClient() as any)
      .from("announcements")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast("Failed to update announcement", "error");
    } else {
      toast(currentActive ? "Announcement hidden" : "Announcement activated", "success");
      await loadAnnouncements();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const visibleAnnouncements = isAdmin
    ? announcements
    : announcements.filter((a) => a.is_active);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? "Manage company announcements" : "Company-wide updates and notices"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Create Form (Admin Only) */}
      {showForm && isAdmin && (
        <div data-animate="card" className="rounded-xl border border-brand-200 bg-brand-50/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Create Announcement</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Content</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300 resize-none"
                placeholder="Write your announcement..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {visibleAnnouncements.length === 0 ? (
        <div data-animate="card" className="rounded-xl border border-border bg-surface p-10 shadow-card text-center">
          <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              data-animate="card"
              className="rounded-xl border border-border bg-surface p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="rounded-lg bg-amber-50 p-2 mt-0.5">
                    <Megaphone className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{announcement.title}</h3>
                      {!announcement.is_active && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(announcement.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => toggleActive(announcement.id, announcement.is_active)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    {announcement.is_active ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
