/**
 * Publishes Daily Connect rows for today and the next few days.
 *
 * Idempotent: an existing row for a date is never overwritten, so a day that
 * has already been played can't change under players. The pair it stores is
 * exactly what `dailyChallenge()` derives from the date, so the client-side
 * fallback and the stored row always agree.
 */

import { createFileRoute } from "@tanstack/react-router";
import { loadGraph } from "@/games/connect/data/dataset";
import { dailyChallenge, dailyNumber } from "@/games/connect/daily";
import { shiftDate, todayUTC } from "@/games/core/dailyStats";

const HORIZON = 7;

async function publish(origin: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const graph = await loadGraph(origin);
  const today = todayUTC();

  const rows = [];
  for (let offset = 0; offset < HORIZON; offset++) {
    const date = shiftDate(today, offset);
    const challenge = dailyChallenge(graph, date);
    rows.push({
      date,
      number: dailyNumber(date),
      start_person_id: challenge.startId,
      target_person_id: challenge.targetId,
      optimal_clicks: challenge.best,
      published: true,
    });
  }

  const { error } = await supabaseAdmin
    .from("daily_connect")
    .upsert(rows, { onConflict: "date", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  return rows.map((r) => ({ date: r.date, number: r.number, optimal: r.optimal_clicks }));
}

export const Route = createFileRoute("/api/public/daily-connect-publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const published = await publish(new URL(request.url).origin);
          return Response.json({ ok: true, published });
        } catch (error) {
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
