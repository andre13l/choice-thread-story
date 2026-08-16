import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface CatalogCounts {
  films: number;
  people: number;
  connections: number;
  challengeActors: number;
}

/** Live catalogue size, read from the backend. Never hardcoded. */
export const getCatalogCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogCounts | null> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return null;

    const supabasePublic = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

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
