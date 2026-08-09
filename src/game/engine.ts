/**
 * PATHS — event engine.
 *
 * Pure functions. No React. A career is a GameState threaded through
 * pickEvent -> resolveOption -> advance. Content packs (Hollywood today,
 * Music/Football/Business/Racing later) are just arrays of GameEvent data.
 */

import { LEGEND_CONFIG, LEGEND_ELIGIBILITY, PACING, TEST_MODE } from "./config";
import { randInt, pickWeighted, type Rng } from "./rng";
import type {
  CareerStats,
  EventOption,
  GameEvent,
  GameState,
  Outcome,
  StatKey,
} from "./types";

/* ------------------------------------------------------------------ */
/* Career creation                                                     */
/* ------------------------------------------------------------------ */

export function createCareer(seed: number): GameState {
  const rng = () => Math.random();
  void rng;
  const r = createLocal(seed);
  const talent = bellStat(r, 30, 92);
  const luck = bellStat(r, 5, 98);
  const stats: CareerStats = {
    age: PACING.startAge,
    money: 500,
    fame: 0,
    talent,
    reputation: 10,
    connections: 5,
    influence: 0,
    legacy: 0,
    industryRespect: 0,
    careerEarnings: 0,
    movies: 0,
    leadingRoles: 0,
    oscars: 0,
    awards: 0,
    successfulMovies: 0,
    failedMovies: 0,
    luck,
    ego: randInt(r, 20, 55),
    publicPerception: 50,
    financialRisk: 5,
    burnout: 0,
    culturalImpact: 0,
    riskTolerance: randInt(r, 20, 60),
    peakFame: 0,
    peakMoney: 500,
  };
  return {
    stats,
    flags: {},
    history: [],
    turn: 0,
    recentEventIds: [],
    queuedEventId: null,
    legendStage: 0,
    legendFailed: false,
    careerId: seed,
  };
}

