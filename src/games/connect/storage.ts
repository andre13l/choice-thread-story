/**
 * Lightweight local stats for CONNECT. Never throws — storage may be
 * unavailable (SSR, private mode).
 */
import { SITE } from "@/config/site";

const KEY = `${SITE.storagePrefix}.connect.stats`;

export interface ConnectStats {
  completed: number;
  /** Best clicks-over-optimum ever achieved (0 = perfect). */
  bestOverpar: number | null;
  bestClicks: number | null;
}

const EMPTY: ConnectStats = { completed: 0, bestOverpar: null, bestClicks: null };

export function loadStats(): ConnectStats {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ConnectStats>;
    return {
      completed: Number(parsed.completed) || 0,
      bestOverpar: typeof parsed.bestOverpar === "number" ? parsed.bestOverpar : null,
      bestClicks: typeof parsed.bestClicks === "number" ? parsed.bestClicks : null,
    };
  } catch {
    return EMPTY;
  }
}

export function recordCompletion(clicks: number, best: number): ConnectStats {
  const prev = loadStats();
  const overpar = clicks - best;
  const next: ConnectStats = {
    completed: prev.completed + 1,
    bestOverpar: prev.bestOverpar === null ? overpar : Math.min(prev.bestOverpar, overpar),
    bestClicks: prev.bestClicks === null ? clicks : Math.min(prev.bestClicks, clicks),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore — stats are a nicety, not state.
  }
  return next;
}
