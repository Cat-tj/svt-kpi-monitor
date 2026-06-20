/**
 * Supabase Database Types
 * Auto-generated via: pnpm db:types
 * Manual definition for initial development
 */

export type UserRole = "admin" | "manager" | "staff";
export type KpiType = "percentage" | "currency" | "numerical";
export type KpiTimeframe = "weekly" | "monthly" | "annually";
export type EntryStatus = "pending" | "approved" | "rejected";
export type EntryPriority = "low" | "medium" | "high" | "critical";

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          department_id: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          department_id?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          full_name?: string;
          email?: string;
          role?: UserRole;
          department_id?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
        };
      };
      kpis: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          department_id: string;
          type: KpiType;
          timeframe: KpiTimeframe;
          target_value: number;
          weight: number;
          unit: string | null;
          start_date: string | null;
          due_date: string | null;
          assigned_to: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          department_id: string;
          type?: KpiType;
          timeframe?: KpiTimeframe;
          target_value: number;
          weight?: number;
          unit?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          assigned_to?: string | null;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          department_id?: string;
          type?: KpiType;
          timeframe?: KpiTimeframe;
          target_value?: number;
          weight?: number;
          unit?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          assigned_to?: string | null;
          is_active?: boolean;
        };
      };
      sub_kpis: {
        Row: {
          id: string;
          kpi_id: string;
          name: string;
          description: string | null;
          target_value: number;
          weight: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kpi_id: string;
          name: string;
          description?: string | null;
          target_value: number;
          weight?: number;
        };
        Update: {
          kpi_id?: string;
          name?: string;
          description?: string | null;
          target_value?: number;
          weight?: number;
        };
      };
      kpi_entries: {
        Row: {
          id: string;
          kpi_id: string;
          sub_kpi_id: string | null;
          submitted_by: string;
          period_start: string;
          period_end: string;
          actual_value: number;
          notes: string | null;
          status: EntryStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          score: number | null;
          issue: string | null;
          priority: "low" | "medium" | "high" | "critical" | null;
          output: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kpi_id: string;
          sub_kpi_id?: string | null;
          submitted_by: string;
          period_start: string;
          period_end: string;
          actual_value: number;
          notes?: string | null;
          status?: EntryStatus;
          issue?: string | null;
          priority?: "low" | "medium" | "high" | "critical" | null;
          output?: string | null;
        };
        Update: {
          actual_value?: number;
          notes?: string | null;
          status?: EntryStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          score?: number | null;
          issue?: string | null;
          priority?: "low" | "medium" | "high" | "critical" | null;
          output?: string | null;
        };
      };
      ai_reports: {
        Row: {
          id: string;
          title: string;
          report_type: string;
          content: Record<string, unknown>;
          department_id: string | null;
          generated_by: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          report_type: string;
          content: Record<string, unknown>;
          department_id?: string | null;
          generated_by?: string;
          is_read?: boolean;
        };
        Update: {
          title?: string;
          content?: Record<string, unknown>;
          is_read?: boolean;
        };
      };
      api_keys: {
        Row: {
          id: string;
          name: string;
          key_hash: string;
          permissions: unknown;
          is_active: boolean;
          last_used_at: string | null;
          created_by: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          key_hash: string;
          permissions?: unknown;
          is_active?: boolean;
          created_by?: string | null;
          expires_at?: string | null;
        };
        Update: {
          name?: string;
          permissions?: unknown;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
        };
      };
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
      get_user_department: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}
