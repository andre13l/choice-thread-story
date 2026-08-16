/**
 * DAILY TOP 10 — autocomplete catalogue search. SERVER ONLY.
 *
 * ANSWER-SECURITY POLICY
 * This endpoint never receives, and never consults, the current date's
 * challenge. It searches two indistinguishable sources:
 *
 *   1. the shared Connect catalogue (thousands of films / people), and
 *   2. the union of every answer in the whole challenge bank — all lists,
 *      every date, past and future — so that a valid answer missing from
 *      the catalogue is still typeable.
 *
 * Because source 2 is the union across ~35 lists, a suggestion carries no
 * information about *today's* ten. Nothing is flagged, ordered or scored by
 * membership in the current list, and a query shorter than two characters
 * returns nothing at all.
 */
import { createClient } from "@supabase/supabase-js";
import { answerKey } from "@/games/core/daily";
import type { Database } from "@/integrations/supabase/types";
import { CHALLENGES } from "./bank.server";
import type { Top10AnswerType, Top10Suggestion } from "./types";

const LIMIT = 8;

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

/** Every answer across the entire bank, for the requested answer kind. */
function bankPool(kind: Top10AnswerType): string[] {
  const out = new Set<string>();
  for (const challenge of CHALLENGES) {
    if ((challenge.answerType ?? "film") !== kind) continue;
    for (const answer of challenge.answers) out.add(answer);
  }
  return [...out];
}

/** PostgREST `ilike` pattern escaping. */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (m) => `\\${m}`);
}

function rank(label: string, key: string): number {
  const k = answerKey(label);
  if (k === key) return 0;
  if (k.startsWith(key)) return 1;
  return 2;
}

export async function searchTop10Catalog(
  kind: Top10AnswerType,
  query: string,
): Promise<Top10Suggestion[]> {
  const q = (query ?? "").trim().slice(0, 60);
  if (q.length < 2) return [];
  const key = answerKey(q);
  if (!key) return [];

  const results = new Map<string, Top10Suggestion>();
  const add = (label: string, hint?: string) => {
    const k = answerKey(label);
    if (!k || results.has(k)) return;
    results.set(k, hint ? { label, hint } : { label });
  };

  // 1. Catalogue.
  const supabasePublic = publicClient();
  if (supabasePublic) {
    try {
      const pattern = `%${escapeLike(q)}%`;
      if (kind === "film") {
        const { data } = await supabasePublic
          .from("connect_movies")
          .select("title, year, notability")
          .ilike("title", pattern)
          .order("notability", { ascending: false })
          .limit(30);
        for (const row of data ?? []) add(row.title, row.year ? String(row.year) : undefined);
      } else {
        const { data } = await supabasePublic
          .from("connect_people")
          .select("name, notability")
          .ilike("name", pattern)
          .order("notability", { ascending: false })
          .limit(30);
        for (const row of data ?? []) add(row.name);
      }
    } catch {
      // Catalogue unavailable — the bank pool below still answers.
    }
  }

  // 2. Bank union — indistinguishable from catalogue hits.
  for (const label of bankPool(kind)) {
    if (answerKey(label).includes(key)) add(label);
  }

  return [...results.values()]
    .sort((a, b) => {
      const d = rank(a.label, key) - rank(b.label, key);
      return d !== 0 ? d : a.label.length - b.label.length;
    })
    .slice(0, LIMIT);
}
