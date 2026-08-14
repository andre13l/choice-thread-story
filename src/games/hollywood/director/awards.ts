/**
 * The awards ecosystem.
 *
 * A career should collect small recognition long before anything
 * academy-level ever happens. Circuits are laddered: festivals and critics
 * groups notice good work early, guilds and international bodies notice
 * strong work, and the Academy-level body is the pinnacle and stays rare.
 *
 * Nothing here is ever explained to the player.
 */

import { createRng } from "../../core/rng";
import { hashString } from "./names";
import type { DirectorCareer, FilmResult, Genre } from "./types";

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Genre bias of traditional major-award bodies. Not player-facing. */
const GENRE_BIAS: Partial<Record<Genre, number>> = {
  Drama: 6,
  Musical: 3,
  Documentary: 1,
  Crime: 1,
  Romance: -2,
  Thriller: -6,
  "Sci-Fi": -11,
  Animation: -8,
  Action: -15,
  Comedy: -14,
  Horror: -17,
  Adult: -90,
  "Music Video": -90,
};

const SPECTACLE = new Set<Genre>(["Action", "Sci-Fi", "Animation"]);

/**
 * 0-100 standing of a film with the traditional major-award bodies.
 * Ordinary films score zero: 50 critics / 44 audience has no prospects.
 */
export function majorAwardScore(a: {
  critics: number;
  culturalImpact: number;
  talent: number;
  genre: Genre;
  /** The project's own prestige ceiling. */
  prestige: number;
  budget: number;
  theatrical: boolean;
  franchise: boolean;
}): number {
  let s =
    (a.critics - 58) * 1.9 +
    (a.prestige - 45) * 0.35 +
    a.talent * 0.1 +
    (a.culturalImpact - 40) * 0.35 +
    (GENRE_BIAS[a.genre] ?? 0);
  if (!a.theatrical) s -= 70;
  if (a.franchise) s -= 20;
  if (a.budget >= 120_000_000) s -= 6;
  // Exceptional cultural weight can drag a genre film into the conversation.
  if (a.culturalImpact >= 78) s += 12;
  return Math.round(clamp(s, 0, 100));
}

/** 0-100 standing in craft/technical categories. Blockbusters live here. */
export function technicalScore(a: {
  budget: number;
  genre: Genre;
  critics: number;
  prodFactor: number;
  franchise: boolean;
  theatrical: boolean;
}): number {
  if (!a.theatrical) return 0;
  const scale = clamp((Math.log10(Math.max(100_000, a.budget)) - 5.6) * 26, 0, 62);
  return Math.round(
    clamp(
      scale + (SPECTACLE.has(a.genre) ? 16 : 0) + (a.franchise ? 6 : 0) + a.prodFactor * 14 + (a.critics - 48) * 0.28,
      0,
      100,
    ),
  );
}

const MAJOR = [
  "Best Film",
  "Best Director",
  "Best Lead Performance",
  "Best Supporting Performance",
  "Best Screenplay",
] as const;

const CRAFT = [
  "Cinematography",
  "Editing",
  "Original Score",
  "Production Design",
  "Costume Design",
  "Sound",
  "Visual Effects",
] as const;

interface Circuit {
  id: string;
  /** Displayed body name. Fictionalised, industry-flavoured. */
  name: string;
  level: number;
  /** Minimum major score to be in play at all. */
  min: number;
  /** Minimum critics score — no body honours a badly reviewed film. */
  minCritics: number;
  maxBudget?: number;
  categories: readonly string[];
  /** Base chance a nominated slot converts to a win. */
  winBase: number;
}

const CIRCUITS: Circuit[] = [
  {
    id: "festival",
    name: "Meridian Film Festival",
    level: 1,
    min: 22,
    minCritics: 60,
    maxBudget: 45_000_000,
    categories: ["Jury Prize", "Audience Award", "Best Director", "Breakthrough Performance"],
    winBase: 0.34,
  },
  {
    id: "critics",
    name: "National Critics Circle",
    level: 2,
    min: 36,
    minCritics: 66,
    categories: [...MAJOR, "Cinematography", "Original Score"],
    winBase: 0.28,
  },
  {
    id: "indie",
    name: "Independent Screen Awards",
    level: 3,
    min: 46,
    minCritics: 68,
    maxBudget: 60_000_000,
    categories: [...MAJOR, "Breakthrough Performance", "Cinematography"],
    winBase: 0.26,
  },
  {
    id: "guild",
    name: "Guild Awards",
    level: 4,
    min: 60,
    minCritics: 70,
    categories: [...MAJOR, ...CRAFT],
    winBase: 0.2,
  },
  {
    id: "intl",
    name: "International Film Prize",
    level: 5,
    min: 68,
    minCritics: 72,
    categories: [...MAJOR, "Cinematography", "Original Score", "Costume Design"],
    winBase: 0.18,
  },
  {
    id: "academy",
    name: "Academy Awards",
    level: 6,
    min: 78,
    minCritics: 74,
    categories: [...MAJOR, ...CRAFT],
    winBase: 0.1,
  },
];

