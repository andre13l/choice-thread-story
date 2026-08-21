/**
 * Ranked daily score submission.
 *
 * The only write path into `daily_scores`. Identity comes from the verified
 * bearer token when the player is signed in, otherwise from the browser's
 * opaque visitor key — a client can never claim to be another account. The
 * canonical ordering key is recomputed here; a client-provided rank is never
 * trusted, and results for any date other than the live UTC date are refused
 * so historical replays cannot contaminate today's board.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { DAILY_GAMES, type DailyGameId } from "@/games/core/globalStreak";
import { isPlausible, rankKeyFor } from "@/games/core/ranking";

export interface SubmitScoreInput {
  game: DailyGameId;
  date: string;
  number: number;
  score: number;
  timeMs: number;
  visitorKey: string | null;
  meta?: Record<string, number | string | boolean>;
}

export interface SubmitScoreResult {
  entryId: string | null;
  rank: number | null;
  total: number;
  /** True when nothing was written (replay of a past date, invalid payload). */
  skipped: boolean;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export const submitDailyScore = createServerFn({ method: "POST" })
  .inputValidator((input: SubmitScoreInput) => input)
  .handler(async ({ data }): Promise<SubmitScoreResult> => {
    const empty: SubmitScoreResult = { entryId: null, rank: null, total: 0, skipped: true };

    if (!DAILY_GAMES.includes(data.game)) return empty;
    if (data.date !== todayUTC()) return empty;
    if (!isPlausible(data.game, data.score, data.timeMs)) return empty;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Optional identity: a verified bearer wins, otherwise the visitor key.
    let userId: string | null = null;
    const auth = getRequest()?.headers?.get("authorization") ?? "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      if (token.split(".").length === 3) {
        const { data: claims } = await supabaseAdmin.auth.getClaims(token);
        userId = (claims?.claims?.sub as string | undefined) ?? null;
      }
    }
    const visitor = userId ? null : (data.visitorKey ?? "").slice(0, 64) || null;
    if (!userId && !visitor) return empty;

    const meta = data.meta ?? {};
    const row = {
      game: data.game,
      puzzle_date: data.date,
      puzzle_number: Math.max(0, Math.round(data.number) || 0),
      user_id: userId,
      visitor_key: visitor,
      rank_key: rankKeyFor(data.game, data.score, meta),
      primary_score: data.score,
      time_ms: Math.round(data.timeMs),
      meta,
    };

    // One legitimate result per identity per game/date: a duplicate insert is
    // ignored, so refreshing for a luckier run can never overwrite the first.
    await supabaseAdmin
      .from("daily_scores")
      .insert(row)
      .select("id")
      .maybeSingle();

    const existing = await supabaseAdmin
      .from("daily_scores")
      .select("id")
      .eq("game", data.game)
      .eq("puzzle_date", data.date)
      .eq(userId ? "user_id" : "visitor_key", (userId ?? visitor)!)
      .maybeSingle();

    const entryId = existing.data?.id ?? null;
    if (!entryId) return empty;

    const ranked = await supabaseAdmin.rpc("daily_rank", {
      _game: data.game,
      _date: data.date,
      _entry_id: entryId,
    });
    const first = Array.isArray(ranked.data) ? ranked.data[0] : null;

    return {
      entryId,
      rank: first?.rank ? Number(first.rank) : null,
      total: first?.total ? Number(first.total) : 0,
      skipped: false,
    };
  });
