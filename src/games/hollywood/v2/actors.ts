/**
 * HOLLYWOOD V2 — actor bank access, availability, fees, hidden traits.
 *
 * The bank ships as a bundled JSON snapshot built from the catalogue
 * (scripts/hollywood-v2/build-actors.ts). Casting reads it locally — no
 * network per decision — and degrades to a small emergency bank if the
 * fetch fails.
 */

import { hashString } from "../director/names";
import type { ActorEntry, Career, CastChoice, CastSlot } from "./types";
import { budgetScore, accessScore } from "./types";

export interface ActorBank {
  version: string;
  actors: ActorEntry[];
}

let cached: ActorBank | null = null;

export async function loadActorBank(): Promise<ActorBank> {
  if (cached) return cached;
  const res = await fetch(`/data/hollywood-actors.json?v=${cachedVersion()}`);
  if (!res.ok) throw new Error(`actor bank ${res.status}`);
  const raw = (await res.json()) as {
    version: string;
    actors: [string, string, number, string, string, number | null, [string, number][]][];
  };
  cached = {
    version: raw.version,
    actors: raw.actors.map(([id, name, popularity, profile, commons, birthYear, credits]) => ({
      id,
      name,
      popularity,
      profile: profile ?? "",
      commons: commons ?? "",
      birthYear: birthYear ?? 0,
      credits: (credits ?? []).map(([title, year]) => ({ title, year })),
    })),
  };
  return cached;
}

let cachedVersionValue: string | null = null;
function cachedVersion(): string {
  if (!cachedVersionValue) {
    cachedVersionValue = localStorage.getItem("nircosi.hw2.bankv") ?? "1";
  }
  return cachedVersionValue;
}

