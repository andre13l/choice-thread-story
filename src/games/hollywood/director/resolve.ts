/**
 * Film outcome model.
 *
 * Seeded and reproducible. Commercial and critical results are computed
 * on separate axes on purpose: a film can make a fortune and be despised,
 * or be revered and lose everything.
 */

import { createRng } from "../../core/rng";
import { hashString, noise, range } from "./names";
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
    const openMult = 0.14 + (appeal / 100) * 1.25;
    opening = budget * openMult * range(r, 0.72, 1.32);
    const legs = clamp(1.65 + (audience - 58) / 100 * 2.6 + (critics - 55) / 100 * 0.9, 1.05, 5.8);
    worldwide = opening * legs * range(r, 0.85, 1.25);

    // Genuine long-tail outcomes. Rare, but they must actually happen.
    if (audience >= 74 && budget <= 20_000_000 && r() < 0.14) worldwide *= range(r, 2.2, 5.5);
    if (project.franchise && appeal >= 80 && r() < 0.18) worldwide *= range(r, 1.3, 1.9);
    if (r() < project.risk / 420) worldwide *= range(r, 0.28, 0.55);
    if (critics >= 85 && audience >= 85 && r() < 0.08) worldwide *= range(r, 1.4, 2.4);
  } else {
    // Non-theatrical work: fees, sales and views, not tickets.
    opening = budget * range(r, 0.2, 0.6);
    worldwide = budget * range(r, 0.6, 2.4) * (0.6 + appeal / 160);
  }

  opening = Math.round(opening);
  worldwide = Math.round(worldwide);

  const occupancy = Math.round(
    clamp(14 + appeal * 0.66 + (critics - 50) * 0.12 + noise(r) * 11, 4, 100),
  );

  const studioResult = Math.round(worldwide * (theatrical ? 0.47 : 0.85) - budget);

  let directorTake = project.fee;
  if (project.selfFinanced) {
    directorTake = Math.round(worldwide * 0.55) - (project.personalStake ?? budget);
  } else if (studioResult > 0) {
    const backendRate = career.recognition >= 70 ? 0.035 : career.recognition >= 45 ? 0.018 : 0.007;
    directorTake += Math.round(studioResult * backendRate);
  }

  const profitRatio = worldwide / Math.max(1, budget);
  const verdict = pickVerdict({ theatrical, profitRatio, critics, audience, worldwide, budget, studioResult });

  const cult = verdict === "cult" || (critics >= 68 && studioResult < 0 && audience >= 70);
  const awardsHeat = Math.round(
    clamp(
      critics * 0.6 + project.prestige * 0.24 + talent * 0.16 - (theatrical ? 0 : 55) - (project.franchise ? 18 : 0),
      0,
      100,
    ),
  );
  const culturalImpact = Math.round(
    clamp(
      (Math.log10(Math.max(10, worldwide)) - 5) * 12 + (critics - 50) * 0.3 + (audience - 55) * 0.25 + (cult ? 10 : 0),
      0,
      100,
    ),
  );

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
