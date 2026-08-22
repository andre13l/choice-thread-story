/**
 * HOLLYWOOD V2 — career model.
 *
 * The player is a film director starting in 2026. The career is driven by
 * hidden simulation state; the player experiences it through offers,
 * decisions, events, releases, reactions and consequences — never through
 * a dashboard of RPG bars.
 */

export type Genre =
  | "Drama"
  | "Comedy"
  | "Horror"
  | "Thriller"
  | "Action"
  | "Sci-Fi"
  | "Crime"
  | "Romance"
  | "Animation"
  | "Documentary"
  | "Musical";

/** How the work reaches an audience. Decides which outcome screen it gets. */
export type Channel = "theatrical" | "streaming" | "online" | "broadcast";

export type Scale = "micro" | "indie" | "mid" | "major" | "tentpole";

export type ArchetypeId =
  | "music-video"
  | "commercial"
  | "short-film"
  | "tv-episode"
  | "micro-horror"
  | "indie-drama"
  | "documentary"
  | "animation"
  | "comedy"
  | "thriller"
  | "prestige"
  | "franchise"
  | "blockbuster"
  | "sci-fi-epic"
  | "streaming-feature"
  | "passion"
  | "comeback"
  | "awards-vehicle";

/* ------------------------------------------------------------------ */
/* Actors                                                              */
/* ------------------------------------------------------------------ */

/** One row of the generated actor bank (see scripts/hollywood-v2/build-actors). */
export interface ActorEntry {
  id: string;
  name: string;
  /** Wikidata sitelinks — our notability proxy. */
  notability: number;
  /** Wikimedia Commons file name, "" when none. */
  image: string;
  birthYear: number;
  credits: { title: string; year: number }[];
}

export type CastSlotKind = "lead" | "support" | "voice" | "cameo";

export interface CastSlot {
  id: string;
  /** Player-facing role label: "The lead", "The villain", "Voice of the fox". */
  role: string;
  kind: CastSlotKind;
  /** When true, only unknown/working actors are offered. */
  unknownOnly?: boolean;
}

/** A filled slot. Everything needed to render + simulate is snapshotted. */
export interface CastChoice {
  slotId: string;
  role: string;
  kind: CastSlotKind;
  actorId: string;
  name: string;
  image: string;
  age: number;
  notability: number;
  fee: number;
  /** Hidden traits, rolled once at cast time and frozen. */
  talent: number;
  draw: number;
  fit: number;
  volatility: number;
  /** Relationship text shown on the card, when one exists. */
  relNote?: string;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export interface ProjectSpec {
  id: string;
  archetype: ArchetypeId;
  title: string;
  genre: Genre;
  studio: string;
  studioTier: string;
  channel: Channel;
  scale: Scale;
  budget: number;
  /** Guaranteed director fee (self-financed work pays 0). */
  fee: number;
  /** [min,max] months from green light to release. */
  months: [number, number];
  /** Hidden ceilings — never shown as numbers. */
  commercial: number;
  prestige: number;
  risk: number;
  logline: string;
  /** Why this offer, why now — the career reacting. */
  hook: string;
  castSlots: CastSlot[];
  franchise?: boolean;
  selfFinanced?: boolean;
  /** Personal money required up front when self-financed. */
  stake?: number;
}

/** Effects a decision/event choice applies to the in-flight production. */
export interface RunFx {
  quality?: number;
  appeal?: number;
  awards?: number;
  risk?: number;
  /** Dollars added to (negative = cut from) the production budget. */
  budget?: number;
  fee?: number;
  /** Personal money movement (rare, mostly self-financed choices). */
  money?: number;
  burnout?: number;
  momentum?: number;
  flags?: string[];
  /** Relationship movement with a specific actor. */
  rel?: { actorId: string; delta: number }[];
  /** Standing with the producing studio. */
  studioRel?: number;
}

export type Step =
  | { kind: "decision"; id: string }
  | { kind: "cast"; slotId: string }
  | { kind: "event"; eventId?: string };

export interface ProjectRun {
  spec: ProjectSpec;
  steps: Step[];
  step: number;
  quality: number;
  appeal: number;
  awards: number;
  risk: number;
  budget: number;
  fee: number;
  flags: string[];
  cast: CastChoice[];
  /** Short production log used by the release screen. */
  log: string[];
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export type Verdict =
  | "phenomenon"
  | "blockbuster"
  | "hit"
  | "sleeper"
  | "crowd-pleaser"
  | "modest"
  | "acclaimed-flop"
  | "cult"
  | "flop"
  | "disaster"
  /** Non-theatrical verdicts */
  | "streaming-hit"
  | "quiet-drop"
  | "viral"
  | "ignored"
  | "solid-booking";

export interface FilmRecord {
  id: string;
  title: string;
  genre: Genre;
  archetype: ArchetypeId;
  studio: string;
  year: number;
  channel: Channel;
  scale: Scale;
  budget: number;
  marketing: number;
  opening: number;
  worldwide: number;
  critics: number;
  audience: number;
  verdict: Verdict;
  /** Studio's profit/loss (coherent economics, see simulate.ts). */
  studioResult: number;
  /** What the director personally took home. */
  directorTake: number;
  productionMonths: number;
  awardsHeat: number;
  techHeat: number;
  culturalImpact: number;
  nominations: number;
  oscarsWon: number;
  cult?: boolean;
  franchise?: boolean;
  selfFinanced?: boolean;
  cast: { name: string; role: string }[];
  /** Channel-appropriate success line for non-theatrical work. */
  outcomeLine?: string;
}

/* ------------------------------------------------------------------ */
/* Career                                                              */
/* ------------------------------------------------------------------ */

export interface Career {
  v: 3;
  careerId: number;
  seed: number;
  name: string;
  /** Months since January 2026 — the single source of truth for time. */
  months: number;
  /** Projects + passes consumed. Drives deterministic regeneration. */
  cycle: number;

