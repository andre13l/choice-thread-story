/**
 * Director-path tuning. Nothing here is ever rendered.
 */

import { TEST_MODE } from "../config";

export { TEST_MODE };

export const DIRECTOR_PACING = {
  startAge: 24,
  startYear: 2004,
  startMoney: 8_000,
  softEndAge: 62,
  hardEndAge: 76,
} as const;


/**
 * The hidden escape. Eligibility sits at the extreme tail of a director's
 * filmography; the trigger keeps it vanishingly rare in production.
 */
export const DIRECTOR_LEGEND = {
  triggerPerCycle: TEST_MODE ? 1 / 3 : 1 / 45_000,
  eligibility: {
    films: 10,
    oscars: 3,
    reputation: 88,
    recognition: 82,
    prestige: 85,
    avgCritics: 74,
    peakWorldwide: 900_000_000,
    minAge: 52,
  },
} as const;

/** How the career ends when it ends. Pressure, not a timer. */
export const DIRECTOR_DECLINE = {
  /** Cycles before an ending may be considered at all. */
  minFilms: 7,
  /** Ruin threshold on personal net worth. */
  ruinMoney: -3_000_000,
  baseChance: TEST_MODE ? 0.05 : 0.013,
  ageRampStart: 64,
  ageRampPerYear: 0.02,
  maxChance: 0.34,
} as const;

/**
 * Pressure -> ending. Careers end because of what happened, not a timer;
 * these constants only decide how fast that reckoning arrives.
 */
export const DIRECTOR_PRESSURE = {
  /** No ending before the career has a shape (unless genuinely ruined). */
  graceFilms: 3,
  ruinMoney: -3_000_000,
  base: TEST_MODE ? 0.05 : 0.012,
  pressureWeight: 0.44,
  lengthRampFilms: 6,
  lengthRampPerFilm: 0.021,
  ageRampStart: 58,
  ageRampPerYear: 0.017,
  maxChance: 0.46,
} as const;
