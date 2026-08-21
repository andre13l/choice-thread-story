/**
 * DAILY UP & DOWN ("Box Office Rush") — the shared survival path.
 *
 * Every UTC date has ONE long ordered chain of films (101 cards → 100
 * comparisons). Everybody plays the identical chain in the identical order:
 * the path is a pure function of the date, so historical dates reproduce
 * byte-for-byte and no session randomness exists.
 *
 * Deliberately client-safe (no `.server` boundary, no network): the daily
 * challenge is fully derivable from the bundled catalogue, so backend
 * availability can never stop the game from starting.
 *
 * Fairness guards kept from the 10-round format:
 *  - only films with a reliable worldwide gross above a recognisability floor;
 *  - consecutive films differ by a clear margin, so no round is a coin flip;
 *  - no repeated film, and no two neighbours from the same franchise.
 */
import { MOVIES, type Movie } from "@/games/higherlower/data/movies";
import { dailyNumber, mulberry32, seedFromString } from "@/games/core/daily";
import { UPDOWN_PATH_LENGTH, type UpDownCard, type UpDownPrompt } from "./types";

/** Recognisability floor: every card is at least a wide theatrical hit. */
const MIN_GROSS_M = 80;

/** A comparison is only fair when one film out-grossed the other by this much. */
const MIN_RATIO = 1.25;
/** Beyond this the answer is trivial; keeps the early run interesting. */
const MAX_RATIO = 40;

/** Locale-independent ordering — `localeCompare` differs between runtimes. */
const POOL: Movie[] = MOVIES.filter(
  (m) => Number.isFinite(m.boxOfficeM) && m.boxOfficeM >= MIN_GROSS_M,
).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export function franchiseKey(title: string): string {
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

/**
 * The ordered films for a date: index 0 is the opening reference, then one
 * film per comparison. Length is `UPDOWN_PATH_LENGTH + 1` whenever the pool
 * allows it, which it comfortably does.
 */
export function upDownSequence(date: string, length = UPDOWN_PATH_LENGTH): Movie[] {
  const rand = mulberry32(seedFromString(`nircosi.updown|${date}`));

  const usedIds = new Set<string>();
  const usedFranchises = new Set<string>();
  const picked: Movie[] = [];

  const first = POOL[Math.floor(rand() * POOL.length)]!;
  picked.push(first);
  usedIds.add(first.id);
  usedFranchises.add(franchiseKey(first.title));

  for (let round = 0; round < length; round++) {
    const current = picked[picked.length - 1]!;
    const fresh = POOL.filter((m) => !usedIds.has(m.id));
    const unseenFranchise = fresh.filter((m) => !usedFranchises.has(franchiseKey(m.title)));

    // Progressive relaxation: a round can never fail to find a candidate.
    const tiers: Movie[][] = [
      unseenFranchise.filter(
        (m) =>
          ratio(m.boxOfficeM, current.boxOfficeM) >= MIN_RATIO &&
          ratio(m.boxOfficeM, current.boxOfficeM) <= MAX_RATIO,
      ),
      unseenFranchise.filter((m) => ratio(m.boxOfficeM, current.boxOfficeM) >= MIN_RATIO),
      fresh.filter((m) => ratio(m.boxOfficeM, current.boxOfficeM) >= MIN_RATIO),
      unseenFranchise,
      fresh,
    ];
    const candidates = tiers.find((tier) => tier.length > 0);
    if (!candidates || candidates.length === 0) break;

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

export function loadUpDownPrompt(date: string, length = UPDOWN_PATH_LENGTH): UpDownPrompt {
  const cards: UpDownCard[] = upDownSequence(date, length).map((m) => ({
    key: cardKey(date, m.id),
    title: m.title,
    year: m.year,
    grossM: Math.round(m.boxOfficeM * 10) / 10,
  }));
  return { date, number: dailyNumber(date), cards, total: cards.length - 1 };
}
