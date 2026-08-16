/**
 * CONNECT — community reporting.
 *
 * Anonymous inserts only: visitors can file a report, nobody can read them
 * back from the client. A per-visitor key gives the backend a cheap
 * rate-limit handle without any login.
 */

import { supabase } from "@/integrations/supabase/client";

export type ReportKind =
  | "actor_missing"
  | "movie_missing"
  | "actor_missing_from_movie"
  | "wrong_connection"
  | "other";

export const REPORT_LABELS: Record<ReportKind, string> = {
  actor_missing: "An actor is missing from Connect",
  movie_missing: "A film is missing from Connect",
  actor_missing_from_movie: "An actor is missing from this film's cast",
  wrong_connection: "A connection looks wrong",
  other: "Something else",
};

const VISITOR_KEY = "nircosi.visitor";

function visitorKey(): string {
  if (typeof window === "undefined") return "server";
  let key = window.localStorage.getItem(VISITOR_KEY);
  if (!key) {
    key = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, key);
  }
  return key;
}

export interface ReportInput {
  kind: ReportKind;
  message: string;
  movieId?: string | null;
  personId?: string | null;
  context?: Record<string, string | number | null>;
}

export async function submitReport(input: ReportInput): Promise<{ ok: boolean; error?: string }> {
  const message = input.message.trim().slice(0, 1000);
  if (message.length < 3) return { ok: false, error: "Please add a little more detail." };

  const { error } = await supabase.from("connect_reports").insert({
    kind: input.kind,
    message,
    movie_id: input.movieId ?? null,
    person_id: input.personId ?? null,
    context: (input.context ?? {}) as never,
    visitor_key: visitorKey(),
  });

  if (error) {
    return {
      ok: false,
      error: /rate limit/i.test(error.message)
        ? "You've sent a lot of reports recently. Try again a little later."
        : "Couldn't send that report. Please try again.",
    };
  }
  return { ok: true };
}
