/**
 * PATHS — core game types.
 *
 * The event engine is data-driven and path-agnostic: Hollywood is just the
 * first content pack. Music, Football, Business and Racing will reuse the
 * same engine, stats model and resolution rules.
 */

import type { Rng } from "../core/rng";

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

/**
 * Downfall families. Terminal events declare one; the downfall engine
 * weighs them against the accumulated shape of the career. Never named
 * anywhere player-facing.
 */
export type DownfallFamily =
  | "financial"
  | "scandal"
  | "irrelevance"
  | "isolation"
  | "feud"
  | "accident"
  | "studio"
  | "legacy";

/** Flags let events remember earlier decisions across decades. */
export type CareerFlags = Record<string, number | boolean | string>;

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
  /** Every event id shown this career. Non-repeatable events are retired. */
  seenEventIds: string[];
  /** Family -> turn a family member was last shown (near-duplicate cooldown). */
  familyTurns: Record<string, number>;
  /** Turns since the last multi-step (rich interaction) event. */
  turnsSinceRich: number;
  /** Event forced next (follow-up), if any. */
  queuedEventId: string | null;
  /** 0 = none, 1+ = inside the hidden final chain. */
  legendStage: number;
  legendFailed: boolean;
  careerId: number;
  /** Produced films (movie-production chains). Seeds future callbacks. */
  films: FilmRecord[];
  /** Turns the downfall pressure has been building. Reset when a terminal event fires. */
  downfallTurns: number;
  /** Cooldown turns remaining before the downfall engine may roll again. */
  downfallCheckTurns: number;
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
  /**
   * May appear more than once per career. Default false: a shown event is
   * retired unless the eligible pool is exhausted. Repeatable events should
   * regenerate their copy per occurrence (see content/fiction.ts) so the
   * player never perceives the same question twice.
   */
  repeatable?: boolean;
  /**
   * Near-duplicate group (auditions, role offers, parties...). Defaults to
   * tags[0]. After one family member appears, the rest cool down for a
   * few turns so similar prompts never cluster.
   */
  family?: string;
  /**
   * Terminal event: an ending situation. Never picked by the normal event
   * pool — only the downfall engine surfaces these, choosing the family
   * whose pressure best matches how the career was lived. Outcomes carry
   * `end: "career"`, except rare survival branches (comeback fuel).
   */
  terminal?: boolean;
  /** Which downfall pressure drives this terminal event's selection. */
  downfallFamily?: DownfallFamily;
  /**
   * Visual treatment for the decision screen. Default is the standard
   * quick-choice list. "call" renders an incoming-call interaction; the
   * event's options map to answer / decline / (optional) third action.
   */
  presentation?: "call";
  tags: string[];
  /**
   * Multi-step interactive sequence. When present, the game loop drives
   * the sequence instead of rendering quick-choice options.
   */
  sequence?: EventSequence;
  /** Quick-choice options. Optional only for sequence events. */
  options?: EventOption[];
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
  /**
   * The final outcome line of the career — how this specific path ended.
   * Shown on the ending screen as the epitaph. Never a victory statement.
   */
  fate?: string;
}

/* ------------------------------------------------------------------ */
/* Interaction system                                                   */
/*                                                                      */
/* An event may declare a `sequence`: an ordered list of interaction    */
/* steps (today: PICK and ALLOCATION; MAP, NEGOTIATION, TIMED and SCENE */
/* slot in as new SequenceStep variants later). The game loop threads a */
/* SequenceContext through the steps and hands it to `resolve`, which   */
/* produces the same Outcome a quick-choice option would.               */
/* ------------------------------------------------------------------ */

/** A labeled trait chip shown on pick cards. Flavor, not spreadsheet. */
export interface PickTrait {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad" | "gold";
}

export interface PickItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  traits?: PickTrait[];
  /** Resolver payload (quality, draw, cost...). Never rendered directly. */
  data?: Record<string, number | string | boolean>;
}

export interface AllocationCategory {
  id: string;
  label: string;
  description?: string;
  /** Minimum percent of the total this category must receive. */
  min?: number;
}

/** Mutable context threaded through a multi-step sequence. */
export interface SequenceContext {
  game: GameState;
  rng: Rng;
  /** stepId -> chosen item id. */
  picks: Record<string, string>;
  /** stepId -> full chosen item (resolver reads data payloads). */
  pickItems: Record<string, PickItem>;
  /** stepId -> categoryId -> percent of total (0-100, sums to 100). */
  allocations: Record<string, Record<string, number>>;
}

export interface SequenceResult {
  outcome: Outcome;
  /** Structured memory of a produced film, for future callbacks. */
  film?: FilmRecord;
}

export type SequenceStep =
  | {
      kind: "pick";
      id: string;
      kicker: string;
      place?: string;
      prompt: string | ((ctx: SequenceContext) => string);
      items: PickItem[];
      confirmVerb?: string;
      /**
       * Card treatment. "cards" is the default cinematic grid; "contract"
       * renders each item as a signable deal memo (studio, terms, fee).
       */
      variant?: "cards" | "contract";
    }
  | {
      kind: "allocation";
      id: string;
      kicker: string;
      place?: string;
      prompt: string | ((ctx: SequenceContext) => string);
      /** Secondary line, e.g. a budget breakdown. */
      note?: (ctx: SequenceContext) => string;
      /** Finite resource total. Deterministic given ctx. */
      total: (ctx: SequenceContext) => number;
      categories: AllocationCategory[];
    };

export interface EventSequence {
  steps: SequenceStep[];
  resolve: (ctx: SequenceContext) => SequenceResult;
}

/**
 * One produced film. The seed of future callbacks: cult revivals,
 * sequels, reunions with the co-star, financial hangovers.
 */
export interface FilmRecord {
  title: string;
  screenplayId: string;
  coStarId: string;
  coStar: string;
  ageAtRelease: number;
  budget: number;
  gross: number;
  /** 0-100 critical reception. */
  critics: number;
  /** Verdict key, e.g. "breakout" | "disaster" | "cult" | ... */
  kind: string;
  cult?: boolean;
  sequelInterest?: boolean;
  awards?: number;
  oscars?: number;
}
