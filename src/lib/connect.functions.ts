import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface CatalogCounts {
  films: number;
  people: number;
  connections: number;
  challengeActors: number;
}

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Opaque sb_ publishable keys aren't JWTs — send them as `apikey` only.
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Live catalogue size, read from the backend. Never hardcoded. */
export const getCatalogCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogCounts | null> => {
    const supabasePublic = publicClient();
    if (!supabasePublic) return null;

    const { data, error } = await supabasePublic
      .from("connect_catalog_counts")
      .select("films, people, connections, challenge_actors")
      .maybeSingle();

    if (error || !data) return null;
    return {
      films: Number(data.films ?? 0),
      people: Number(data.people ?? 0),
      connections: Number(data.connections ?? 0),
      challengeActors: Number(data.challenge_actors ?? 0),
    };
  },
);

export interface DailyConnectPayload {
  date: string;
  number: number;
  startPersonId: string;
  targetPersonId: string;
  optimalClicks: number;
}

/**
 * Today's published Daily Connect (UTC). Public, anonymous, cacheable —
 * everyone gets the same row for the same date.
 */
export const getDailyConnect = createServerFn({ method: "GET" })
  .inputValidator((input: { date?: string } | undefined) => ({ date: input?.date }))
  .handler(async ({ data }): Promise<DailyConnectPayload | null> => {
    const supabasePublic = publicClient();
    if (!supabasePublic) return null;
    const date = data.date ?? new Date().toISOString().slice(0, 10);

    const { data: row, error } = await supabasePublic
      .from("daily_connect")
      .select("date, number, start_person_id, target_person_id, optimal_clicks")
      .eq("date", date)
      .eq("published", true)
      .maybeSingle();

    if (error || !row) return null;
    return {
      date: row.date,
      number: row.number,
      startPersonId: row.start_person_id,
      targetPersonId: row.target_person_id,
      optimalClicks: row.optimal_clicks,
    };
  });