function createLocal(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bellStat(r: Rng, min: number, max: number): number {
  const v = (r() + r() + r()) / 3;
  return Math.round(min + v * (max - min));
}

/** One-sentence flavor about the generated character. Never reveals numbers. */
export function characterFlavor(stats: CareerStats): string {
  if (stats.talent >= 78)
    return "People have always stopped talking when you walk into a room. You're not sure why.";
  if (stats.talent >= 60)
    return "High school drama teachers said you had something. They say that to everyone.";
  if (stats.luck >= 80)
    return "Things have a strange way of working out for you. So far.";
  if (stats.talent <= 38)
    return "You've never been the most gifted person in the room. You're here anyway.";
  return "You have a headshot, a duffel bag, and no plan B.";
}

/* ------------------------------------------------------------------ */
/* Eligibility & selection                                             */
/* ------------------------------------------------------------------ */

export function isEligible(event: GameEvent, s: GameState): boolean {
  const st = s.stats;
  if (event.minAge !== undefined && st.age < event.minAge) return false;
  if (event.maxAge !== undefined && st.age > event.maxAge) return false;
  if (event.minStats) {
    for (const [k, v] of Object.entries(event.minStats)) {
      if ((st[k as StatKey] as number) < (v as number)) return false;
    }
  }
  if (event.maxStats) {
    for (const [k, v] of Object.entries(event.maxStats)) {
      if ((st[k as StatKey] as number) > (v as number)) return false;
    }
  }
  if (event.requiresFlags) {
    for (const [k, v] of Object.entries(event.requiresFlags)) {
      const actual = s.flags[k];
      if (v === false) {
        if (actual !== undefined && actual !== false) return false;
      } else if (actual !== v) {
        return false;
      }
    }
  }
  if (event.excludesFlags) {
    for (const k of event.excludesFlags) {
      if (s.flags[k]) return false;
    }
  }
  if (event.once && s.history.some((h) => h.eventId === event.id)) return false;
  if (s.recentEventIds.includes(event.id)) return false;
  return true;
}

export function pickEvent(s: GameState, events: GameEvent[], rng: Rng): GameEvent | null {
  if (s.queuedEventId) {
    const forced = events.find((e) => e.id === s.queuedEventId);
    if (forced) return forced;
  }

  // Hidden final chain: only ever considered when internally eligible.
  // This branch is invisible to the player — the events read as ordinary
  // (if unusual) career situations.
  if (legendEligible(s) && !s.legendFailed && s.legendStage === 0) {
    if (rng() < LEGEND_CONFIG.triggerPerTurn) {
      const start = events.find((e) => e.id === "legend_signal");
      if (start) return start;
    }
  }

  const eligible = events.filter((e) => isEligible(e, s) && e.id !== "legend_signal" && e.id !== "legend_gamble");
  if (eligible.length === 0) return null;
  return pickWeighted(rng, eligible, (e) =>
    typeof e.weight === "function" ? e.weight(s) : e.weight,
  );
}

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

/**
 * The real probability. Displayed hints are flavor; this is the math.
 * Two players making the same choice in the same situation will not get the
 * same real chance — their hidden attributes differ.
 */
export function realChance(option: EventOption, stats: CareerStats): number {
  let p = option.chance ?? 1;
  if (option.modifiers) {
    for (const [k, w] of Object.entries(option.modifiers)) {
      const stat = stats[k as StatKey] as number;
      const normalized = clampStat(k as StatKey, stat);
      p += ((normalized - 50) / 100) * (w as number);
    }
  }
  return Math.min(0.97, Math.max(0.02, p));
}

function clampStat(key: StatKey, value: number): number {
  const unbounded: StatKey[] = ["money", "careerEarnings", "movies", "leadingRoles", "oscars", "awards", "successfulMovies", "failedMovies", "age", "peakFame", "peakMoney"];
  if (unbounded.includes(key)) return Math.min(100, value);
  return Math.min(100, Math.max(0, value));
}

export interface ResolvedChoice {
  option: EventOption;
  outcome: Outcome;
  success: boolean;
}

export function resolveOption(
  s: GameState,
  option: EventOption,
  rng: Rng,
): ResolvedChoice {
  if (option.chance !== undefined && option.outcomes.length >= 2) {
    const p = realChance(option, s.stats);
    const success = rng() < p;
    return { option, outcome: success ? option.outcomes[0]! : option.outcomes[1]!, success };
  }
  const outcome = pickWeighted(rng, option.outcomes, (o) => o.weight ?? 1);
  return { option, outcome, success: true };
}

/* ------------------------------------------------------------------ */
/* Applying outcomes                                                   */
/* ------------------------------------------------------------------ */

const ZERO_TO_HUNDRED: StatKey[] = [
  "fame",
  "talent",
  "reputation",
  "connections",
  "influence",
  "legacy",
  "industryRespect",
  "luck",
  "ego",
  "publicPerception",
  "financialRisk",
  "burnout",
  "culturalImpact",
  "riskTolerance",
];

export function applyOutcome(s: GameState, event: GameEvent, choice: ResolvedChoice): GameState {
  const stats = { ...s.stats };
  const o = choice.outcome;
  if (o.effects) {
    for (const [k, v] of Object.entries(o.effects)) {
      const key = k as StatKey;
      (stats[key] as number) += v as number;
    }
  }
  let moneyDelta = 0;
  if (o.money) {
    stats.money += o.money;
    moneyDelta += o.money;
    if (o.money > 0) stats.careerEarnings += o.money;
  }
  if (o.moneyPct) {
    const delta = Math.round(stats.money * o.moneyPct);
    stats.money += delta;
    moneyDelta += delta;
  }
  for (const key of ZERO_TO_HUNDRED) {
    (stats[key] as number) = Math.min(100, Math.max(0, stats[key] as number));
  }
  stats.peakFame = Math.max(stats.peakFame, stats.fame);
  stats.peakMoney = Math.max(stats.peakMoney, stats.money);

  const flags = { ...s.flags, ...choice.option.setFlags, ...o.flags };
  const history = [
    ...s.history,
    {
      age: stats.age,
      eventId: event.id,
      choice: choice.option.label,
      summary: o.text,
      moneyDelta,
    },
  ];
  return {
    ...s,
    stats,
    flags,
    history,
    queuedEventId: o.forceEventId ?? null,
  };
}

/** Time passes between situations. Success quietly decays; lifestyle costs. */
export function advanceTime(s: GameState, rng: Rng): GameState {
  const stats = { ...s.stats };
  const years = randInt(rng, PACING.yearsPerTurn[0], PACING.yearsPerTurn[1]);
  stats.age += years;

  // Irrelevance drift: fame fades without constant work.
  if (stats.fame > 25) stats.fame = Math.max(0, stats.fame - rng() * 2.2);
  // Burnout eases slowly; ego follows fame.
  stats.burnout = Math.max(0, stats.burnout - rng() * 3);
  stats.ego = Math.min(100, stats.ego + (stats.fame > 60 ? rng() * 1.5 : -rng()));
  // Lifestyle costs scale with wealth and hidden risk appetite.
  if (stats.money > 5_000_000) {
    stats.money -= Math.round(stats.money * 0.004 * (1 + stats.financialRisk / 60));
  } else if (stats.money < 2000 && stats.fame < 10) {
    stats.money += randInt(rng, 150, 600); // survival jobs
  }
  // Longevity slowly builds legacy once respected.
  if (stats.industryRespect > 55) stats.legacy = Math.min(100, stats.legacy + 0.8);

  return {
    ...s,
    stats,
    turn: s.turn + 1,
    recentEventIds: [...s.recentEventIds.slice(-3)],
  };
}

/* ------------------------------------------------------------------ */
/* Endings                                                             */
/* ------------------------------------------------------------------ */

export type EndCheck = "continue" | "career" | "legend";

/** Should this career end now? */
export function checkEnd(s: GameState, rng: Rng): EndCheck {
  const st = s.stats;
  if (st.age >= PACING.hardEndAge) return "career";
  if (st.money < -40_000_000) return "career"; // total ruin
  if (st.burnout >= 100 && rng() < 0.5) return "career";
  if (st.age >= PACING.softEndAge) {
    const p = (st.age - PACING.softEndAge) / 14;
    if (rng() < p) return "career";
  }
  return "continue";
}

/* ------------------------------------------------------------------ */
/* The hidden architecture. Never referenced by any UI copy.           */
/* ------------------------------------------------------------------ */

export function legendEligible(s: GameState): boolean {
  const st = s.stats;
  const E = LEGEND_ELIGIBILITY;
  if (st.legacy < E.legacy) return false;
  if (st.culturalImpact < E.culturalImpact) return false;
  if (st.industryRespect < E.industryRespect) return false;
  if (st.fame < E.fame) return false;
  if (st.money < E.money) return false;
  if (st.oscars < E.oscars) return false;
  if (st.movies < E.movies) return false;
  if (st.age < E.minAge) return false;
  // Requires proof of surviving something enormous, or creating one.
  const survived = Boolean(s.flags["survivedDisaster"]);
  const created = Boolean(s.flags["legendaryFilm"]);
  const TEST_MODE_relax = false;
  void TEST_MODE_relax;
  return survived || created;
}

export { TEST_MODE };
