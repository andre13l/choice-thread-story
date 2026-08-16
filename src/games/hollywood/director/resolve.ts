/**
 * Film outcome model.
 *
 * Seeded and reproducible. Commercial and critical results are computed
 * on separate axes on purpose: a film can make a fortune and be despised,
 * or be revered and lose everything.
 */

import { createRng } from "../../core/rng";
import { hashString, noise, range } from "./names";
import { rentalsShare, studioResultOf } from "./finance";
import { majorAwardScore, technicalScore } from "./awards";
import { productionMonths, yearOf } from "./pacing";
import type { Actor, Allocation, DirectorCareer, FilmResult, Project, Verdict } from "./types";

const NON_THEATRICAL = new Set(["musicvideo", "commercial", "adult"]);
const SPECTACLE = new Set(["Action", "Sci-Fi", "Animation"]);

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function isTheatrical(project: Project): boolean {
  return !NON_THEATRICAL.has(project.archetype);
}

export function castCost(cast: Actor[]): number {
  return cast.reduce((a, c) => a + c.cost, 0);
}

/** Minimum cast share (percent of budget) needed to pay the chosen cast. */
export function minCastShare(project: Project, cast: Actor[]): number {
  return Math.min(70, Math.ceil((castCost(cast) / Math.max(1, project.budget)) * 100));
}

