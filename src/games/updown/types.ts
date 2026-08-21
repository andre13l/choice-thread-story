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
  /** Length ROUNDS + 1: the first card is the opening reference. */
  cards: UpDownCard[];
  total: number;
}

/**
 * Rank-ready result row. Accuracy is primary, elapsed time is the tiebreaker,
 * so Phase 3 can submit this verbatim without touching gameplay.
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
export const UPDOWN_ROUNDS = 10;
