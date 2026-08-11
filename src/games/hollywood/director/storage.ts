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
