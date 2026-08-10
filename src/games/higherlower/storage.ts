/**
 * localStorage persistence for HIGHER/LOWER. Namespaced under
 * SITE.storagePrefix, safe-parsed so corrupt/missing data never throws.
 */
import { SITE } from "@/config/site";
import type { Metric } from "./data/movies";

const bestKey = (metric: Metric) => `${SITE.storagePrefix}.higherlower.best.${metric}`;
const roundsKey = `${SITE.storagePrefix}.higherlower.rounds`;

function safeGetNumber(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable (private mode, quota, SSR) — fail silently.
  }
}

export function loadBest(metric: Metric): number {
  return safeGetNumber(bestKey(metric)) ?? 0;
}

export function saveBestIfHigher(metric: Metric, streak: number): number {
  const current = loadBest(metric);
  if (streak > current) {
    safeSet(bestKey(metric), streak);
    return streak;
  }
  return current;
}

export function loadRounds(): number {
  return safeGetNumber(roundsKey) ?? 0;
}

export function recordRound(): number {
  const next = loadRounds() + 1;
  safeSet(roundsKey, next);
  return next;
}
