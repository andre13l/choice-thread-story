/**
 * CAREER PRESSURE — why a career ends, and when.
 *
 * Every career accumulates pressure along a handful of families. Pressure
 * is never shown as a number: it decides which crises arrive, which
 * survivable disasters the player can talk their way out of, and which
 * ending finally lands. Nothing here is player-facing text.
 *
 * The product rule the whole module exists to serve: success does not make
 * a career safe. It changes which family is going to kill it.
 */

import { DIRECTOR_PACING, DIRECTOR_PRESSURE } from "./config";
import { accessScore, recentForm } from "./offers";
import type { DirectorCareer } from "./types";

export type PressureFamily =
  | "financial"
  | "studio"
  | "irrelevance"
  | "scandal"
  | "excess"
  | "obsession"
  | "burnout";

export const PRESSURE_FAMILIES: PressureFamily[] = [
  "financial",
  "studio",
  "irrelevance",
  "scandal",
  "excess",
  "obsession",
  "burnout",
];

export type PressureMap = Record<PressureFamily, number>;

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Films in a row, most recent first, that lost the studio money. */
export function losingStreak(c: DirectorCareer): number {
  let n = 0;
  for (let i = c.films.length - 1; i >= 0; i--) {
    if (c.films[i]!.studioResult < 0) n++;
    else break;
  }
  return n;
}

/** 0-100 per family. */
export function computePressure(c: DirectorCareer): PressureMap {
  const access = accessScore(c);
  const form = recentForm(c);
  const films = c.films.length;
  const streak = losingStreak(c);
  const burnedSelf = c.films.filter((f) => f.selfFinanced && f.studioResult < 0).length;
  const bigBudget = c.peak.budget;
  const spent = c.films.reduce((a, f) => a + f.budget, 0);

  const financial =
    (c.money < 0 ? 34 + Math.min(46, Math.log10(Math.max(1, -c.money)) * 9) : 0) +
    (c.money >= 0 && c.money < 250_000 && films >= 3 ? 14 : 0) +
    burnedSelf * 12 +
    (c.money < 1_000_000 && films >= 5 ? 10 : 0);

  const studio =
    streak * 15 +
    (c.studioTrust < 25 ? 22 : c.studioTrust < 40 ? 10 : 0) +
    (bigBudget >= 90_000_000 && streak >= 1 ? 14 : 0) +
    (form < -0.4 ? 14 : 0);

  const irrelevance =
    (access < 18 ? 30 : access < 30 ? 16 : access < 45 ? 6 : 0) +
    c.idleCycles * 11 +
    (c.age >= 58 ? (c.age - 58) * 2.1 : 0) +
    (c.recognition < 20 && films >= 5 ? 12 : 0);

  const scandal =
    (c.instability ?? 0) * 1.3 +
    (c.recognition >= 60 ? 12 : 0) +
    (c.recognition >= 80 ? 14 : 0) +
    (c.momentum < -50 ? 8 : 0);

  const excess =
    (c.money >= 40_000_000 ? 12 : 0) +
    (c.money >= 150_000_000 ? 14 : 0) +
    (bigBudget >= 150_000_000 ? 14 : 0) +
    (c.recognition >= 75 ? 12 : 0) +
    (c.oscars >= 1 ? 8 * Math.min(3, c.oscars) : 0);

  const obsession =
    c.films.filter((f) => f.selfFinanced).length * 15 +
    (c.prestige >= 70 ? 12 : 0) +
    (spent >= 400_000_000 ? 10 : 0) +
    (c.films.filter((f) => f.verdict === "acclaimed-flop").length * 9);

  const burnout =
    Math.max(0, films - 8) * 3.4 +
    (c.age >= 56 ? (c.age - 56) * 2.2 : 0) +
    (c.crisesSurvived ?? 0) * 5;

  return {
    financial: clamp(financial),
    studio: clamp(studio),
    irrelevance: clamp(irrelevance),
    scandal: clamp(scandal),
    excess: clamp(excess),
    obsession: clamp(obsession),
    burnout: clamp(burnout),
  };
}

/** The single loudest pressure right now. */
export function dominantFamily(p: PressureMap): PressureFamily {
  let best: PressureFamily = "irrelevance";
  let bestV = -1;
  for (const f of PRESSURE_FAMILIES) {
    if (p[f] > bestV) {
      bestV = p[f];
      best = f;
    }
  }
  return best;
}

/**
 * Aggregate 0-100. Weighted so that one screaming family matters more than
 * a broad hum of mild trouble.
 */
export function totalPressure(p: PressureMap): number {
  const values = PRESSURE_FAMILIES.map((f) => p[f]).sort((a, b) => b - a);
  return clamp(values[0]! * 0.55 + values[1]! * 0.25 + values[2]! * 0.12 + values[3]! * 0.08);
}

/**
 * Chance the career ends this cycle. Pressure and career length both push;
 * strong current form buys time but never immunity.
 */
export function endingChance(c: DirectorCareer): number {
  const p = computePressure(c);
  const total = totalPressure(p);
  const films = c.films.length;

  if (c.age >= DIRECTOR_PACING.hardEndAge) return 1;
  // A career needs a shape before it can lose it — but true ruin is
  // always allowed to end things early.
  if (films < DIRECTOR_PRESSURE.graceFilms && c.money > DIRECTOR_PRESSURE.ruinMoney && total < 62) return 0;

  const fromPressure = Math.pow(total / 100, 2.1) * DIRECTOR_PRESSURE.pressureWeight;
  const fromLength = Math.max(0, films - DIRECTOR_PRESSURE.lengthRampFilms) * DIRECTOR_PRESSURE.lengthRampPerFilm;
  const fromAge =
    c.age >= DIRECTOR_PRESSURE.ageRampStart
      ? (c.age - DIRECTOR_PRESSURE.ageRampStart) * DIRECTOR_PRESSURE.ageRampPerYear
      : 0;

  let chance = DIRECTOR_PRESSURE.base + fromPressure + fromLength + fromAge;
  if (c.money < DIRECTOR_PRESSURE.ruinMoney) chance += 0.14;
  if (c.momentum > 45) chance *= 0.62;
  if (recentForm(c) > 0.6) chance *= 0.78;
  // A career operating at the very top of the industry is harder to end —
  // which is precisely how the rare escape stays reachable.
  if (c.reputation >= 80 && c.prestige >= 75) chance *= 0.55;
  return Math.min(DIRECTOR_PRESSURE.maxChance, chance);
}

/** Chance a survivable crisis or opportunity interrupts before the next film. */
export function eventChance(c: DirectorCareer): number {
  const total = totalPressure(computePressure(c));
  const films = c.films.length;
  if (films === 0) return 0;
  return Math.min(0.62, 0.2 + total / 260 + Math.min(0.16, films * 0.018));
}
