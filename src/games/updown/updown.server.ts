/**
 * DAILY UP & DOWN ("Box Office Rush") — deterministic daily selection.
 *
 * Eleven films a day: an opening reference plus ten rounds. For each round the
 * player says whether the next film made MORE or LESS worldwide than the one
 * on screen. Everything is a pure function of the UTC date, so every player
 * gets the same sequence in the same order with no stored row.
 *
 * Fairness rules baked into the selection:
 *  - only films with a reported worldwide gross above a floor (no zeros, no
 *    missing or obviously unreliable values);
 *  - consecutive films must differ by a clear margin, so no round is a
 *    coin-flip between two effectively equal numbers;
 *  - no repeated film and no two entries from the same franchise, which would
 *    read as the same question twice.
 */
import { MOVIES, type Movie } from "@/games/higherlower/data/movies";
import { dailyNumber, mulberry32, seedFromString } from "@/games/core/daily";
import { UPDOWN_ROUNDS, type UpDownCard, type UpDownPrompt } from "./types";

/** Below this a "worldwide gross" is usually a partial or unreliable figure. */
const MIN_GROSS_M = 20;

/** A round is only fair when one film out-grossed the other by this much. */
const MIN_RATIO = 1.25;
/** Beyond this the answer is trivial; keeps the run interesting. */
const MAX_RATIO = 40;

const POOL: Movie[] = MOVIES.filter(
  (m) => Number.isFinite(m.boxOfficeM) && m.boxOfficeM >= MIN_GROSS_M,
).sort((a, b) => a.id.localeCompare(b.id));

function franchiseKey(title: string): string {
  return title
    .toLowerCase()
    .split(/[:–—]/)[0]!
    .replace(/\b(part|chapter|episode|vol\.?|volume)\b.*$/, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ratio(a: number, b: number): number {
  return a > b ? a / b : b / a;
}

/** The eleven films for a date: index 0 is the opening reference. */
export function upDownSequence(date: string): Movie[] {
  const rand = mulberry32(seedFromString(`nircosi.updown|${date}`));

  const usedIds = new Set<string>();
  const usedFranchises = new Set<string>();
  const picked: Movie[] = [];

  const first = POOL[Math.floor(rand() * POOL.length)]!;
  picked.push(first);
  usedIds.add(first.id);
  usedFranchises.add(franchiseKey(first.title));

  for (let round = 0; round < UPDOWN_ROUNDS; round++) {
    const current = picked[picked.length - 1]!;
    let candidates = POOL.filter(
      (m) =>
        !usedIds.has(m.id) &&
        !usedFranchises.has(franchiseKey(m.title)) &&
        ratio(m.boxOfficeM, current.boxOfficeM) >= MIN_RATIO &&
        ratio(m.boxOfficeM, current.boxOfficeM) <= MAX_RATIO,
    );
    if (candidates.length === 0) {
      // Relax the upper bound before ever relaxing the fairness margin.
      candidates = POOL.filter(
        (m) =>
          !usedIds.has(m.id) &&
          !usedFranchises.has(franchiseKey(m.title)) &&
          ratio(m.boxOfficeM, current.boxOfficeM) >= MIN_RATIO,
      );
    }
    const next = candidates[Math.floor(rand() * candidates.length)]!;
    picked.push(next);
    usedIds.add(next.id);
    usedFranchises.add(franchiseKey(next.title));
  }

  return picked;
}

/** Opaque, date-scoped card key. */
export function cardKey(date: string, id: string): string {
  return seedFromString(`updown|${date}|${id}`).toString(36);
}

export function loadUpDownPrompt(date: string): UpDownPrompt {
  const cards: UpDownCard[] = upDownSequence(date).map((m) => ({
    key: cardKey(date, m.id),
    title: m.title,
    year: m.year,
    grossM: Math.round(m.boxOfficeM * 10) / 10,
  }));
  return { date, number: dailyNumber(date), cards, total: UPDOWN_ROUNDS };
}
