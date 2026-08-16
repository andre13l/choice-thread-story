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

if (typeof process !== "undefined" && process.argv?.[1]?.includes("validate")) {
  const report = validateGraph(await loadGraph());
  console.log(report);
  if (report.errors.length) process.exit(1);
}
