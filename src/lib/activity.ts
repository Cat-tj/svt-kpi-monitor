/**
 * Activity logging helper
 * Logs user actions to the activity_log table
 */
import { SupabaseClient } from "@supabase/supabase-js";

export type ActivityAction =
  | "entry_submitted"
  | "entry_approved"
  | "entry_rejected"
  | "entry_revised"
  | "kpi_created"
  | "kpi_deleted"
  | "department_created"
  | "user_created"
  | "user_deactivated"
  | "password_changed"
  | "data_exported"
  | "kpi_template_applied"
  | "announcement_created"
  | "delegation_created";

export async function logActivity(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  action: ActivityAction,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, any>
) {
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    metadata: metadata || {},
  } as any);
}
