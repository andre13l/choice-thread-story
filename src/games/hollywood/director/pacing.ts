/**
 * Elastic career time.
 *
 * Time serves the filmography, never the other way round. A three-week
 * shoot in a condo does not cost the same year as a franchise tentpole,
 * and a dead career burns years between phone calls.
 *
 * Everything is measured in months elapsed since the career started;
 * year and age are derived, never stored as the source of truth.
 */

import type { Rng } from "../../core/rng";
import { DIRECTOR_PACING } from "./config";
import { range } from "./names";
import type { DirectorCareer, FilmResult, Project } from "./types";

export function yearOf(months: number): number {
  return DIRECTOR_PACING.startYear + Math.floor(months / 12);
}

export function ageOf(months: number): number {
  return DIRECTOR_PACING.startAge + Math.floor(months / 12);
}

/** Months from green light to release. Scope decides. */
export function productionMonths(project: Project, r: Rng, theatrical: boolean): number {
  if (!theatrical) return Math.max(1, Math.round(range(r, 1, 3)));
  const b = project.budget;
  let lo: number;
  let hi: number;
  if (b < 1_500_000) [lo, hi] = [3, 7];
  else if (b < 8_000_000) [lo, hi] = [6, 11];
  else if (b < 35_000_000) [lo, hi] = [10, 16];
  else if (b < 90_000_000) [lo, hi] = [14, 22];
  else if (b < 160_000_000) [lo, hi] = [18, 28];
  else [lo, hi] = [24, 36];
  if (project.prestige >= 72) hi += 3;
  if (project.franchise) lo += 2;
  return Math.round(range(r, lo, hi));
}

/**
 * Downtime after a release. A hit shortens it; a disaster or a dead
 * phone stretches it into years.
 */
export function gapMonths(
  c: DirectorCareer,
  film: FilmResult,
  access: number,
  r: Rng,
): number {
  const great = film.worldwide > film.budget * 2.5 && film.critics >= 58;
  const bad = film.studioResult < 0;

  let lo = 1;
  let hi = 5;
  if (great) [lo, hi] = [1, 4];
  else if (film.verdict === "disaster") [lo, hi] = [10, 30];
  else if (bad) [lo, hi] = [4, 14];

  if (access < 14) {
    lo += 10;
    hi += 26;
  } else if (access < 24) {
    lo += 3;
    hi += 9;
  }
  if (c.momentum < -40) {
    lo += 4;
    hi += 12;
  }
  if (c.age >= 66) hi += 8;
  return Math.max(0, Math.round(range(r, lo, hi)));
}

/** Turning everything down. The town notices, slowly. */
export function passMonths(c: DirectorCareer, r: Rng): number {
  const base = range(r, 6, 18);
  return Math.round(base + (c.momentum < -30 ? range(r, 4, 16) : 0));
}

export interface TimeJump {
  headline: string;
  months: number;
  fromYear: number;
  toYear: number;
  tone: "up" | "down" | "flat";
}

export function formatSpan(months: number): string {
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} later`;
  const years = months / 12;
  const whole = Math.floor(years);
  if (months % 12 === 0) return `${whole} ${whole === 1 ? "year" : "years"} later`;
  if (whole < 3) return `${months} months later`;
  return `${whole} years later`;
}

const DOWN = [
  "The phone stops ringing.",
  "Nobody sends the script over.",
  "The meetings quietly stop being scheduled.",
];
const UP = ["Hollywood noticed.", "Everyone wants the next one.", "The town is calling."];
const FLAT = ["Development.", "The next one takes a while.", "Between pictures."];

/**
 * A transition is only worth a screen when the passage of time is itself
 * news. Short, ordinary gaps stay invisible.
 */
export function makeTimeJump(
  months: number,
  fromMonths: number,
  tone: "up" | "down" | "flat",
  r: Rng,
): TimeJump | null {
  if (months < 12 && !(tone === "up" && months >= 6)) return null;
  const pool = tone === "down" ? DOWN : tone === "up" ? UP : FLAT;
  return {
    headline: pool[Math.floor(r() * pool.length)]!,
    months,
    fromYear: yearOf(fromMonths),
    toYear: yearOf(fromMonths + months),
    tone,
  };
}
