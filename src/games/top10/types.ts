/** Client-safe Daily Top 10 shapes. Answers never appear in these. */

export interface Top10Prompt {
  date: string;
  number: number;
  challengeId: string;
  title: string;
  subtitle?: string;
  category: string;
  source: string;
  sourceUrl?: string;
  total: number;
}

export interface Top10Hit {
  position: number;
  answer: string;
}

export interface Top10GuessResult {
  /** Null when the guess isn't on the list. */
  hit: Top10Hit | null;
  /** True when that answer had already been found. */
  duplicate: boolean;
}

export const TOP10_GAME_ID = "top10";
