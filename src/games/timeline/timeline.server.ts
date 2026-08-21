/**
 * DAILY TIMELINE — deterministic daily selection.
 *
 * Six recognisable films a day, arranged by the player from oldest to newest
 * theatrical release. Everything here is a pure function of the UTC date, so
 * every player gets the same six films in the same starting order without a
 * stored row. The catalogue is the validated HIGHER / LOWER snapshot: every
 * record already has a sane title and release year, and the snapshot was cut
 * at a recognisability floor, so no obscure entries with dubious dates.
 */
import { MOVIES, type Movie } from "@/games/higherlower/data/movies";
import { dailyNumber, mulberry32, seedFromString, seededShuffle } from "@/games/core/daily";
import {
  TIMELINE_SIZE,
  type TimelinePrompt,
  type TimelineReveal,
  type TimelineRevealCard,
} from "./types";

/** Films before this are too thin on the ground to make fair windows. */
const MIN_YEAR = 1931;

/**
 * Era spread for the day. A wide span is an easy day (decades apart); a tight
 * span is a hard one (same handful of years). Difficulty therefore varies
 * between days without ever producing an unplayable round.
 */
const SPANS = [96, 96, 70, 48, 32, 22];

const POOL: Movie[] = MOVIES.filter((m) => m.year >= MIN_YEAR);

/** Sequels and remakes of the same property read as duplicates — avoid pairs. */
function franchiseKey(title: string): string {
  return title
    .toLowerCase()
    .split(/[:–—]/)[0]!
    .replace(/\b(part|chapter|episode|vol\.?|volume)\b.*$/, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickFrom(candidates: Movie[], rand: () => number): Movie {
  // Prefer the better-known half of the window so cards stay recognisable.
  const ranked = candidates.slice().sort((a, b) => b.boxOfficeM - a.boxOfficeM);
  const head = ranked.slice(0, Math.max(1, Math.ceil(ranked.length * 0.5)));
  return head[Math.floor(rand() * head.length)]!;
}

/** The six films for a date, oldest → newest. */
export function timelineSolution(date: string): Movie[] {
  const rand = mulberry32(seedFromString(`nircosi.timeline|${date}`));

  const minYear = Math.max(MIN_YEAR, Math.min(...POOL.map((m) => m.year)));
  const maxYear = Math.max(...POOL.map((m) => m.year));
  const range = maxYear - minYear;

  const span = Math.min(SPANS[Math.floor(rand() * SPANS.length)]!, range);
  const start = minYear + Math.floor(rand() * (range - span + 1));
  const slice = span / TIMELINE_SIZE;

  const picked: Movie[] = [];
  const usedIds = new Set<string>();
  const usedYears = new Set<number>();
  const usedFranchises = new Set<string>();

  for (let i = 0; i < TIMELINE_SIZE; i++) {
    const lo = Math.round(start + i * slice);
    const hi = Math.round(start + (i + 1) * slice);
    let chosen: Movie | null = null;

    // Widen the window until it yields a usable film; the last pass is the
    // whole catalogue, so this always terminates with six distinct films.
    for (let widen = 0; widen <= 200 && !chosen; widen += 4) {
      const low = lo - widen;
      const high = hi + widen;
      const candidates = POOL.filter(
        (m) =>
          m.year >= low &&
          m.year <= high &&
          !usedIds.has(m.id) &&
          !usedYears.has(m.year) &&
          !usedFranchises.has(franchiseKey(m.title)),
      );
      if (candidates.length > 0) chosen = pickFrom(candidates, rand);
    }
    if (!chosen) {
      chosen = POOL.find(
        (m) => !usedIds.has(m.id) && !usedYears.has(m.year) && !usedFranchises.has(franchiseKey(m.title)),
      )!;
    }

    picked.push(chosen);
    usedIds.add(chosen.id);
    usedYears.add(chosen.year);
    usedFranchises.add(franchiseKey(chosen.title));
  }

  return picked.sort((a, b) => a.year - b.year);
}

/** Opaque, date-scoped card key: carries no chronological signal. */
export function cardKey(date: string, id: string): string {
  return seedFromString(`${date}|${id}`).toString(36);
}

/** Starting order for the board — deterministic, and never already solved. */
export function timelineShuffle(date: string, solution: Movie[]): Movie[] {
  for (let attempt = 0; attempt < 12; attempt++) {
    const order = seededShuffle(solution, seedFromString(`shuffle|${date}|${attempt}`));
    if (order.some((m, i) => m.id !== solution[i]!.id)) return order;
  }
  return solution.slice().reverse();
}

export function loadTimelinePrompt(date: string): TimelinePrompt {
  const solution = timelineSolution(date);
  const cards = timelineShuffle(date, solution).map((m) => ({
    key: cardKey(date, m.id),
    title: m.title,
  }));
  return { date, number: dailyNumber(date), cards, total: TIMELINE_SIZE };
}

export function loadTimelineReveal(date: string): TimelineReveal {
  const solution: TimelineRevealCard[] = timelineSolution(date).map((m) => ({
    key: cardKey(date, m.id),
    title: m.title,
    year: m.year,
  }));
  return { date, number: dailyNumber(date), solution };
}
