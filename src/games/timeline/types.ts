/** Client-safe Daily Timeline shapes. Release years never appear in the prompt. */

/** One card on the board before the reveal: a title and nothing else. */
export interface TimelineCard {
  /** Opaque per-day slot key. Deliberately not the catalogue id, which would
   *  leak chronology (IMDb ids sort roughly by era). */
  key: string;
  title: string;
}

export interface TimelinePrompt {
  date: string;
  number: number;
  /** Shuffled starting order — identical for every player on this date. */
  cards: TimelineCard[];
  total: number;
}

/** Returned only after the player submits. */
export interface TimelineRevealCard extends TimelineCard {
  year: number;
}

export interface TimelineReveal {
  date: string;
  number: number;
  /** Oldest → newest. */
  solution: TimelineRevealCard[];
}

/**
 * Shape a future leaderboard row is written from. Everything here is already
 * produced client-side today; persisting it later needs no game changes.
 */
export interface TimelineScore {
  date: string;
  number: number;
  scoreCorrectPositions: number;
  total: number;
  timeMs: number;
  completedAt: string;
}

export const TIMELINE_GAME_ID = "timeline";
export const TIMELINE_SIZE = 6;
