/**
 * GLOBAL NIRCOSI DAILY STREAK.
 *
 * A UTC day counts once the player finished *at least one* daily game that
 * day. Playing two or three dailies on the same date never counts twice.
 *
 * Purely local for now (no account sync), but the shape — a union over the
 * per-game records already written by `dailyStats` — is exactly what a future
 * server-synced streak would compute, so nothing here blocks that.
 */
import { dayNumberFromDate, loadDailyStats, resultFor, todayUTC } from "./dailyStats";

export const DAILY_GAMES = ["connect", "top10", "person"] as const;
export type DailyGameId = (typeof DAILY_GAMES)[number];

/** Every UTC date on which any daily was finished. */
export function completedDates(): Set<string> {
  const dates = new Set<string>();
  for (const game of DAILY_GAMES) {
    for (const result of loadDailyStats(game).results) dates.add(result.date);
  }
  return dates;
}

/** Which of today's dailies are already done. */
export function completedToday(today: string = todayUTC()): Record<DailyGameId, boolean> {
  return {
    connect: resultFor("connect", today) !== null,
    top10: resultFor("top10", today) !== null,
    person: resultFor("person", today) !== null,
  };
}

/**
 * Consecutive days ending today. A day still in progress doesn't break the
 * streak — the count then ends at yesterday.
 */
export function globalStreak(today: string = todayUTC()): number {
  const dates = completedDates();
  if (dates.size === 0) return 0;

  const dayOf = dayNumberFromDate;
  const todayNum = dayOf(today);
  const nums = new Set([...dates].map(dayOf));

  let cursor = nums.has(todayNum) ? todayNum : todayNum - 1;
  if (!nums.has(cursor)) return 0;

  let streak = 0;
  while (nums.has(cursor)) {
    streak++;
    cursor--;
  }
  return streak;
}
