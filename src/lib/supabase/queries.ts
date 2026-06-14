/**
 * Shared Supabase query helpers used across components
 * All functions take a supabase client instance
 */

import { SupabaseClient } from "@supabase/supabase-js";

// Use 'any' to avoid generic type conflicts between typed and untyped clients
type AnySupabaseClient = SupabaseClient<any, any, any>;

// ─── KPI QUERIES ───────────────────────────────────────────────────────────────

export async function fetchKpis(supabase: AnySupabaseClient, departmentId?: string) {
  let query = supabase
    .from("kpis")
    .select("*, department:departments(id, name)")
    .eq("is_active", true)
    .order("name");

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  return query;
}

export async function fetchKpiById(supabase: AnySupabaseClient, id: string) {
  return supabase
    .from("kpis")
    .select("*, department:departments(id, name)")
    .eq("id", id)
    .single();
}

// ─── ENTRY QUERIES ─────────────────────────────────────────────────────────────

export async function fetchMyEntries(supabase: AnySupabaseClient, userId: string) {
  return supabase
    .from("kpi_entries")
    .select("*, kpi:kpis(id, name, target_value, unit, type, department:departments(name))")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false })
    .limit(50);
}

export async function fetchPendingEntries(supabase: AnySupabaseClient, departmentId?: string) {
  let query = supabase
    .from("kpi_entries")
    .select("*, kpi:kpis(id, name, target_value, unit, department_id, department:departments(name)), submitter:profiles!submitted_by(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return query;
}

export async function fetchAllEntries(supabase: AnySupabaseClient, status?: string) {
  let query = supabase
    .from("kpi_entries")
    .select("*, kpi:kpis(id, name, target_value, unit, department:departments(name)), submitter:profiles!submitted_by(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  return query;
}

export async function approveEntry(supabase: AnySupabaseClient, entryId: string, reviewerId: string, notes?: string) {
  return supabase
    .from("kpi_entries")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
    } as any)
    .eq("id", entryId);
}

export async function rejectEntry(supabase: AnySupabaseClient, entryId: string, reviewerId: string, notes?: string) {
  return supabase
    .from("kpi_entries")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || "Rejected by reviewer",
    } as any)
    .eq("id", entryId);
}

// ─── DEPARTMENT QUERIES ────────────────────────────────────────────────────────

export async function fetchDepartments(supabase: AnySupabaseClient) {
  return supabase
    .from("departments")
    .select("*")
    .order("name");
}

export async function createDepartment(supabase: AnySupabaseClient, name: string, description?: string) {
  return supabase
    .from("departments")
    .insert({ name, description } as any)
    .select()
    .single();
}

// ─── TEAM QUERIES ──────────────────────────────────────────────────────────────

export async function fetchTeamMembers(supabase: AnySupabaseClient, departmentId?: string) {
  let query = supabase
    .from("profiles")
    .select("*, department:departments(id, name)")
    .eq("is_active", true)
    .order("full_name");

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  return query;
}

// ─── STATS/ANALYTICS ───────────────────────────────────────────────────────────

export async function fetchDashboardStats(supabase: AnySupabaseClient) {
  const [kpis, entries, profiles, departments] = await Promise.all([
    supabase.from("kpis").select("id, target_value, department_id").eq("is_active", true),
    supabase.from("kpi_entries").select("id, actual_value, status, kpi_id, kpi:kpis(target_value, department_id)").eq("status", "approved"),
    supabase.from("profiles").select("id, role, department_id").eq("is_active", true),
    supabase.from("departments").select("id, name"),
  ]);

  return {
    totalKpis: kpis.data?.length || 0,
    totalApprovedEntries: entries.data?.length || 0,
    totalStaff: profiles.data?.length || 0,
    totalDepartments: departments.data?.length || 0,
    entries: entries.data || [],
    kpis: kpis.data || [],
    profiles: profiles.data || [],
    departments: departments.data || [],
  };
}