export function portraitUrl(a: ActorEntry): string {
  if (a.profile) return `https://image.tmdb.org/t/p/w185${a.profile}`;
  if (a.commons)
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(a.commons)}?width=300`;
  return "";
}

/* ------------------------------------------------------------------ */
/* Standing bands                                                      */
/* ------------------------------------------------------------------ */

export type Band = "global" | "star" | "name" | "rising" | "working" | "newcomer";

export function bandOf(popularity: number): Band {
  if (popularity >= 20) return "global";
  if (popularity >= 8) return "star";
  if (popularity >= 3) return "name";
  if (popularity >= 1) return "rising";
  if (popularity >= 0.6) return "working";
  return "newcomer";
}

export function bandLabel(b: Band): string {
  switch (b) {
    case "global": return "Global star";
    case "star": return "Star";
    case "name": return "Known name";
    case "rising": return "Rising";
    case "working": return "Working actor";
    case "newcomer": return "Newcomer";
  }
}

/** Access+budget gate per band. Relationships let you punch above it. */
const BAND_GATE: Record<Band, number> = {
  global: 72,
  star: 52,
  name: 30,
  rising: 12,
  working: 0,
  newcomer: 0,
};

const BAND_ORDER: Band[] = ["newcomer", "working", "rising", "name", "star", "global"];

/* ------------------------------------------------------------------ */
/* Availability + fees                                                 */
/* ------------------------------------------------------------------ */

export function isAvailable(a: ActorEntry, career: Career, budget: number, unknownOnly: boolean): boolean {
  const band = bandOf(a.popularity);
  if (unknownOnly) return band === "newcomer" || band === "working" || band === "rising";
  const rel = career.actorRels[a.id] ?? 0;
  if (rel >= 25) return true; // they owe you one
  const gate = BAND_GATE[band];
  return accessScore(career) + budgetScore(budget) >= gate;
}

export function actorFee(a: ActorEntry, budget: number, kind: CastSlot["kind"]): number {
  const band = bandOf(a.popularity);
  const idx = BAND_ORDER.indexOf(band);
  const pct = [0.006, 0.014, 0.03, 0.055, 0.09, 0.13][idx]!;
  const floor = [1_000, 8_000, 40_000, 350_000, 2_000_000, 10_000_000][idx]!;
  const mult = kind === "lead" ? 1 : kind === "support" ? 0.45 : kind === "voice" ? 0.5 : 0.18;
  const raw = Math.max(floor * mult, budget * pct * mult);
  return Math.round(Math.min(raw, budget * 0.4));
}

/* ------------------------------------------------------------------ */
/* Hidden traits — deterministic per actor                             */
/* ------------------------------------------------------------------ */

function h(id: string, salt: string): number {
  return hashString(`${id}:${salt}`) % 1000;
}

export function talentOf(a: ActorEntry): number {
  return Math.max(20, Math.min(97, 28 + (h(a.id, "talent") % 100) * 0.42 + Math.min(28, a.popularity)));
}

export function drawOf(a: ActorEntry): number {
  return Math.max(0, Math.min(100, a.popularity * 4.6));
}

export function fitOf(a: ActorEntry, genre: string): number {
  return 15 + ((h(a.id, `fit:${genre}`) % 1000) / 1000) * 70;
}

export function volatilityOf(a: ActorEntry): number {
  return (h(a.id, "vol") % 1000) / 10;
}

/* ------------------------------------------------------------------ */
/* Casting candidates                                                  */
/* ------------------------------------------------------------------ */

/**
 * Four attainable candidates per slot, deterministic per (career, film,
 * slot). Recent collaborators surface first; repeat casting builds the
 * relationship the ending screen remembers.
 */
export function castCandidates(
  bank: ActorBank,
  career: Career,
  budget: number,
  genre: string,
  slot: CastSlot,
  filmIndex: number,
  excludeIds: Set<string>,
): CastChoice[] {
  const year = 2026 + Math.floor(career.months / 12);
  const recent = new Set(career.films.slice(-3).flatMap((f) => f.cast.map((c) => c.name)));
  const eligible = bank.actors.filter((a) => {
    if (excludeIds.has(a.id)) return false;
    if (a.birthYear > 0) {
      const age = year - a.birthYear;
      if (age < 16 || age > 92) return false;
    }
    return isAvailable(a, career, budget, !!slot.unknownOnly);
  });
  if (eligible.length === 0) return fallbackCast(budget, slot, filmIndex);

  const score = (a: ActorEntry): number => {
    const rel = career.actorRels[a.id] ?? 0;
    const fit = fitOf(a, genre);
    const novelty = recent.has(a.name) ? -14 : 6;
    const spread = (h(a.id, `pick:${career.seed}:${filmIndex}:${slot.id}`) % 1000) / 25;
    return fit * 0.9 + rel * 0.9 + novelty + spread + Math.min(20, drawOf(a) * 0.18);
  };

  const picked: ActorEntry[] = [];
  const sorted = [...eligible].sort((x, y) => score(y) - score(x));
  // Guarantee band variety: best overall, plus best from lower bands.
  const seenBands = new Set<string>();
  for (const a of sorted) {
    const b = bandOf(a.popularity);
    if (picked.length < 2 || !seenBands.has(b)) {
      picked.push(a);
      seenBands.add(b);
    }
    if (picked.length >= 4) break;
  }

  return picked.map((a) => toChoice(a, career, budget, genre, slot));
}

export function toChoice(
  a: ActorEntry,
  career: Career,
  budget: number,
  genre: string,
  slot: CastSlot,
): CastChoice {
  const rel = career.actorRels[a.id] ?? 0;
  return {
    slotId: slot.id,
    role: slot.role,
    kind: slot.kind,
    actorId: a.id,
    name: a.name,
    image: portraitUrl(a),
    age: a.birthYear > 0 ? 2026 + Math.floor(career.months / 12) - a.birthYear : 0,
    notability: Math.round(a.popularity * 5),
    fee: actorFee(a, budget, slot.kind),
    talent: talentOf(a),
    draw: drawOf(a),
    fit: fitOf(a, genre),
    volatility: volatilityOf(a),
    relNote:
      rel >= 60
        ? "Would walk through glass for you"
        : rel >= 30
          ? "Loves working with you"
          : rel <= -40
            ? "Still angry about last time"
            : rel <= -15
              ? "Cool toward you"
              : undefined,
  };
}

/** Emergency bank if the JSON can't load — the game must still play. */
function fallbackCast(budget: number, slot: CastSlot, filmIndex: number): CastChoice[] {
  const names = ["Jordan Vale", "Sam Okafor", "Riley Marsh", "Alex Duarte"];
  return names.map((name, i) => ({
    slotId: slot.id,
    role: slot.role,
    kind: slot.kind,
    actorId: `fallback:${name}`,
    name,
    image: "",
    age: 34,
    notability: 8,
    fee: Math.round(Math.min(budget * 0.02, 40_000)),
    talent: 45 + ((filmIndex * 13 + i * 29) % 30),
    draw: 6,
    fit: 50,
    volatility: 30,
  }));
}