export function resolveFilm(args: {
  project: Project;
  cast: Actor[];
  alloc: Allocation;
  career: DirectorCareer;
  /** Extra seed salt — dev tools vary this to preview other outcomes. */
  salt?: number;
}): FilmResult {
  const { project, cast, alloc, career } = args;
  const r = createRng((hashString(project.id) ^ (career.seed >>> 1) ^ ((args.salt ?? 0) * 2654435761)) >>> 0);

  const lead = cast[0]!;
  const support = cast[1] ?? cast[0]!;
  const draw = lead.draw * 0.65 + support.draw * 0.35;
  const talent = lead.talent * 0.6 + support.talent * 0.4;
  const fit = lead.fit * 0.6 + support.fit * 0.4;
  const volatility = (lead.volatility + support.volatility) / 2;

  const budget = project.budget;
  const castSpend = (budget * alloc.cast) / 100;
  const prodSpend = (budget * alloc.production) / 100;
  const marketingSpend = (budget * alloc.marketing) / 100;
  const castSat = clamp(castSpend / Math.max(1, castCost(cast)), 0.3, 1.4);

  const idealProd = budget * (SPECTACLE.has(project.genre) ? 0.5 : 0.4);
  const prodFactor = clamp(prodSpend / Math.max(1, idealProd), 0.15, 1.35);
  const idealMkt = budget * (project.commercial >= 60 ? 0.28 : 0.18);
  const mktFactor = clamp(marketingSpend / Math.max(1, idealMkt), 0.1, 1.5);

  const mastery = career.genreMastery[project.genre] ?? 0;
  const craft = clamp(22 + career.reputation * 0.42 + mastery * 0.3 + career.films.length * 0.6, 10, 100);

  let quality =
    0.3 * craft +
    0.24 * (talent * 0.65 + fit * 0.35) +
    0.2 * (prodFactor * 72) +
    0.14 * project.prestige +
    0.12 * (48 + noise(r) * 42);
  quality *= 0.8 + 0.2 * Math.min(1, castSat);
  quality = clamp(quality + noise(r) * (4 + project.risk * 0.12), 2, 100);

  const critics = Math.round(
    clamp(quality * 0.82 + (project.prestige - 42) * 0.26 + noise(r) * (7 + project.risk * 0.2), 2, 99),
  );
  const audience = Math.round(
    clamp(
      quality * 0.5 +
        project.commercial * 0.22 +
        draw * 0.1 +
        18 +
        noise(r) * (8 + project.risk * 0.12) -
        (volatility > 65 ? 4 : 0),
      3,
      99,
    ),
  );

  const appeal = clamp(
    0.3 * project.commercial +
      0.24 * draw +
      0.2 * (mktFactor * 68) +
      0.12 * career.recognition +
      0.14 * (project.franchise ? 88 : 34),
    2,
    100,
  );

  const theatrical = isTheatrical(project);
  const prodMonths = productionMonths(project, r, theatrical);
  let opening = 0;
  let worldwide = 0;

  if (theatrical) {
    /**
     * The run is generated first, the opening weekend is carved out of it.
     * Generating them independently is what used to allow an opening larger
     * than the total gross.
     *
     * Expected gross is a multiple of the budget. Cheap films can multiply
     * their cost many times over; very expensive films almost never do, which
     * is where the real difficulty of a big career lives.
     */
    const scaleRef = Math.max(0.35, budget / 2_000_000);
    /**
     * Break-even is a gross of roughly 2.1x the budget (the studio keeps
     * 47% of the gross). The base multiple therefore sits just under that:
     * a film has to be good, well sold or lucky to make money.
     */
    let baseMultiple = 2.55 * Math.pow(scaleRef, -0.10);
    if (budget >= 80_000_000) baseMultiple *= 0.9;
    if (budget >= 180_000_000) baseMultiple *= 0.92;

    /**
     * DISCOVERY. The first couple of films are allowed to break out more
     * easily than anything later: hope early, expectations later. The bonus
     * decays to nothing by the fourth film.
     */
    const discovery = career.films.length <= 2 ? 1.18 - career.films.length * 0.05 : 1;
    baseMultiple *= discovery;

    const qualityFactor = clamp(
      0.38 + appeal / 78 + (audience - 52) / 130 + (critics - 55) / 320,
      0.2,
      2.4,
    );
    let multiple = baseMultiple * qualityFactor * range(r, 0.84, 1.22);

    // Trajectory. Results do not sit on a smooth curve; the same film can
    // land anywhere from a bomb to a phenomenon.
    const strong = qualityFactor >= 1.05;
    const t = r();
    const early = career.films.length <= 2;
    const bombFloor = (early ? 0.03 : 0.05) + project.risk / 1000;
    if (t < bombFloor) multiple *= range(r, 0.2, 0.5);
    else if (t < (early ? 0.17 : 0.22)) multiple *= range(r, 0.58, 0.85);
    else if (t < 0.74) multiple *= range(r, 0.92, 1.14);
    else if (t < 0.94) multiple *= range(r, 1.25, 1.8) * (strong ? 1.12 : 1);
    else multiple *= range(r, 1.9, 3.4) * (strong ? 1.2 : 1);

    if (project.franchise) multiple = Math.max(multiple, range(r, 1.05, 1.55));
    // Word of mouth on a cheap crowd-pleaser: the classic sleeper.
    if (audience >= 74 && budget <= 20_000_000 && r() < 0.16) multiple *= range(r, 1.6, 3.2);

    worldwide = Math.max(budget * 0.04, budget * multiple);

    // Opening weekend as a share of the eventual run. Front-loaded event
    // films take a bigger slice; leggy word-of-mouth films a much smaller one.
    const frontload = clamp(
      0.3 +
        (project.franchise ? 0.06 : 0) +
        (appeal - 55) / 420 -
        (audience - 55) / 260 -
        (critics - 55) / 700,
      0.08,
      0.42,
    );
    opening = worldwide * frontload * range(r, 0.88, 1.12);
  } else {
    // Non-theatrical work: fees, sales and views, not tickets.
    worldwide = budget * range(r, 0.6, 2.6) * (0.65 + appeal / 150);
    opening = worldwide * range(r, 0.25, 0.6);
  }

  worldwide = Math.round(worldwide);
  // Hard invariant: the first window can never exceed the whole run.
  opening = Math.min(worldwide, Math.round(opening));

  const occupancy = Math.round(
    clamp(14 + appeal * 0.66 + (critics - 50) * 0.12 + noise(r) * 11, 4, 100),
  );

  const studioResult = studioResultOf(worldwide, budget, theatrical);

  let directorTake = project.fee;
  if (project.selfFinanced) {
    // Self-financed: the director IS the studio, so the same rentals share
    // applies. No second formula, ever.
    directorTake = Math.round(worldwide * rentalsShare(theatrical)) - (project.personalStake ?? budget);
  } else if (studioResult > 0) {
    const backendRate = career.recognition >= 70 ? 0.035 : career.recognition >= 45 ? 0.018 : 0.007;
    directorTake += Math.round(studioResult * backendRate);
  }

  const profitRatio = worldwide / Math.max(1, budget);
  const verdict = pickVerdict({ theatrical, profitRatio, critics, audience, worldwide, budget, studioResult });

  const cult = verdict === "cult" || (critics >= 68 && studioResult < 0 && audience >= 70);
  const culturalImpact = Math.round(
    clamp(
      (Math.log10(Math.max(10, worldwide)) - 5) * 12 + (critics - 50) * 0.3 + (audience - 55) * 0.25 + (cult ? 10 : 0),
      0,
      100,
    ),
  );
  const awardsHeat = majorAwardScore({
    critics,
    culturalImpact,
    talent,
    genre: project.genre,
    prestige: project.prestige,
    budget,
    theatrical,
    franchise: !!project.franchise,
  });
  const techHeat = technicalScore({
    budget,
    genre: project.genre,
    critics,
    prodFactor,
    franchise: !!project.franchise,
    theatrical,
  });


  return {
    id: project.id,
    title: project.title,
    genre: project.genre,
    studio: project.studio,
    year: yearOf((career.months ?? 0) + prodMonths),
    productionMonths: prodMonths,
    budget,
    marketingSpend: Math.round(marketingSpend),
    cast: cast.map((a) => ({ name: a.name, status: a.status })),
    occupancy,
    opening,
    worldwide,
    critics,
    audience,
    studioResult,
    directorTake,
    verdict,
    awardsHeat,
    techHeat,
    culturalImpact,
    nominations: 0,
    oscars: 0,
    theatrical,
    ...(cult ? { cult: true } : {}),
    ...(project.franchise ? { franchise: true } : {}),
    ...(project.selfFinanced ? { selfFinanced: true } : {}),
  };
}