  /* Hidden state — felt through the game, never shown as bars. */
  reputation: number;
  commercialTrust: number;
  prestige: number;
  culturalImpact: number;
  momentum: number; // -100..100
  burnout: number; // 0..100

  /** Personal net worth. Never a studio budget. */
  wealth: number;

  films: FilmRecord[];
  actorRels: Record<string, number>;
  collabs: Record<string, number>;
  /** Per-studio standing, keyed by studio name. */
  studioHeat: Record<string, number>;
  genreCount: Partial<Record<Genre, number>>;
  seenTitles: string[];
  seenEvents: string[];
  seenDecisions: string[];

  oscars: number;
  nominations: number;
  festivalSelections: number;
  minorWins: number;

  peakBudget: number;
  peakWorldwide: number;
  peakWealth: number;
  flopsInRow: number;
  idleCycles: number;

  pending: ProjectRun | null;

  legend: boolean;
  ended: boolean;
  endingTitle?: string;
  fate?: string;
}

export const START_YEAR = 2026;
export const START_AGE = 26;

export function yearOf(months: number): number {
  return START_YEAR + Math.floor(months / 12);
}

export function ageOf(months: number): number {
  return START_AGE + Math.floor(months / 12);
}

export function careerYear(c: Career): number {
  return yearOf(c.months);
}

export function careerAge(c: Career): number {
  return ageOf(c.months);
}

/** Recent form, -1..1, from the last three releases only. */
export function recentForm(c: Career): number {
  const recent = c.films.slice(-3);
  if (recent.length === 0) return 0;
  let total = 0;
  let weight = 0;
  recent.forEach((f, i) => {
    const w = i + 1;
    const ratio = f.worldwide / Math.max(1, f.budget);
    let v: number;
    if (f.verdict === "disaster") v = -1.6;
    else if (f.studioResult < 0) v = ratio < 1.2 ? -1 : -0.5;
    else if (ratio >= 3) v = 1.2;
    else if (ratio >= 2) v = 0.8;
    else v = 0.35;
    if (f.oscarsWon > 0) v += 0.5;
    total += v * w;
    weight += w;
  });
  return Math.max(-1, Math.min(1, total / (weight * 1.15)));
}

/** How much the industry will let this director touch. 0-100. Hidden. */
export function accessScore(c: Career): number {
  const base =
    c.commercialTrust * 0.34 + c.culturalImpact * 0.3 + c.reputation * 0.26 + c.prestige * 0.1;
  return Math.max(
    0,
    Math.min(100, base + c.momentum * 0.12 + recentForm(c) * 9 - c.idleCycles * 3),
  );
}

/** Budget recognizability shorthand used by UI + casting. 0-100. */
export function budgetScore(budget: number): number {
  return Math.max(0, Math.min(100, ((Math.log10(Math.max(10_000, budget)) - 4) / 3.4) * 100));
}
