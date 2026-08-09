/**
 * PATHS — local persistence.
 *
 * localStorage today; the shape mirrors what Supabase will later store
 * globally (career verification, leaderboards, hall of fame, anti-cheat).
 * All keys are namespaced and versioned.
 */

import type { CareerSummary, GameState } from "./types";

const PREFIX = "paths.v1";
const KEYS = {
  current: `${PREFIX}.hollywood.current`,
  history: `${PREFIX}.hollywood.history`,
  best: `${PREFIX}.hollywood.best`,
  count: `${PREFIX}.hollywood.count`,
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface SavedRun {
  game: GameState;
  eventId: string | null;
}

export function loadCurrentCareer(): SavedRun | null {
  const run = safeParse<SavedRun>(localStorage.getItem(KEYS.current));
  if (!run || !run.game || run.game.history.length === 0) return null;
  return run;
}

export function saveCurrentCareer(run: SavedRun | null): void {
  if (run) localStorage.setItem(KEYS.current, JSON.stringify(run));
  else localStorage.removeItem(KEYS.current);
}

export function loadHistory(): CareerSummary[] {
  return safeParse<CareerSummary[]>(localStorage.getItem(KEYS.history)) ?? [];
}

export function recordCareer(summary: CareerSummary): void {
  const history = [summary, ...loadHistory()].slice(0, 25);
  localStorage.setItem(KEYS.history, JSON.stringify(history));
  const best = loadBest();
  if (!best || summary.score > best.score) {
    localStorage.setItem(KEYS.best, JSON.stringify(summary));
  }
  localStorage.setItem(KEYS.count, String(loadCount() + 1));
  saveCurrentCareer(null);
}

export function loadBest(): CareerSummary | null {
  return safeParse<CareerSummary>(localStorage.getItem(KEYS.best));
}

export function loadCount(): number {
  const n = Number(localStorage.getItem(KEYS.count));
  return Number.isFinite(n) ? n : 0;
}
