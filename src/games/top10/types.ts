/** Client-safe Daily Top 10 shapes. Answers never appear in these. */

/** What kind of thing the ten blanks hold. Drives autocomplete only. */
export type Top10AnswerType = "film" | "person";

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
  answerType: Top10AnswerType;
}

/** One autocomplete suggestion. Carries no signal about today's answers. */
export interface Top10Suggestion {
  label: string;
  hint?: string;
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
