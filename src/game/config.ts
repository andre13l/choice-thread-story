/**
 * PATHS — tuning configuration.
 *
 * Probability configuration lives here, deliberately separated from any UI.
 * Nothing in this file may ever be rendered, hinted at, or leaked to the
 * player-facing interface.
 */

/**
 * TEST_MODE — while true, the hidden final state becomes reachable in roughly
 * 1 of every 30-100 extraordinary careers so we can experience it in
 * development. When false, the architecture targets approximately
 * 1 / 1,000,000 careers across all players (eligibility rarity multiplied by
 * the per-turn trigger below).
 */
export const TEST_MODE = true;

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
export const LEGEND_ELIGIBILITY = {
  legacy: 72,
  culturalImpact: 62,
  industryRespect: 65,
  fame: 82,
  money: 35_000_000,
  oscars: 2,
  movies: 12,
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
