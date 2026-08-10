/**
 * PATHS — career scoring, percentile simulation, archetypes, share text.
 *
 * The percentile is a local simulation against a modeled population of
 * careers. When global statistics exist (backend), this module is the swap
 * point — the UI only ever sees { score, percentile }.
 */

import { SITE } from "@/config/site";
import type { CareerStats, GameState } from "./types";

export function computeScore(stats: CareerStats): number {
  const s = stats;
  const earningsComponent = Math.log10(Math.max(1, s.careerEarnings)) * 2600;
  const wealthComponent = Math.log10(Math.max(1, Math.max(0, s.money))) * 1100;
  const raw =
    s.fame * 180 +
    s.peakFame * 120 +
    s.legacy * 520 +
    s.industryRespect * 160 +
    s.reputation * 90 +
    s.culturalImpact * 300 +
    s.oscars * 5200 +
    s.awards * 900 +
    s.movies * 140 +
    s.leadingRoles * 260 +
    s.successfulMovies * 320 -
    s.failedMovies * 180 +
    earningsComponent +
    wealthComponent;
  return Math.max(0, Math.round(raw));
}

/**
 * Simulated percentile. Modeled as a heavily right-skewed population:
 * most careers are unremarkable; the tail is extremely long.
 */
export function computePercentile(score: number): number {
  const p = 1 - Math.exp(-Math.pow(score / 45000, 1.6));
  return Math.min(0.9999, Math.max(0.01, p)) * 100;
}

export function formatPercentile(percentile: number): string {
  const top = 100 - percentile;
  if (top <= 0.01) return "TOP 0.01%";
  return `TOP ${top.toFixed(top < 1 ? 2 : 1)}%`;
}

/**
 * Career archetypes. These describe a path — they are not ranks,
 * and none of them is a win or a loss.
 */
export function careerArchetype(s: GameState): string {
  const st = s.stats;
  const f = s.flags;
  if (st.money < -5_000_000 && f["productionCompany"]) return "Bankrupt Producer";
  if (st.money < -1_000_000) return st.peakFame >= 70 ? "Former Superstar" : "Forgotten Actor";
  if (st.publicPerception < 25 && st.fame > 60) return "Controversial Icon";
  if (st.culturalImpact >= 55 && st.fame < 55) return "Cult Icon";
  if (st.peakFame >= 85 && st.fame < 45) return "Former Superstar";
  if (st.oscars >= 2) return "Award-Winning Actor";
  if (st.oscars >= 1 && st.reputation >= 55) return "Critically Acclaimed";
  if (st.successfulMovies >= 9 && st.careerEarnings >= 150_000_000) return "Box Office King";
  if (st.influence >= 65 && st.money >= 80_000_000) return "Hollywood Mogul";
  if (st.money >= 100_000_000 && st.fame < 35) return "Rich and Forgotten";
  if (st.age >= 63 && st.publicPerception >= 55 && st.reputation >= 50) return "Beloved Veteran";
  if (st.fame < 15 && st.movies < 6) return "Forgotten Actor";
  return "Hollywood Survivor";
}

export function shareText(args: {
  score: number;
  percentile: number;
  movies: number;
  oscars: number;
  peakMoney: number;
}): string {
  return [
    `${SITE.name} — HOLLYWOOD`,
    "",
    `🎬 ${args.movies} Movies`,
    `🏆 ${args.oscars} ${args.oscars === 1 ? "Oscar" : "Oscars"}`,
    `💰 Peak: ${formatMoney(args.peakMoney)}`,
    `⭐ ${args.score.toLocaleString("en-US")} Career Score`,
    `🌎 ${formatPercentile(args.percentile)}`,
    "",
    "What will your path look like?",
  ].join("\n");
}

export function formatMoney(n: number): string {
  const neg = n < 0;
  const abs = Math.abs(n);
  let out: string;
  if (abs >= 1_000_000_000) out = `$${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  else if (abs >= 1_000_000) out = `$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  else if (abs >= 10_000) out = `$${Math.round(abs / 1000)}K`;
  else out = `$${Math.round(abs).toLocaleString("en-US")}`;
  return neg ? `-${out}` : out;
}

export function formatMoneyFull(n: number): string {
  const neg = n < 0;
  return `${neg ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

/**
 * Public career status. This is the ONLY fame framing the HUD shows —
 * the number itself stays visible, but the tier is how it reads.
 */
export function fameTier(fame: number): string {
  if (fame < 5) return "Nobody";
  if (fame < 15) return "Aspiring";
  if (fame < 30) return "Working actor";
  if (fame < 45) return "Recognized";
  if (fame < 60) return "In demand";
  if (fame < 75) return "Star";
  if (fame < 90) return "Superstar";
  return "Icon";
}
