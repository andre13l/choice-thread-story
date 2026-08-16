/**
 * Shared daily foundation: the NIRCOSI calendar and the deterministic RNG
 * every daily game draws from.
 *
 * All dailies share one epoch, so "NIRCOSI #214" means the same UTC date
 * whichever game you're looking at.
 */
import { dayNumberFromDate } from "./dailyStats";

/** Daily #1 — the first NIRCOSI daily. */
export const DAILY_EPOCH = "2026-08-16";

export function dailyNumber(date: string): number {
  return dayNumberFromDate(date) - dayNumberFromDate(DAILY_EPOCH) + 1;
}

/** Deterministic 32-bit hash — same string, same number, forever. */
export function seedFromString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with a seeded RNG. Pure: the input array is not mutated. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Normalised comparison key for a typed title or name: case, accents,
 * punctuation, ampersands and a leading "the" all stop mattering.
 */
export function answerKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\u2010-\u2015]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "")
    .replace(/^a /, "")
    .trim();
}
