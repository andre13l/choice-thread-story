/**
 * Client-side leaderboard reads.
 *
 * Every read goes through SECURITY DEFINER RPCs that project only what the
 * board renders — never visitor keys, user ids or emails.
 */
import { supabase } from "@/integrations/supabase/client";
import type { DailyGameId } from "./globalStreak";
import type { RankRow } from "./ranking";

export async function leaderboardPage(
  game: DailyGameId,
  date: string,
  limit = 20,
  offset = 0,
): Promise<RankRow[]> {
  const { data, error } = await supabase.rpc("daily_leaderboard", {
    _game: game,
    _date: date,
    _limit: limit,
    _offset: offset,
  });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    entryId: String(r["entry_id"]),
    rank: Number(r["rank"]),
    label: String(r["label"] ?? "Guest"),
    score: Number(r["primary_score"] ?? 0),
    timeMs: Number(r["time_ms"] ?? 0),
    meta: (r["meta"] as Record<string, unknown>) ?? {},
  }));
}

export async function rankOf(
  game: DailyGameId,
  date: string,
  entryId: string,
): Promise<{ rank: number | null; total: number }> {
  const { data, error } = await supabase.rpc("daily_rank", {
    _game: game,
    _date: date,
    _entry_id: entryId,
  });
  const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
  if (error || !row) return { rank: null, total: 0 };
  return {
    rank: row["rank"] == null ? null : Number(row["rank"]),
    total: Number(row["total"] ?? 0),
  };
}

/** Associates results played anonymously in this browser with the account. */
export async function claimAnonymousScores(visitorKey: string | null): Promise<number> {
  if (!visitorKey) return 0;
  const { data } = await supabase.rpc("claim_daily_scores", { _visitor_key: visitorKey });
  return Number(data ?? 0);
}

export interface HistoryRow {
  game: DailyGameId;
  date: string;
  number: number;
  score: number;
  timeMs: number;
  meta: Record<string, unknown>;
}

export async function myHistory(limit = 90): Promise<HistoryRow[]> {
  const { data, error } = await supabase.rpc("my_daily_history", { _limit: limit });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    game: r["game"] as DailyGameId,
    date: String(r["puzzle_date"]),
    number: Number(r["puzzle_number"] ?? 0),
    score: Number(r["primary_score"] ?? 0),
    timeMs: Number(r["time_ms"] ?? 0),
    meta: (r["meta"] as Record<string, unknown>) ?? {},
  }));
}
