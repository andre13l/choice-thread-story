/**
 * In-progress state for a daily, so a refresh mid-round doesn't hand the
 * player a fresh board (and can't be used to farm retries).
 *
 * One slot per game: opening a new UTC day simply overwrites yesterday's.
 * Never throws — storage may be unavailable.
 */
import { SITE } from "@/config/site";

interface Slot<T> {
  date: string;
  state: T;
}

function key(gameId: string): string {
  return `${SITE.storagePrefix}.daily.${gameId}.progress`;
}

export function loadProgress<T>(gameId: string, date: string): T | null {
  try {
    const raw = window.localStorage.getItem(key(gameId));
    if (!raw) return null;
    const slot = JSON.parse(raw) as Slot<T>;
    return slot?.date === date ? slot.state : null;
  } catch {
    return null;
  }
}

export function saveProgress<T>(gameId: string, date: string, state: T): void {
  try {
    window.localStorage.setItem(key(gameId), JSON.stringify({ date, state } satisfies Slot<T>));
  } catch {
    // Storage full or blocked — the round still plays, just not resumable.
  }
}

export function clearProgress(gameId: string): void {
  try {
    window.localStorage.removeItem(key(gameId));
  } catch {
    // Nothing to do.
  }
}
