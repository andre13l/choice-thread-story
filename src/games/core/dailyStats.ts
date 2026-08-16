/**
 * Shared local stats for NIRCOSI daily games.
 *
 * One namespaced record per game id, so Daily Top 10 and Daily Person can
 * reuse this verbatim later. A future global NIRCOSI streak only needs to
 * union the `lastPlayed` dates across game ids, which this shape allows.
 *
 * Never throws: storage may be unavailable (SSR, private browsing).
 */
import { SITE } from "@/config/site";

export interface DailyResult {
  /** UTC date, YYYY-MM-DD. */
  date: string;
  /** Puzzle number for that date. */
  number: number;
  /** Connect: clicks used. Other dailies write 0 and use the fields below. */
  clicks: number;
  timeMs: number;
  gaveUp: boolean;
  /** Daily Top 10: answers named. */
  score?: number;
  /** Daily Top 10: list length (always 10 today). */
  total?: number;
  /** Daily Person: clues revealed. */
  clues?: number;
  /** Daily Person: guesses made. */
  guesses?: number;
}

export interface DailyStats {
  played: number;
  streak: number;
  bestStreak: number;
  lastPlayed: string | null;
  /** Most recent results, newest last. Capped so storage stays small. */
  results: DailyResult[];
}

const EMPTY: DailyStats = { played: 0, streak: 0, bestStreak: 0, lastPlayed: null, results: [] };
const MAX_RESULTS = 60;

const key = (gameId: string) => `${SITE.storagePrefix}.daily.${gameId}`;

/** Today's date in UTC — the shared clock for every daily game. */
export function todayUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function dayNumberFromDate(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

export function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export function loadDailyStats(gameId: string): DailyStats {
  try {
    const raw = window.localStorage.getItem(key(gameId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<DailyStats>;
    return {
      played: Number(parsed.played) || 0,
      streak: Number(parsed.streak) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
      lastPlayed: typeof parsed.lastPlayed === "string" ? parsed.lastPlayed : null,
      results: Array.isArray(parsed.results) ? (parsed.results as DailyResult[]) : [],
    };
  } catch {
    return EMPTY;
  }
}

/** The stored result for a given date, if that day has been finished. */
export function resultFor(gameId: string, date: string): DailyResult | null {
  return loadDailyStats(gameId).results.find((r) => r.date === date) ?? null;
}

/** A streak only counts today if today (or yesterday, pending) was played. */
export function currentStreak(stats: DailyStats, today: string = todayUTC()): number {
  if (!stats.lastPlayed) return 0;
  const gap = dayNumberFromDate(today) - dayNumberFromDate(stats.lastPlayed);
  return gap <= 1 ? stats.streak : 0;
}

/** Records a finished day. Re-recording the same date is a no-op. */
export function recordDaily(gameId: string, result: DailyResult): DailyStats {
  const prev = loadDailyStats(gameId);
  if (prev.results.some((r) => r.date === result.date)) return prev;

  const consecutive =
    prev.lastPlayed !== null &&
    dayNumberFromDate(result.date) - dayNumberFromDate(prev.lastPlayed) === 1;
  const streak = consecutive ? prev.streak + 1 : 1;

  const next: DailyStats = {
    played: prev.played + 1,
    streak,
    bestStreak: Math.max(prev.bestStreak, streak),
    lastPlayed: result.date,
    results: [...prev.results, result].slice(-MAX_RESULTS),
  };
  try {
    window.localStorage.setItem(key(gameId), JSON.stringify(next));
  } catch {
    // Stats are a nicety, not state.
  }
  return next;
}
