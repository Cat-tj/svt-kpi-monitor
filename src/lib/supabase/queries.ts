/**
 * Legacy query helpers — now these are thin wrappers that use the
 * compatibility client (which calls our MySQL API).
 * Kept so existing page imports don't break.
 */

type AnyClient = any;

export async function approveEntry(supabase: AnyClient, entryId: string, reviewerId: string, score?: number | null, notes?: string) {
  return supabase
    .from("kpi_entries")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
      score: score ?? null,
    })
    .eq("id", entryId);
}

export async function rejectEntry(supabase: AnyClient, entryId: string, reviewerId: string, notes?: string) {
  return supabase
    .from("kpi_entries")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
    })
    .eq("id", entryId);
}

export async function updateEntryDecision(
  supabase: AnyClient,
  entryId: string,
  reviewerId: string,
  status: "approved" | "rejected" | "pending",
  opts?: { score?: number | null; notes?: string }
) {
  const isPending = status === "pending";
  return supabase
    .from("kpi_entries")
    .update({
      status,
      reviewed_by: isPending ? null : reviewerId,
      reviewed_at: isPending ? null : new Date().toISOString(),
      review_notes: isPending ? null : (opts?.notes || null),
      score: status === "approved" ? (opts?.score ?? null) : null,
    })
    .eq("id", entryId);
}
