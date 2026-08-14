/**
 * Career progression: what a film does to a director.
 *
 * Rise, fall and comeback are all consequences of results — there is no
 * separate downfall deck. The offer screen carries the news.
 */

import { createRng } from "../../core/rng";
import { formatMoney } from "../scoring";
import { DIRECTOR_DECLINE, DIRECTOR_LEGEND, DIRECTOR_PACING } from "./config";
import { hashString } from "./names";
import { accessScore, directorTier } from "./offers";
import { ageOf, gapMonths, makeTimeJump, passMonths, yearOf, type TimeJump } from "./pacing";
import type { AwardsRun } from "./awards";
import type { CareerSnapshot, DirectorCareer, FilmResult, Genre, ShareFilm } from "./types";

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

export function newCareer(careerId: number): DirectorCareer {
  return {
    careerId,
    seed: (careerId ^ 0x9e3779b9) >>> 0,
    cycle: 0,
    months: 0,
    year: DIRECTOR_PACING.startYear,
    age: DIRECTOR_PACING.startAge,
    money: DIRECTOR_PACING.startMoney,
    reputation: 4,
    recognition: 0,
    studioTrust: 6,
    prestige: 0,
    oscars: 0,
    nominations: 0,
    momentum: 0,
    genreMastery: {},
    films: [],
    peak: { money: DIRECTOR_PACING.startMoney, recognition: 0, reputation: 4, worldwide: 0, budget: 0 },
    idleCycles: 0,
    legend: false,
    ended: false,
  };
}

/** The awards ladder lives in its own module. */
export { runAwards } from "./awards";
export type { AwardEntry, AwardsRun } from "./awards";


export interface CycleEffects {
  moneyDelta: number;
  reputation: number;
  recognition: number;
  studioTrust: number;
  prestige: number;
  momentum: number;
}

/** Apply a released film to the career. Mutates nothing; returns new state. */
export function applyFilm(
  c: DirectorCareer,
  film: FilmResult,
): { career: DirectorCareer; effects: CycleEffects; jump: TimeJump | null } {
  const r = createRng((hashString(`apply:${film.id}`) ^ c.seed) >>> 0);
  const ratio = film.worldwide / Math.max(1, film.budget);
  const scale = Math.log10(Math.max(10, film.worldwide)) - 5.6; // ~0 at $400k, ~3.4 at $1B

  const repDelta =
    (film.critics - 52) * 0.16 +
    (film.awardsHeat >= 70 ? 4 : 0) +
    (film.verdict === "disaster" ? -6 : 0) +
    (film.theatrical === false ? -1.5 : 0);
  const recDelta = Math.max(-4, scale * 4.2 + (film.verdict === "phenomenon" ? 8 : 0));
  const trustDelta =
    (film.studioResult > 0 ? Math.min(16, 3 + Math.log10(Math.max(1, film.studioResult)) * 1.6) : -1) +
    (film.studioResult < 0 ? -Math.min(22, 4 + Math.log10(Math.max(1, -film.studioResult)) * 2.2) : 0) +
    (ratio >= 3 ? 4 : 0);
  const prestigeDelta = (film.awardsHeat - 45) * 0.12 + (film.critics >= 85 ? 3 : 0);
  const momentumDelta =
    (film.studioResult > 0 ? 16 : -14) + (film.critics - 55) * 0.35 + (film.verdict === "sleeper" ? 18 : 0);

  const mastery = { ...c.genreMastery } as Partial<Record<Genre, number>>;
  mastery[film.genre] = clamp((mastery[film.genre] ?? 0) + 8 + (film.critics - 50) * 0.16, 0, 100);

  const money = c.money + film.directorTake;

  // Elastic time: the shoot itself, then whatever downtime the career earns.
  const startMonths = c.months ?? 0;
  const afterRelease = startMonths + film.productionMonths;
  const interim: DirectorCareer = { ...c, momentum: clamp(c.momentum * 0.55 + momentumDelta, -100, 100) };
  const gap = gapMonths(interim, film, accessScore(interim), r);
  const months = afterRelease + gap;
  const tone: "up" | "down" | "flat" =
    film.worldwide > film.budget * 2.5 && film.critics >= 58
      ? "up"
      : film.studioResult < 0
        ? "down"
        : "flat";
  const jump = makeTimeJump(gap, afterRelease, tone, r);

  const career: DirectorCareer = {
    ...c,
    cycle: c.cycle + 1,
    months,
    year: yearOf(months),
    age: ageOf(months),
    money,
    reputation: clamp(c.reputation + repDelta),
    recognition: clamp(c.recognition + recDelta - 1.2),
    studioTrust: clamp(c.studioTrust + trustDelta),
    prestige: clamp(c.prestige + prestigeDelta),
    momentum: clamp(c.momentum * 0.55 + momentumDelta, -100, 100),
    genreMastery: mastery,
    films: [...c.films, film],
    idleCycles: 0,
    peak: {
      money: Math.max(c.peak.money, money),
      recognition: Math.max(c.peak.recognition, clamp(c.recognition + recDelta)),
      reputation: Math.max(c.peak.reputation, clamp(c.reputation + repDelta)),
      worldwide: Math.max(c.peak.worldwide, film.worldwide),
      budget: Math.max(c.peak.budget, film.budget),
    },
  };

  return {
    career,
    jump,
    effects: {
      moneyDelta: film.directorTake,
      reputation: Math.round(repDelta),
      recognition: Math.round(recDelta),
      studioTrust: Math.round(trustDelta),
      prestige: Math.round(prestigeDelta),
      momentum: Math.round(momentumDelta),
    },
  };
}

