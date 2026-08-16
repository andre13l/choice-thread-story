/**
 * Data-integrity checks for the CONNECT prototype graph. Runnable as a
 * script (`bun src/games/connect/validate.ts`) and importable by tests.
 */

import {
  areCoStars,
  generateChallenge,
  shortestClicks,
  shortestPath,
  type Graph,
} from "./graph";
import { loadGraph } from "./data/dataset";
import { dailyChallenge, dailyNumber, dailyPool } from "./daily";

export interface ValidationReport {
  people: number;
  movies: number;
  credits: number;
  largestComponent: number;
  connectedRatio: number;
  hubPeople: number;
  errors: string[];
}

function largestComponent(graph: Graph): number {
  const seen = new Set<string>();
  let biggest = 0;
  for (const start of graph.personIds) {
    if (seen.has(start)) continue;
    let size = 0;
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const id = stack.pop()!;
      size++;
      for (const movieId of graph.peopleById[id]!.movieIds) {
        for (const other of graph.moviesById[movieId]!.personIds) {
          if (!seen.has(other)) {
            seen.add(other);
            stack.push(other);
          }
        }
      }
    }
    biggest = Math.max(biggest, size);
  }
  return biggest;
}

export function validateGraph(graph: Graph): ValidationReport {
  const errors: string[] = [];
  let credits = 0;

  for (const movie of Object.values(graph.moviesById)) {
    if (movie.personIds.length < 2) errors.push(`movie ${movie.id} has < 2 credits`);
    for (const personId of movie.personIds) {
      credits++;
      const person = graph.peopleById[personId];
      if (!person) errors.push(`dangling person id ${personId} on ${movie.id}`);
      else if (!person.movieIds.includes(movie.id)) errors.push(`edge not mirrored: ${personId} <-> ${movie.id}`);
    }
  }
  for (const person of Object.values(graph.peopleById)) {
    if (!person.movieIds.length) errors.push(`person ${person.id} has no credits`);
    for (const movieId of person.movieIds) {
      if (!graph.moviesById[movieId]) errors.push(`dangling movie id ${movieId} on ${person.id}`);
    }
  }

  const biggest = largestComponent(graph);
  const ratio = biggest / graph.personIds.length;
  if (ratio < 0.9) errors.push(`largest component only covers ${(ratio * 100).toFixed(1)}% of people`);

  const hubPeople = graph.personIds.filter((id) => graph.peopleById[id]!.movieIds.length >= 3).length;
  if (hubPeople < 30) errors.push(`only ${hubPeople} people with 3+ credits`);

  // Challenge generator contract: never co-stars, always inside the window,
  // and the reported optimum always matches an actual shortest path.
  let rng = 12345;
  const random = () => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 200; i++) {
    const c = generateChallenge(graph, { random });
    if (areCoStars(graph, c.startId, c.targetId)) errors.push(`challenge ${i}: direct co-stars`);
    if (c.best < 4 || c.best > 8) errors.push(`challenge ${i}: best ${c.best} outside 4-8`);
    const path = shortestPath(graph, c.startId, c.targetId);
    if (!path || path.length - 1 !== c.best) errors.push(`challenge ${i}: best mismatch`);
    if (shortestClicks(graph, c.startId, c.targetId) !== c.best) errors.push(`challenge ${i}: unstable BFS`);
  }

  return {
    people: graph.personIds.length,
    movies: graph.movieIds.length,
    credits,
    largestComponent: biggest,
    connectedRatio: ratio,
    hubPeople,
    errors,
  };
}

/**
 * Mainstream credits a player would immediately notice as missing. These are
 * assertions against the shipped snapshot, not aspirations.
 */
export const KNOWN_CREDITS: Array<[string, string[]]> = [
  [
    "Spider-Man: No Way Home",
    ["Jamie Foxx", "Willem Dafoe", "Alfred Molina", "Andrew Garfield", "Tobey Maguire"],
  ],
  ["Django Unchained", ["Jamie Foxx"]],
  ["Oppenheimer", ["Cillian Murphy"]],
  ["Barbie", ["Margot Robbie"]],
  ["The Wolf of Wall Street", ["Leonardo DiCaprio", "Margot Robbie"]],
  ["Pulp Fiction", ["Samuel L. Jackson", "John Travolta"]],
];

/** Reports missing credits rather than silently passing. */
export function validateKnownCredits(graph: Graph): string[] {
  const errors: string[] = [];
  for (const [title, actors] of KNOWN_CREDITS) {
    const movie = Object.values(graph.moviesById).find((m) => m.title === title);
    if (!movie) {
      errors.push(`film not in catalogue: ${title}`);
      continue;
    }
    const cast = new Set(movie.personIds.map((id) => graph.peopleById[id]!.name));
    for (const actor of actors) {
      if (!cast.has(actor)) errors.push(`${title}: missing ${actor}`);
    }
  }
  return errors;
}

/**
 * Daily Connect contract: one pair per UTC date, identical on repeat calls,
 * different the next day, famous endpoints, reachable, never co-stars.
 */
export function validateDaily(graph: Graph, dates: string[]): string[] {
  const errors: string[] = [];
  const pool = new Set(dailyPool(graph).map((star) => star.id));
  const seenPairs = new Set<string>();

  for (const date of dates) {
    const a = dailyChallenge(graph, date);
    const b = dailyChallenge(graph, date);
    if (a.startId !== b.startId || a.targetId !== b.targetId) {
      errors.push(`${date}: not deterministic`);
    }
    if (dailyNumber(date) < 1) errors.push(`${date}: daily number below 1`);
    if (!pool.has(a.startId) || !pool.has(a.targetId)) {
      errors.push(`${date}: endpoint outside the recognizable pool`);
    }
    if (areCoStars(graph, a.startId, a.targetId)) errors.push(`${date}: direct co-stars`);
    const clicks = shortestClicks(graph, a.startId, a.targetId);
    if (clicks === null) errors.push(`${date}: unreachable pair`);
    else if (clicks !== a.best) errors.push(`${date}: optimal mismatch`);
    seenPairs.add(`${a.startId}|${a.targetId}`);
  }

  if (dates.length > 3 && seenPairs.size < Math.ceil(dates.length * 0.8)) {
    errors.push(`only ${seenPairs.size} distinct pairs across ${dates.length} dates`);
  }
  return errors;
}

if (typeof process !== "undefined" && process.argv?.[1]?.includes("validate")) {
  const graph = await loadGraph();
  const report = validateGraph(graph);
  const dates = Array.from({ length: 30 }, (_, i) =>
    new Date(Date.UTC(2026, 7, 16) + i * 86_400_000).toISOString().slice(0, 10),
  );
  const dailyErrors = validateDaily(graph, dates);
  const creditErrors = validateKnownCredits(graph);
  console.log({ ...report, dailyErrors, creditErrors });
  if (report.errors.length || dailyErrors.length || creditErrors.length) process.exit(1);
}
