/**
 * Director-path persistence. Separate keys from the legacy actor path —
 * the models are not compatible and old runs are not migrated.
 */

import { SITE } from "@/config/site";
import type { CareerSnapshot, DirectorCareer } from "./types";

const PREFIX = `${SITE.storagePrefix}.hollywood.director`;
const KEYS = {
  current: `${PREFIX}.current`,
  history: `${PREFIX}.history`,
  count: `${PREFIX}.count`,
};

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadCareer(): DirectorCareer | null {
  const c = parse<DirectorCareer>(localStorage.getItem(KEYS.current));
  if (!c || !Array.isArray(c.films) || c.ended) return null;
  return c;
}

export function saveCareer(c: DirectorCareer | null): void {
  if (c && !c.ended) localStorage.setItem(KEYS.current, JSON.stringify(c));
  else localStorage.removeItem(KEYS.current);
}

export function loadHistory(): CareerSnapshot[] {
  return parse<CareerSnapshot[]>(localStorage.getItem(KEYS.history)) ?? [];
}

export function recordCareer(s: CareerSnapshot): void {
  const next = [s, ...loadHistory()].slice(0, 25);
  localStorage.setItem(KEYS.history, JSON.stringify(next));
  localStorage.setItem(KEYS.count, String(loadCount() + 1));
}

export function loadCount(): number {
  const n = Number(localStorage.getItem(KEYS.count));
  return Number.isFinite(n) ? n : 0;
}

/**
 * FULL-RUN PERSISTENCE
 *
 * Saving only the career meant any remount (tab restore, bfcache eviction,
 * a stray re-render of the route) rehydrated at the START of the current
 * cycle — the player was thrown back to the offers board after casting or
 * budgeting. The whole in-flight turn is now persisted, so a reload lands
 * exactly where the player was.
 *
 * The live `CareerEvent` object holds predicate functions, so only its id
 * is stored and the event is re-resolved from the bank on load.
 */
export interface SavedRun {
  v: 2;
  career: DirectorCareer;
  phase: string;
  offers: unknown[];
  project: unknown | null;
  pool: unknown[];
  cast: unknown[];
  pending: unknown | null;
  jump: unknown | null;
  eventId: string | null;
  eventOutcome: unknown | null;
}

const RUN_KEY = `${PREFIX}.run`;

export function saveRun(run: SavedRun | null): void {
  try {
    if (run && !run.career.ended) localStorage.setItem(RUN_KEY, JSON.stringify(run));
    else localStorage.removeItem(RUN_KEY);
  } catch {
    // Storage full or unavailable — the run simply won't survive a reload.
  }
}

export function loadRun(): SavedRun | null {
  const run = parse<SavedRun>(localStorage.getItem(RUN_KEY));
  if (!run || run.v !== 2 || !run.career || !Array.isArray(run.career.films)) return null;
  if (run.career.ended) return null;
  return run;
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    /* ignore */
  }
}