export function applyAwards(c: DirectorCareer, awards: AwardsRun): DirectorCareer {
  const films = c.films.map((f) =>
    f.id === awards.filmId
      ? { ...f, nominations: awards.nominations.length, oscars: awards.oscars }
      : f,
  );
  return {
    ...c,
    films,
    nominations: c.nominations + awards.nominations.length,
    oscars: c.oscars + awards.oscars,
    prestige: clamp(
      c.prestige +
        awards.nominations.length * 1.2 +
        awards.academyNominations * 2.5 +
        awards.minorWins * 1.6 +
        awards.oscars * 7,
    ),
    reputation: clamp(
      c.reputation + awards.oscars * 4 + awards.minorWins * 1.2 + (awards.bestDirectorNominated ? 2 : 0),
    ),
    recognition: clamp(c.recognition + awards.oscars * 3 + awards.academyNominations * 0.8),
    studioTrust: clamp(c.studioTrust + awards.oscars * 3 + awards.minorWins),
    momentum: clamp(c.momentum + awards.oscars * 12 + awards.minorWins * 3, -100, 100),
  };
}

/** Passing on everything: a year burns and the town forgets a little. */
export function applyPass(c: DirectorCareer): { career: DirectorCareer; jump: TimeJump | null } {
  const r = createRng((c.seed ^ hashString(`pass:${c.cycle}`)) >>> 0);
  const startMonths = c.months ?? 0;
  const gap = passMonths(c, r);
  const months = startMonths + gap;
  const career: DirectorCareer = {
    ...c,
    cycle: c.cycle + 1,
    months,
    year: yearOf(months),
    age: ageOf(months),
    idleCycles: c.idleCycles + 1,
    recognition: clamp(c.recognition - 4),
    studioTrust: clamp(c.studioTrust - 3),
    momentum: clamp(c.momentum - 12, -100, 100),
    money: c.money - Math.max(20_000, Math.abs(c.money) * 0.03),
  };
  return { career, jump: makeTimeJump(gap, startMonths, "down", r) };
}

/* ------------------------------------------------------------------ */
/* Endings                                                              */
/* ------------------------------------------------------------------ */

export function checkLegend(c: DirectorCareer, rand: number): boolean {
  const e = DIRECTOR_LEGEND.eligibility;
  if (c.films.length < e.films) return false;
  if (c.oscars < e.oscars) return false;
  if (c.reputation < e.reputation) return false;
  if (c.recognition < e.recognition) return false;
  if (c.prestige < e.prestige) return false;
  if (c.age < e.minAge) return false;
  if (c.peak.worldwide < e.peakWorldwide) return false;
  const avg = c.films.reduce((a, f) => a + f.critics, 0) / c.films.length;
  if (avg < e.avgCritics) return false;
  return rand < DIRECTOR_LEGEND.triggerPerCycle;
}

/** Probability the career ends this cycle. Never a fixed clock. */
export function endingChance(c: DirectorCareer): number {
  if (c.films.length < DIRECTOR_DECLINE.minFilms && c.money > DIRECTOR_DECLINE.ruinMoney) return 0;
  let p = DIRECTOR_DECLINE.baseChance;
  const access = accessScore(c);
  if (access < 14) p += 0.09;
  if (c.money < DIRECTOR_DECLINE.ruinMoney) p += 0.16;
  if (c.idleCycles >= 2) p += 0.08 * c.idleCycles;
  if (c.age >= DIRECTOR_DECLINE.ageRampStart) p += (c.age - DIRECTOR_DECLINE.ageRampStart) * DIRECTOR_DECLINE.ageRampPerYear;
  if (c.age >= DIRECTOR_PACING.hardEndAge) return 1;
  if (c.momentum > 40) p *= 0.5;
  return Math.min(DIRECTOR_DECLINE.maxChance, p);
}

