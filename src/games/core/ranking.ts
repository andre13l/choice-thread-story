/**
 * Shared ranking contract for the five NIRCOSI dailies.
 *
 * `rankKey` is the ONE canonical ordering number (higher is always better).
 * It is recomputed server-side from the submitted raw fields — the client
 * never sends a rank. Elapsed time is the universal tiebreaker, and the
 * earliest valid submission breaks a full tie.
 *
 * Client-safe: pure functions, no imports with side effects.
 */
import type { DailyGameId } from "./globalStreak";

export interface RankableInput {
  game: DailyGameId;
  date: string;
  number: number;
  /** Raw performance number, meaning depends on the game (see below). */
  score: number;
  timeMs: number;
  meta?: Record<string, number | string | boolean>;
}

export interface RankRow {
  entryId: string;
  rank: number;
  label: string;
  score: number;
  timeMs: number;
  meta: Record<string, unknown>;
}

export const GAME_LABEL: Record<DailyGameId, string> = {
  connect: "Daily Connect",
  top10: "Pick 10",
  person: "Daily Person",
  timeline: "Daily Timeline",
  updown: "Up & Down",
};

/**
 * Per-game canonical key. Higher wins, always.
 *  connect  — fewest movie hops: 1000 - moves
 *  top10    — correct answers out of 10
 *  timeline — correctly placed films out of 6
 *  updown   — correct calls out of 10
 *  person   — efficiency: fewest clues revealed, then fewest wrong guesses
 */
export function rankKeyFor(game: DailyGameId, score: number, meta: Record<string, unknown> = {}): number {
  switch (game) {
    case "connect":
      return 1000 - score;
    case "person": {
      const wrong = Number(meta["guesses"] ?? 0);
      return 1000 - (score * 10 + Math.min(wrong, 9));
    }
    default:
      return score;
  }
}

/** Bounds check — cheap sanity, not anti-cheat. */
export function isPlausible(game: DailyGameId, score: number, timeMs: number): boolean {
  if (!Number.isFinite(score) || !Number.isFinite(timeMs)) return false;
  if (timeMs < 0 || timeMs > 6 * 60 * 60 * 1000) return false;
  if (!Number.isInteger(score) || score < 0) return false;
  const max: Record<DailyGameId, number> = {
    connect: 60,
    top10: 10,
    person: 6,
    timeline: 6,
    // Survival run: distance along the shared 100-comparison path.
    updown: 100,
  };
  return score <= max[game];
}

/** Human-readable performance, exactly what leaderboards and results show. */
export function formatPerformance(
  game: DailyGameId,
  score: number,
  timeMs: number,
  meta: Record<string, unknown> = {},
): string {
  const secs = Math.max(0, Math.round(timeMs / 100) / 10);
  const mmss = () => {
    const s = Math.max(0, Math.round(timeMs / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  switch (game) {
    case "connect":
      return `${score} move${score === 1 ? "" : "s"} · ${mmss()}`;
    case "timeline":
      return `${score}/${Number(meta["total"] ?? 6)} · ${secs.toFixed(1)}s`;
    case "updown":
      // Distance first, time only as the tiebreaker.
      return `${score} straight · ${secs.toFixed(1)}s`;
    case "top10":
      return `${score}/${Number(meta["total"] ?? 10)} · ${mmss()}`;
    case "person": {
      const wrong = Number(meta["guesses"] ?? 0);
      return `${score} clue${score === 1 ? "" : "s"} · ${wrong} wrong · ${mmss()}`;
    }
  }
}

