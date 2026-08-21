/** Client-safe DAILY UP & DOWN shapes. */

export interface UpDownCard {
  /** Opaque, date-scoped key. */
  key: string;
  title: string;
  year: number;
  /** Worldwide theatrical gross, in millions of USD. */
  grossM: number;
}

export interface UpDownPrompt {
  date: string;
  number: number;
  /** Length `total + 1`: the first card is the opening reference. */
  cards: UpDownCard[];
  /** Comparisons available on this path. */
  total: number;
}

/**
 * Rank-ready result row. Distance (consecutive correct calls before the first
 * mistake) is primary; elapsed time only breaks ties at equal distance.
 */
export interface UpDownScore {
  date: string;
  number: number;
  correct: number;
  total: number;
  timeMs: number;
  completedAt: string;
}

export const UPDOWN_GAME_ID = "updown";

/** Legacy fixed-length accuracy format, kept for dates before the cutover. */
export const UPDOWN_ROUNDS = 10;

/** Survival format: one long shared path, one mistake ends the run. */
export const UPDOWN_PATH_LENGTH = 100;

/**
 * First UTC date played as a survival run. Earlier dates keep the 10-round
 * accuracy rules so already-submitted scores stay historically valid.
 */
export const UPDOWN_SURVIVAL_FROM = "2026-08-21";

/**
 * Local state written under the old 10-round rules for the cutover date is
 * stale: bumping this token makes those players replayable exactly once.
 */
export const UPDOWN_FORMAT_VERSION = 2;

export function isSurvivalDate(date: string): boolean {
  return date >= UPDOWN_SURVIVAL_FROM;
}