export function careerArchetype(c: DirectorCareer): string {
  const t = directorTier(c);
  const avg = c.films.length ? c.films.reduce((a, f) => a + f.critics, 0) / c.films.length : 0;
  const gross = c.films.reduce((a, f) => a + f.worldwide, 0);
  if (c.legend) return "Legend";
  if (c.films.length === 0) return "Never Shot a Frame";
  if (c.money < -1_000_000 && avg >= 68) return "Ruined Visionary";
  if (c.money < -1_000_000) return "Bankrupt Filmmaker";
  if (c.oscars >= 3) return "Academy Favourite";
  if (avg >= 76 && gross < 200_000_000) return "Critics' Director";
  if (avg < 45 && gross >= 1_500_000_000) return "Box Office Machine";
  if (t === "Mogul") return "Hollywood Mogul";
  if (t === "Collapsed") return "Unemployable";
  if (t === "Fading") return "Yesterday's Name";
  if (c.films.some((f) => f.cult)) return "Cult Filmmaker";
  if (c.films.length >= 8) return "Journeyman Director";
  return "Working Director";
}

const FATES: { test: (c: DirectorCareer) => boolean; lines: string[] }[] = [
  {
    test: (c) => c.money < DIRECTOR_DECLINE.ruinMoney,
    lines: [
      "The last film took the house with it. Nobody returns the calls now.",
      "The debt outlived the reviews.",
    ],
  },
  {
    test: (c) => accessScore(c) < 14 && c.peak.budget >= 60_000_000,
    lines: [
      "The offers got smaller until they stopped arriving.",
      "The last meeting was a courtesy, and everyone in the room knew it.",
    ],
  },
  {
    test: (c) => c.age >= DIRECTOR_PACING.softEndAge,
    lines: [
      "The films kept getting made. Then, quietly, they didn't.",
      "A retrospective, a panel, and no green light.",
    ],
  },
  {
    test: () => true,
    lines: [
      "The industry moved on to the next name on the list.",
      "There was always going to be one last film. This was it.",
    ],
  },
];

export function careerFate(c: DirectorCareer): string {
  const r = createRng((c.seed ^ hashString("fate")) >>> 0);
  const entry = FATES.find((f) => f.test(c))!;
  return entry.lines[Math.floor(r() * entry.lines.length)]!;
}

export function careerScore(c: DirectorCareer): number {
  const gross = c.films.reduce((a, f) => a + f.worldwide, 0);
  const avg = c.films.length ? c.films.reduce((a, f) => a + f.critics, 0) / c.films.length : 0;
  const impact = c.films.reduce((a, f) => a + f.culturalImpact, 0);
  return Math.max(
    0,
    Math.round(
      c.oscars * 6200 +
        c.nominations * 900 +
        c.films.length * 420 +
        avg * 220 +
        impact * 95 +
        c.reputation * 190 +
        c.recognition * 150 +
        c.prestige * 170 +
        Math.log10(Math.max(1, gross)) * 2400 +
        Math.log10(Math.max(1, Math.max(0, c.money))) * 900,
    ),
  );
}

export function percentileFor(score: number): number {
  const p = 1 - Math.exp(-Math.pow(score / 52_000, 1.6));
  return Math.min(0.9999, Math.max(0.01, p)) * 100;
}

function toShareFilm(f: FilmResult): ShareFilm {
  return {
    title: f.title,
    year: f.year,
    budget: f.budget,
    worldwide: f.worldwide,
    critics: f.critics,
    oscars: f.oscars,
  };
}

export function snapshot(c: DirectorCareer): CareerSnapshot {
  const score = careerScore(c);
  const films = c.films;
  const byGross = [...films].sort((a, b) => b.worldwide - a.worldwide);
  const best = byGross[0];
  const worst = [...films].sort((a, b) => a.studioResult - b.studioResult)[0];
  const last = films[films.length - 1];
  const n = Math.max(1, films.length);
  const startYear = DIRECTOR_PACING.startYear;
  const endYear = yearOf(c.months ?? 0);
  const topFilms = [...films]
    .sort((a, b) => b.oscars * 3 + b.culturalImpact / 40 - (a.oscars * 3 + a.culturalImpact / 40))
    .slice(0, 3)
    .map(toShareFilm);
  return {
    careerId: c.careerId,
    date: new Date().toISOString(),
    age: c.age,
    startYear,
    endYear,
    spanYears: Math.max(1, endYear - startYear),
    films: films.length,
    oscars: c.oscars,
    nominations: c.nominations,
    totalBoxOffice: films.reduce((a, f) => a + f.worldwide, 0),
    ...(best ? { bestFilm: `${best.title} — ${formatMoney(best.worldwide)}` } : {}),
    avgCritics: Math.round(films.reduce((a, f) => a + f.critics, 0) / n),
    avgAudience: Math.round(films.reduce((a, f) => a + f.audience, 0) / n),
    ...(best ? { biggestHit: toShareFilm(best) } : {}),
    ...(worst ? { biggestFlop: toShareFilm(worst) } : {}),
    ...(last ? { finalFilm: toShareFilm(last) } : {}),
    topFilms,
    peakMoney: c.peak.money,
    finalMoney: c.money,
    score,
    percentile: percentileFor(score),
    archetype: careerArchetype(c),
    legend: c.legend,
    fate: c.fate ?? careerFate(c),
  };
}

