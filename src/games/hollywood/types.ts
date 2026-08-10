/**
 * PATHS — core game types.
 *
 * The event engine is data-driven and path-agnostic: Hollywood is just the
 * first content pack. Music, Football, Business and Racing will reuse the
 * same engine, stats model and resolution rules.
 */

export interface CareerStats {
  age: number;
  /** Net worth in dollars. Can go negative (debt). */
  money: number;
  fame: number; // 0-100
  talent: number; // 0-100, generated at birth, rarely fully visible
  reputation: number; // 0-100 artistic credibility
  connections: number; // 0-100
  influence: number; // 0-100 power inside the industry
  legacy: number; // 0-100 long-term historical weight
  industryRespect: number; // 0-100
  careerEarnings: number; // gross lifetime earnings
  movies: number;
  leadingRoles: number;
  oscars: number;
  awards: number;
  successfulMovies: number;
  failedMovies: number;

  // ---- Hidden attributes. Never displayed directly. ----
  luck: number; // 0-100, fixed at birth
  ego: number; // 0-100
  publicPerception: number; // 0-100 how the public feels
  financialRisk: number; // 0-100 exposure to catastrophic losses
  burnout: number; // 0-100
  culturalImpact: number; // 0-100
  riskTolerance: number; // 0-100, drifts with player's choices

  peakFame: number;
  peakMoney: number;
}

export type StatKey = keyof CareerStats;

/** Flags let events remember earlier decisions across decades. */
export type CareerFlags = Record<string, number | boolean>;

export interface HistoryEntry {
  age: number;
  eventId: string;
  choice: string;
  summary: string;
  moneyDelta: number;
}

export interface GameState {
  stats: CareerStats;
  flags: CareerFlags;
  history: HistoryEntry[];
  turn: number;
  /** Recently shown event ids — avoids immediate repeats. */
  recentEventIds: string[];
  /** Event forced next (follow-up), if any. */
  queuedEventId: string | null;
  /** 0 = none, 1+ = inside the hidden final chain. */
  legendStage: number;
  legendFailed: boolean;
  careerId: number;
}

export interface Outcome {
  /** Narrative text shown on the reveal screen. */
  text: string;
  /** Optional qualitative note ("Hollywood is starting to take you seriously.") */
  note?: string;
  effects?: Partial<CareerStats>;
  /** Absolute money delta in dollars. */
  money?: number;
  /** Multiplicative money change, e.g. -0.45 (divorce). Applied after `money`. */
  moneyPct?: number;
  flags?: CareerFlags;
  /** Queue a specific follow-up event as the next situation. */
  forceEventId?: string;
  /** Relative weight when an option resolves into one of several outcomes. */
  weight?: number;
  /** End the career after this outcome. */
  end?: "career" | "legend";
}

export interface EventOption {
  label: string;
  /** Displayed probability/flavor. Intentionally NOT the full internal math. */
  hint?: string;
  /** Renders the hint in the danger color. */
  danger?: boolean;
  /**
   * Base probability (0-1) of outcomes[0]. outcomes[1] is the failure branch.
   * Omit for a deterministic option (outcomes picked by their `weight`).
   */
  chance?: number;
  /** Dynamic modifiers: contribution = ((stat - 50) / 100) * weight. */
  modifiers?: Partial<Record<StatKey, number>>;
  /** Flags set simply by choosing this option, regardless of result. */
  setFlags?: CareerFlags;
  outcomes: Outcome[];
}

export interface GameEvent {
  id: string;
  /** Small caps kicker, e.g. "Los Angeles". Year is rendered from state. */
  place?: string;
  text: string | ((s: GameState) => string);
  minAge?: number;
  maxAge?: number;
  /** Stat floors/ceilings required for eligibility. */
  minStats?: Partial<CareerStats>;
  maxStats?: Partial<CareerStats>;
  /** Required flag values. Value `false` means the flag must be unset/false. */
  requiresFlags?: CareerFlags;
  excludesFlags?: string[];
  weight: number | ((s: GameState) => number);
  /** Can only appear once per career. */
  once?: boolean;
  tags: string[];
  options: EventOption[];
}

export interface CareerSummary {
  careerId: number;
  date: string;
  score: number;
  percentile: number;
  archetype: string;
  legend: boolean;
  age: number;
  movies: number;
  leadingRoles: number;
  oscars: number;
  awards: number;
  careerEarnings: number;
  peakMoney: number;
  finalMoney: number;
  peakFame: number;
}
