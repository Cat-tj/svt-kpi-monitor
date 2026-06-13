/**
 * Supabase Edge Function: KPI Export
 * Alternative to Next.js API route - runs on Deno at the edge.
 *
 * Endpoint: POST /functions/v1/kpi-export
 * Auth: Service role key or custom API key in Authorization header
 *
 * This function is designed for OpenClaw agents to fetch aggregated KPI data
 * with built-in caching headers for efficient polling.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { department_id, period_start, period_end } = body;

    // Fetch approved entries with KPI metadata
    let query = supabase
      .from("kpi_entries")
      .select(`
        id, actual_value, period_start, period_end, notes,
        kpi:kpis ( name, type, target_value, unit, weight, timeframe,
          department:departments ( name )
        )
      `)
      .eq("status", "approved");

    if (department_id) query = query.eq("kpi.department_id", department_id);
    if (period_start) query = query.gte("period_start", period_start);
    if (period_end) query = query.lte("period_end", period_end);

    const { data, error } = await query.order("period_end", { ascending: false });

    if (error) throw error;

    // Compute aggregated stats
    const stats = {
      total_entries: data?.length || 0,
      avg_achievement: 0,
      departments_covered: new Set(
        data?.map((d: any) => d.kpi?.department?.name).filter(Boolean)
      ).size,
    };

    if (data && data.length > 0) {
      const achievements = data.map((entry: any) => {
        const target = entry.kpi?.target_value || 1;
        return (entry.actual_value / target) * 100;
      });
      stats.avg_achievement =
        achievements.reduce((a: number, b: number) => a + b, 0) / achievements.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        entries: data,
        exported_at: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // Cache 5 minutes
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
