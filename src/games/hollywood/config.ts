/**
 * PATHS — tuning configuration.
 *
 * Probability configuration lives here, deliberately separated from any UI.
 * Nothing in this file may ever be rendered, hinted at, or leaked to the
 * player-facing interface.
 */

/**
 * TEST_MODE — development-only switch. It relaxes rarity so the hidden final
 * state can be experienced while building, and it is the single gate for the
 * developer inspection controls. It MUST stay false: any public session
 * (preview included) renders zero dev UI and plays on production odds, where
 * the architecture targets roughly 1 / 1,000,000 careers across all players.
 * Flip it locally while working, never commit it as true.
 */
export const TEST_MODE = false;


export const LEGEND_CONFIG = {
  /** Chance per turn, once internally eligible, that the final chain begins. */
  triggerPerTurn: TEST_MODE ? 1 / 55 : 1 / 65_000,
  /** Probability of surviving stage one of the chain. */
  stageOneChance: TEST_MODE ? 0.38 : 0.3,
  /** Probability of surviving the final gamble. */
  stageTwoChance: TEST_MODE ? 0.5 : 0.22,
  /** Extra per-turn weight for the chain while inside it. */
} as const;

/** Hidden internal thresholds. Skill moves you toward these; nothing guarantees them. */
// Thresholds sit at the extreme tail of simulated optimal careers.
// Wealth is deliberately not a gate: history does not remember bank balances.
export const LEGEND_ELIGIBILITY = {
  legacy: 42,
  culturalImpact: 38,
  industryRespect: 52,
  fame: 70,
  oscars: 2,
  movies: 8,
  minAge: 40,
} as const;

/** Career pacing. */
export const PACING = {
  startAge: 18,
  /** Years advanced per decision [min, max]. */
  yearsPerTurn: [1, 3] as const,
  /** From this age, each turn has an increasing chance the path winds down. */
  softEndAge: 57,
  hardEndAge: 78,
} as const;

/**
 * Variety tuning — how aggressively repetition is prevented and how often
 * rich (multi-step) interactions surface in ordinary play. Not player-facing.
 */
export const VARIETY = {
  /** Minimum turns between two events of the same family. */
  familyCooldownTurns: 6,
  /** Turns without a sequence event before eligible sequences get boosted. */
  richCadenceTurns: 8,
  /** Weight multiplier for eligible sequences once the cadence lapses. */
  richBoost: 14,
} as const;

/**
 * Downfall tuning — hidden. Every non-legend path ends; these numbers
 * shape when the ending starts hunting and how hard pressure pushes it.
 * The player never sees any of this.
 */
export const DOWNFALL = {
  /** No pressure-triggered ending before the career has a story to lose. */
  minTurns: 10,
  /** Base per-turn chance once the career is in the high-stakes tier. */
  baseChancePerTurn: TEST_MODE ? 0.05 : 0.02,
  /** Total pressure below this adds nothing. */
  pressureFloor: 120,
  /** Extra per-turn chance per point of pressure above the floor. */
  pressureScale: 0.0008,
  /** From this age, the ending hunts harder every year. */
  ageRampStart: 62,
  ageRampPerYear: 0.012,
  /** Hard ceiling so late careers still get meaningful final chapters. */
  maxChancePerTurn: 0.3,
  /** Turns after a shown downfall event before another can trigger. */
  crisisCooldownTurns: 5,
} as const;
