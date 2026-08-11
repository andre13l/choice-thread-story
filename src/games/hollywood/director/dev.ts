/**
 * TEST_MODE career presets. Development only — these never run in
 * production and never touch balance.
 */

import { newCareer } from "./career";
import type { DirectorCareer, FilmResult, Genre } from "./types";

function film(over: Partial<FilmResult>, i: number): FilmResult {
  return {
    id: `dev-${i}`,
    title: `Dev Film ${i + 1}`,
    genre: "Drama" as Genre,
    studio: "Meridian Pictures",
    year: 2006 + i * 2,
    budget: 20_000_000,
    marketingSpend: 5_000_000,
    productionMonths: 14,
    cast: [{ name: "Vera Rask", status: "Name" }],
    occupancy: 60,
    opening: 12_000_000,
    worldwide: 60_000_000,
    critics: 65,
    audience: 68,
    studioResult: 8_000_000,
    directorTake: 1_200_000,
    verdict: "hit",
    awardsHeat: 50,
    culturalImpact: 30,
    nominations: 0,
    oscars: 0,
    theatrical: true,
    ...over,
  };
}

export type PresetId =
  | "unknown"
  | "rising"
  | "studio"
  | "auteur"
  | "mogul"
  | "collapsed"
  | "legend-ready";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "unknown", label: "unknown" },
  { id: "rising", label: "rising" },
  { id: "studio", label: "studio director" },
  { id: "auteur", label: "acclaimed auteur" },
  { id: "mogul", label: "mogul" },
  { id: "collapsed", label: "collapsed" },
  { id: "legend-ready", label: "legend-ready" },
];

export function presetCareer(id: PresetId, careerId: number): DirectorCareer {
  const base = newCareer(careerId);
  const films = (n: number, over: Partial<FilmResult>) =>
    Array.from({ length: n }, (_, i) => film(over, i));

  switch (id) {
    case "rising":
      return {
        ...base,
        cycle: 2,
        age: 30,
        year: 2010,
        money: 900_000,
        reputation: 38,
        recognition: 24,
        studioTrust: 32,
        prestige: 18,
        momentum: 30,
        films: films(2, { budget: 3_000_000, worldwide: 28_000_000, critics: 72 }),
        peak: { money: 900_000, recognition: 24, reputation: 38, worldwide: 28_000_000, budget: 3_000_000 },
      };
    case "studio":
      return {
        ...base,
        cycle: 5,
        age: 38,
        year: 2016,
        money: 14_000_000,
        reputation: 55,
        recognition: 58,
        studioTrust: 66,
        prestige: 34,
        momentum: 25,
        films: films(5, { budget: 70_000_000, worldwide: 260_000_000, critics: 58 }),
        peak: { money: 14_000_000, recognition: 58, reputation: 55, worldwide: 260_000_000, budget: 70_000_000 },
      };
    case "auteur":
      return {
        ...base,
        cycle: 6,
        age: 45,
        year: 2020,
        money: 5_000_000,
        reputation: 88,
        recognition: 52,
        studioTrust: 54,
        prestige: 78,
        oscars: 1,
        nominations: 7,
        momentum: 18,
        films: films(6, { budget: 25_000_000, worldwide: 70_000_000, critics: 88, awardsHeat: 82 }),
        peak: { money: 9_000_000, recognition: 55, reputation: 88, worldwide: 90_000_000, budget: 30_000_000 },
      };
    case "mogul":
      return {
        ...base,
        cycle: 9,
        age: 52,
        year: 2026,
        money: 220_000_000,
        reputation: 62,
        recognition: 92,
        studioTrust: 94,
        prestige: 55,
        oscars: 1,
        nominations: 9,
        momentum: 55,
        films: films(9, { budget: 240_000_000, worldwide: 1_100_000_000, critics: 46, verdict: "phenomenon" }),
        peak: { money: 220_000_000, recognition: 92, reputation: 70, worldwide: 1_400_000_000, budget: 260_000_000 },
      };
    case "collapsed":
      return {
        ...base,
        cycle: 11,
        age: 58,
        year: 2030,
        money: -2_400_000,
        reputation: 22,
        recognition: 18,
        studioTrust: 4,
        prestige: 20,
        oscars: 0,
        nominations: 3,
        momentum: -70,
        idleCycles: 2,
        films: films(11, { budget: 180_000_000, worldwide: 90_000_000, critics: 28, verdict: "disaster" }),
        peak: { money: 60_000_000, recognition: 80, reputation: 64, worldwide: 700_000_000, budget: 200_000_000 },
      };
    case "legend-ready":
      return {
        ...base,
        cycle: 12,
        age: 56,
        year: 2032,
        money: 140_000_000,
        reputation: 95,
        recognition: 92,
        studioTrust: 92,
        prestige: 96,
        oscars: 3,
        nominations: 21,
        momentum: 70,
        films: films(11, { budget: 120_000_000, worldwide: 1_000_000_000, critics: 90, awardsHeat: 92 }),
        peak: { money: 140_000_000, recognition: 92, reputation: 95, worldwide: 1_200_000_000, budget: 180_000_000 },
      };
    case "unknown":
    default:
      return base;
  }
}
