/**
 * Publishes Daily Top 10 and Daily Person rows for today and the days ahead.
 *
 * Idempotent by default: an existing row is never overwritten, so a day that
 * has already been played can't change under players. What it writes is
 * exactly what the deterministic generators derive from the date, so the
 * stored schedule and the no-row fallback always agree.
 *
 * Public by prefix, but it writes nothing an attacker could steer — the rows
 * are a pure function of the date and the catalogue.
 */
import { createFileRoute } from "@tanstack/react-router";
import { dailyNumber } from "@/games/core/daily";
import { shiftDate, todayUTC } from "@/games/core/dailyStats";
import { personFor } from "@/games/person/person.server";
import { scheduledChallenge } from "@/games/top10/top10.server";

const HORIZON = 30;

async function publish(force: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = todayUTC();

  const top10Rows = [];
  const personRows = [];
  for (let offset = 0; offset < HORIZON; offset++) {
    const date = shiftDate(today, offset);
    const number = dailyNumber(date);
    top10Rows.push({
      date,
      number,
      challenge_id: scheduledChallenge(date).id,
      published: true,
    });
    const { person } = await personFor(date);
    personRows.push({ date, number, person_id: person.id, published: true });
  }

  const top10 = await supabaseAdmin
    .from("daily_top10")
    .upsert(top10Rows, { onConflict: "date", ignoreDuplicates: !force });
  if (top10.error) throw new Error(top10.error.message);

  const person = await supabaseAdmin
    .from("daily_person")
    .upsert(personRows, { onConflict: "date", ignoreDuplicates: !force });
  if (person.error) throw new Error(person.error.message);

  return {
    days: HORIZON,
    from: top10Rows[0]?.date,
    to: top10Rows[top10Rows.length - 1]?.date,
    top10: top10Rows.map((r) => r.challenge_id),
  };
}

export const Route = createFileRoute("/api/public/daily-publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const result = await publish(url.searchParams.get("force") === "1");
          return Response.json({ ok: true, ...result });
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