function pickVerdict(a: {
  theatrical: boolean;
  profitRatio: number;
  critics: number;
  audience: number;
  worldwide: number;
  budget: number;
  studioResult: number;
}): Verdict {
  const { profitRatio, critics, audience, worldwide, budget, studioResult } = a;
  if (!a.theatrical) return studioResult > 0 ? "modest" : "flop";
  if (worldwide >= 1_000_000_000) return "phenomenon";
  if (profitRatio >= 6 && budget <= 25_000_000) return "sleeper";
  if (profitRatio >= 3.2 && worldwide >= 250_000_000) return "blockbuster";
  if (studioResult > 0 && critics < 45 && audience >= 60) return "crowd-pleaser";
  if (studioResult > 0 && profitRatio >= 2.3) return "hit";
  if (critics >= 78 && studioResult < 0) return "acclaimed-flop";
  if (critics >= 62 && studioResult < 0 && audience >= 66) return "cult";
  if (studioResult < 0 && budget >= 90_000_000 && profitRatio < 1.4) return "disaster";
  if (studioResult < 0 && profitRatio < 1.1) return "flop";
  if (studioResult > 0) return "modest";
  return "flop";
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  phenomenon: "Phenomenon",
  blockbuster: "Blockbuster",
  hit: "Hit",
  sleeper: "Sleeper hit",
  "acclaimed-flop": "Acclaimed, unwatched",
  "crowd-pleaser": "Critic-proof",
  modest: "Modest",
  flop: "Flop",
  disaster: "Disaster",
  cult: "Cult object",
};
