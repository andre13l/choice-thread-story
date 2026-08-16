/**
 * HOLLYWOOD — director career model.
 *
 * The player directs films. Everything the career "says" is expressed
 * through which projects reach them and how those films perform, so the
 * model keeps commercial and critical standing deliberately separate.
 */

export type Genre =
  | "Horror"
  | "Drama"
  | "Comedy"
  | "Action"
  | "Thriller"
  | "Sci-Fi"
  | "Romance"
  | "Crime"
  | "Animation"
  | "Documentary"
  | "Musical"
  | "Adult"
  | "Music Video";

export type StudioTier =
  | "No-name outfit"
  | "Independent"
  | "Boutique"
  | "Mini-major"
  | "Major studio"
  | "Franchise unit"
  | "Self-financed";

export interface Project {
  id: string;
  archetype: string;
  title: string;
  genre: Genre;
  studio: string;
  studioTier: StudioTier;
  /** Total production budget in dollars (what the player allocates). */
  budget: number;
  /** Guaranteed director fee. */
  fee: number;
  /** 0-100 how big this could get with the right audience. */
  commercial: number;
  /** 0-100 ceiling for critics and awards. */
  prestige: number;
  /** 0-100 variance amplifier. */
  risk: number;
  franchise?: boolean;
  /** The director puts personal money in; losses hit net worth. */
  selfFinanced?: boolean;
  /** Personal money required up front (self-financed projects). */
  personalStake?: number;
  /** Short, non-narrative flavor line. One sentence maximum. */
  logline: string;
  /** Casting constraint copy, when the project demands something. */
  requirement?: string;
  /** Status label used on the offer card. */
  statusLabel: string;
  /** Low-status offers read differently — used for tone, not mechanics. */
  lowStatus?: boolean;
}

export interface Actor {
  id: string;
  name: string;
  /** Star tier label. */
  status: string;
  /** Salary in dollars. */
  cost: number;
  /** 0-100 ticket-selling power. */
  draw: number;
  /** 0-100 craft. */
  talent: number;
  /** 0-100 fit for this project's genre. */
  fit: number;
  /** 0-100 chance of blowing up the set / press cycle. */
  volatility: number;
  note: string;
}

export interface Allocation {
  cast: number;
  production: number;
  marketing: number;
}

export type Verdict =
  | "phenomenon"
  | "blockbuster"
  | "hit"
  | "sleeper"
  | "acclaimed-flop"
  | "crowd-pleaser"
  | "modest"
  | "flop"
  | "disaster"
  | "cult";

export interface FilmResult {
  id: string;
  title: string;
  genre: Genre;
  studio: string;
  year: number;
  budget: number;
  marketingSpend: number;
  cast: { name: string; status: string }[];
  /** Premiere-night turnout, 0-100. */
  occupancy: number;
  opening: number;
  worldwide: number;
  critics: number;
  audience: number;
  /** Studio's financial result on the film. */
  studioResult: number;
  /** What the director personally took home (fee + backend - stake). */
  directorTake: number;
  verdict: Verdict;
  /** Months from green light to release. */
  productionMonths: number;
  /** 0-100 internal awards heat (major categories). */
  awardsHeat: number;
  /** 0-100 internal standing in craft/technical categories. */
  techHeat?: number;
  culturalImpact: number;
  nominations: number;
  oscars: number;
  /** Non-theatrical work (videos, spots) reports revenue, not tickets. */
  theatrical?: boolean;
  cult?: boolean;
  franchise?: boolean;
  selfFinanced?: boolean;
}

export interface DirectorCareer {
  careerId: number;
  seed: number;
  cycle: number;
  /** Months elapsed since the career began. Source of truth for time. */
  months: number;
  year: number;
  age: number;
  /** Personal net worth. Can go negative. */
  money: number;
  /** Industry respect, 0-100. */
  reputation: number;
  /** Audience / global recognition, 0-100. */
  recognition: number;
  /** How much studios will hand you, 0-100. */
  studioTrust: number;
  /** Awards standing, 0-100. */
  prestige: number;
  oscars: number;
  nominations: number;
  /** -100..100 — how the town feels about you right now. */
  momentum: number;
  genreMastery: Partial<Record<Genre, number>>;
  films: FilmResult[];
  peak: {
    money: number;
    recognition: number;
    reputation: number;
    worldwide: number;
    budget: number;
  };
  /** Cycles in a row without a released film. */
  idleCycles: number;
  /** 0-100 tabloid/behaviour heat. Feeds the scandal pressure family. */
  instability?: number;
  /** Survivable disasters already weathered. */
  crisesSurvived?: number;
  /** Career-event ids already used, so nothing repeats within a run. */
  seenEvents?: string[];
  /** Lifetime living costs paid out of net worth. */
  upkeepPaid?: number;
  legend: boolean;
  ended: boolean;
  fate?: string;
  /** Short label for the ending that landed. */
  endingTitle?: string;
}

export interface ShareFilm {
  title: string;
  year: number;
  budget: number;
  worldwide: number;
  critics: number;
  oscars: number;
}

export interface CareerSnapshot {
  careerId: number;
  date: string;
  age: number;
  startYear: number;
  endYear: number;
  spanYears: number;
  films: number;
  oscars: number;
  nominations: number;
  totalBoxOffice: number;
  bestFilm?: string;
  avgCritics: number;
  avgAudience: number;
  biggestHit?: ShareFilm;
  biggestFlop?: ShareFilm;
  finalFilm?: ShareFilm;
  topFilms: ShareFilm[];
  peakMoney: number;
  finalMoney: number;
  score: number;
  percentile: number;
  archetype: string;
  hits: number;
  flops: number;
  legacyTier: string;
  endingTitle?: string;
  legend: boolean;
  fate: string;
}
