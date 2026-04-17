import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate next run timestamp based on recurrence config
function computeNextRun(
  recurrence: string,
  recurrence_day: number | null,
  recurrence_hour: number,
  fromDate: Date
): Date | null {
  const next = new Date(fromDate);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(recurrence_hour);

  if (recurrence === "daily") {
    if (next <= fromDate) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  if (recurrence === "weekly") {
    const targetDow = recurrence_day ?? 1; // 0=Sun .. 6=Sat
    const currentDow = next.getUTCDay();
    let diff = (targetDow - currentDow + 7) % 7;
    if (diff === 0 && next <= fromDate) diff = 7;
    next.setUTCDate(next.getUTCDate() + diff);
    return next;
  }

  if (recurrence === "monthly") {
    const targetDay = Math.min(Math.max(recurrence_day ?? 1, 1), 28);
    next.setUTCDate(targetDay);
    if (next <= fromDate) {
      next.setUTCMonth(next.getUTCMonth() + 1);
      next.setUTCDate(targetDay);
    }
    return next;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();

    // Find questionnaires due for sending
    const { data: due, error: dueErr } = await supabase
      .from("custom_questionnaires")
      .select("id, recurrence, recurrence_day, recurrence_hour, next_run_at")
      .eq("recurrence_active", true)
      .neq("recurrence", "none")
      .lte("next_run_at", now.toISOString());

    if (dueErr) throw dueErr;

    let totalAssignments = 0;
    const processed: string[] = [];

    for (const q of due || []) {
      // Get athletes configured for recurrence
      const { data: athletes, error: athErr } = await supabase
        .from("questionnaire_recurrence_athletes")
        .select("athlete_id")
        .eq("questionnaire_id", q.id);

      if (athErr) {
        console.error("Error fetching athletes for", q.id, athErr);
        continue;
      }

      if (athletes && athletes.length > 0) {
        const inserts = athletes.map((a: any) => ({
          questionnaire_id: q.id,
          athlete_id: a.athlete_id,
        }));

        const { error: insErr } = await supabase
          .from("custom_questionnaire_assignments")
          .insert(inserts);

        if (insErr) {
          console.error("Error assigning for", q.id, insErr);
          continue;
        }
        totalAssignments += inserts.length;
      }

      // Compute next run
      const nextRun = computeNextRun(
        q.recurrence,
        q.recurrence_day,
        q.recurrence_hour,
        now
      );

      const { error: updErr } = await supabase
        .from("custom_questionnaires")
        .update({ next_run_at: nextRun?.toISOString() ?? null })
        .eq("id", q.id);

      if (updErr) console.error("Error updating next_run", q.id, updErr);
      processed.push(q.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        assignments_created: totalAssignments,
        questionnaire_ids: processed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error in process-recurring-questionnaires:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
