/** Client-safe Daily Person shapes. The answer is never in a prompt payload. */

export type PersonClueKind = "profile" | "credit" | "costar" | "portrait";

export interface PersonClue {
  /** 1-based clue number. */
  index: number;
  kind: PersonClueKind;
  label: string;
  text: string;
  /** Only ever set on the final portrait clue. */
  imageFile?: string;
}

export interface PersonPrompt {
  date: string;
  number: number;
  totalClues: number;
  clues: PersonClue[];
}

export interface PersonGuessResult {
  correct: boolean;
  /** Echo of what the guess matched, for the wrong-guess trail. */
  guess: string;
}

export interface PersonReveal {
  name: string;
  imageFile: string | null;
  birthYear: number | null;
  credits: { title: string; year: number }[];
}

export const PERSON_GAME_ID = "person";
export const PERSON_MAX_CLUES = 6;
