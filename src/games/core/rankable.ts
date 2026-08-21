/**
 * Rank-ready daily results.
 *
 * Every timed daily writes one row per date here, in the exact shape a future
 * leaderboard submission needs: accuracy first, elapsed time as the tiebreaker.
 * Purely local today — Phase 3 can drain this store to the server without any
 * gameplay change.
 *
 * Never throws: storage may be unavailable (SSR, private browsing).
 */
import { SITE } from "@/config/site";

export interface RankableResult {
  gameId: string;
  date: string;
  number: number;
  /** Primary ordering key — higher is better. */
  correct: number;
  total: number;
  /** Tiebreaker among equal `correct`, lower is better. */
  timeMs: number;
  completedAt: string;
  /** Not yet submitted anywhere; reserved for Phase 3. */
  submitted: false;
}

const MAX_ROWS = 90;
const key = (gameId: string) => `${SITE.storagePrefix}.rank.${gameId}`;

export function loadRankable(gameId: string): RankableResult[] {
  try {
    const raw = window.localStorage.getItem(key(gameId));
    const parsed = raw ? (JSON.parse(raw) as RankableResult[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Records one finished day. Re-recording the same date is a no-op. */
export function recordRankable(
  row: Omit<RankableResult, "completedAt" | "submitted">,
): RankableResult[] {
  const rows = loadRankable(row.gameId);
  if (rows.some((r) => r.date === row.date)) return rows;
  const next = [...rows, { ...row, completedAt: new Date().toISOString(), submitted: false as const }]
    .slice(-MAX_ROWS);
  try {
    window.localStorage.setItem(key(row.gameId), JSON.stringify(next));
  } catch {
    // Rankings are a nicety, not state.
  }
  return next;
}

/** Accuracy first, then time. The ordering a leaderboard will use. */
export function compareRankable(a: RankableResult, b: RankableResult): number {
  if (a.correct !== b.correct) return b.correct - a.correct;
  return a.timeMs - b.timeMs;
}