export interface AwardEntry {
  circuit: string;
  level: number;
  category: string;
  won: boolean;
}

/** Awards season payload, when a film earns one. */
export interface AwardsRun {
  filmId: string;
  filmTitle: string;
  entries: AwardEntry[];
  /** Formatted "Body — Category" strings, for the reveal. */
  nominations: string[];
  wins: string[];
  /** Academy-level wins only. */
  oscars: number;
  /** Wins on every other circuit. */
  minorWins: number;
  academyNominations: number;
  bestDirectorNominated: boolean;
  bestPictureNominated: boolean;
  bestDirectorWin: boolean;
  /** One line describing the biggest thing that happened. */
  headline: string;
}

function shuffle<T>(xs: readonly T[], r: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function runAwards(film: FilmResult, c: DirectorCareer): AwardsRun | null {
  if (film.theatrical === false) return null;
  const r = createRng((hashString(`awards:${film.id}`) ^ c.seed) >>> 0);

  const major = film.awardsHeat;
  const tech = film.techHeat ?? 0;
  // Campaign muscle: a respected director with studio backing gets seen.
  const campaign = clamp(c.reputation * 0.0012 + c.studioTrust * 0.0009 + c.prestige * 0.0008, 0, 0.22);
  const visibility = clamp(Math.log10(Math.max(10, film.worldwide)) - 6.4, 0, 0.9) * 0.06;

  const entries: AwardEntry[] = [];

  for (const circuit of CIRCUITS) {
    if (circuit.maxBudget && film.budget > circuit.maxBudget) continue;

    const majorOk = major >= circuit.min && film.critics >= circuit.minCritics;
    // Big craft-driven films get technical attention even without a
    // major-category profile — but only from the bodies that vote on craft.
    const techOk =
      circuit.level >= 4 &&
      tech >= (circuit.level === 6 ? 68 : 52) &&
      film.critics >= 52 &&
      major >= circuit.min - 34;
    if (!majorOk && !techOk) continue;

    const over = majorOk ? major - circuit.min : 0;
    const presence = clamp(
      (majorOk ? 0.24 + over / 42 : 0.1 + (tech - 55) / 220) + campaign + visibility,
      0.02,
      circuit.level >= 6 ? 0.72 : 0.94,
    );
    if (r() > presence) continue;

    const pool = majorOk
      ? shuffle(circuit.categories, r)
      : shuffle(circuit.categories.filter((k) => (CRAFT as readonly string[]).includes(k)), r);
    if (pool.length === 0) continue;

    const slots = Math.max(
      1,
      Math.min(
        circuit.level >= 4 ? 6 : 4,
        Math.round((majorOk ? over / 13 : (tech - 55) / 22) + 1 + r() * 1.3),
      ),
    );

    for (let i = 0; i < slots && i < pool.length; i++) {
      const category = pool[i]!;
      const heavy = category === "Best Film" || category === "Best Director";
      if (heavy && majorOk) {
        // Top categories are their own gate, one tier stricter.
        const p = clamp((major - circuit.min - 6) / 34 + campaign, 0, 0.9);
        if (r() > p) continue;
      }
      const winP = clamp(
        circuit.winBase + (major - circuit.min - 10) / (circuit.level >= 6 ? 120 : 70) - (heavy ? 0.08 : 0),
        0.02,
        circuit.level >= 6 ? 0.4 : 0.62,
      );
      entries.push({ circuit: circuit.name, level: circuit.level, category, won: r() < winP });
    }
  }

  if (entries.length === 0) return null;

  const label = (e: AwardEntry) => `${e.circuit} — ${e.category}`;
  const academy = entries.filter((e) => e.level === 6);
  const wins = entries.filter((e) => e.won);
  const oscars = academy.filter((e) => e.won).length;

  const top = [...entries].sort((a, b) => b.level - a.level || Number(b.won) - Number(a.won))[0]!;
  const headline = top.won
    ? `${top.circuit}: ${top.category}`
    : `${top.circuit}: nominated`;

  return {
    filmId: film.id,
    filmTitle: film.title,
    entries,
    nominations: entries.map(label),
    wins: wins.map(label),
    oscars,
    minorWins: wins.length - oscars,
    academyNominations: academy.length,
    bestDirectorNominated: academy.some((e) => e.category === "Best Director"),
    bestPictureNominated: academy.some((e) => e.category === "Best Film"),
    bestDirectorWin: academy.some((e) => e.category === "Best Director" && e.won),
    headline,
  };
}
