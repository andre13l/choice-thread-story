/**
 * NIRCOSI — local persistence.
 *
 * localStorage today; the shape mirrors what Supabase will later store
 * globally (career verification, leaderboards, hall of fame, anti-cheat).
 * All keys are namespaced and versioned.
 */

import { SITE } from "@/config/site";
import type { CareerSummary, GameState } from "./types";

// Prefix comes from site config but must stay value-stable: existing
// players' careers live under these keys (see src/config/site.ts).
const PREFIX = SITE.storagePrefix;
const KEYS = {
  current: `${PREFIX}.hollywood.current`,
  history: `${PREFIX}.hollywood.history`,
  best: `${PREFIX}.hollywood.best`,
  count: `${PREFIX}.hollywood.count`,
  legends: `${PREFIX}.hollywood.legends`,
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
  run.game = migrateGame(run.game);
  return run;
}

/**
 * Older saves predate the variety memory (per-career seen list, family
 * cooldowns, rich cadence). Rebuild the seen list from history so existing
 * careers degrade gracefully instead of replaying everything.
 */
function migrateGame(g: GameState): GameState {
  return {
    ...g,
    films: g.films ?? [],
    seenEventIds: g.seenEventIds ?? g.history.map((h) => h.eventId),
    familyTurns: g.familyTurns ?? {},
    turnsSinceRich: g.turnsSinceRich ?? 0,
    downfallTurns: g.downfallTurns ?? 0,
    downfallCheckTurns: g.downfallCheckTurns ?? 0,
  };
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
  if (summary.legend) recordLegend(summary);
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

/* ------------------------------------------------------------------ */
/* Walk of Fame                                                         */
/*                                                                      */
/* Compact, permanent record of LEGEND careers. Kept separate from     */
/* the rolling 25-entry history so a star can never be pushed off      */
/* the pavement by later runs. When verified global legends exist      */
/* (backend), this module is the swap point.                            */
/* ------------------------------------------------------------------ */

export interface LegendRecord {
  careerId: number;
  date: string;
  score: number;
  age: number;
  movies: number;
  oscars: number;
  peakMoney: number;
}

function recordLegend(summary: CareerSummary): void {
  const entry: LegendRecord = {
    careerId: summary.careerId,
    date: summary.date,
    score: summary.score,
    age: summary.age,
    movies: summary.movies,
    oscars: summary.oscars,
    peakMoney: summary.peakMoney,
  };
  const legends = [entry, ...loadLegends()].slice(0, 50);
  localStorage.setItem(KEYS.legends, JSON.stringify(legends));
}

export function loadLegends(): LegendRecord[] {
  return safeParse<LegendRecord[]>(localStorage.getItem(KEYS.legends)) ?? [];
}

/**
 * Walk of Fame stars. The pavement only displays verified records, and
 * nothing local is verifiable — a browser can mint any localStorage value.
 * Until the backend (verified run re-simulation + publication) exists,
 * this always returns an empty pavement and local LEGENDs stay private
 * to the player's own ending screen. The backend swaps in here.
 */
export function loadPublishedStars(): LegendRecord[] {
  return [];
}
