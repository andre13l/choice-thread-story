/**
 * DAILY CONNECT — one shared pair per UTC date.
 *
 * The backend `daily_connect` table is authoritative when a row exists. When
 * it doesn't, this deterministic generator produces the *same* pair for every
 * player from the date alone, so a day is never missing a challenge. The
 * publish endpoint uses this identical function, so the stored row and the
 * fallback always agree.
 */

import type { Graph } from "./data/dataset";
import { areCoStars, shortestClicks, type Challenge } from "./graph";
import { cachedChallengePool, type StarRating } from "./popularity";
import { dayNumberFromDate } from "@/games/core/dailyStats";

export const DAILY_GAME_ID = "connect";

/** Daily #1 — the first NIRCOSI daily. */
export const DAILY_EPOCH = "2026-08-16";

/** Difficulty window for the daily, in clicks along the optimal route. */
export const DAILY_RANGE = { min: 4, max: 8 } as const;

export function dailyNumber(date: string): number {
  return dayNumberFromDate(date) - dayNumberFromDate(DAILY_EPOCH) + 1;
}

/** Deterministic 32-bit hash of the date string. */
function seedFor(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The daily draws from the most recognizable slice of the challenge pool —
 * a daily should never open on a name nobody knows.
 */
export function dailyPool(graph: Graph): StarRating[] {
  const pool = cachedChallengePool(graph);
  return pool.slice(0, Math.max(80, Math.floor(pool.length * 0.35)));
}

/**
 * Same date + same catalogue = same pair, everywhere. Endpoints are famous,
 * never co-stars, always reachable, and inside the difficulty window.
 */
export function dailyChallenge(graph: Graph, date: string): Challenge {
  const pool = dailyPool(graph);
  const random = mulberry32(seedFor(date));
  const pick = () => pool[Math.floor(random() * pool.length)]!.id;

  let fallback: Challenge | null = null;
  for (let attempt = 0; attempt < 600; attempt++) {
    const a = pick();
    const b = pick();
    if (a === b) continue;
    if (areCoStars(graph, a, b)) continue;
    const best = shortestClicks(graph, a, b);
    if (best === null) continue;
    if (best >= DAILY_RANGE.min && best <= DAILY_RANGE.max) {
      return { startId: a, targetId: b, best };
    }
    if (!fallback && best >= 3) fallback = { startId: a, targetId: b, best };
  }
  if (fallback) return fallback;
  throw new Error(`connect: no daily pair for ${date}`);
}
