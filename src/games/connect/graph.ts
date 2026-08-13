/**
 * CONNECT — pure graph engine. No React, no DOM.
 *
 * The bipartite graph is people <-> movies. One "click" is one hop, so a
 * path Actor -> Movie -> Actor costs 2 clicks. Everything the UI needs is
 * derived here so the data source can later become a database query.
 */

import { RAW_FILMS, type RawFilm } from "./data/films";

export interface Person {
  id: string;
  name: string;
  /** Movie ids, newest first. */
  movieIds: string[];
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  /** Person ids in credited order. */
  personIds: string[];
}

export interface Graph {
  peopleById: Record<string, Person>;
  moviesById: Record<string, Movie>;
  personIds: string[];
  movieIds: string[];
}

export type NodeKind = "person" | "movie";
export interface GraphNode {
  kind: NodeKind;
  id: string;
}

export function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildGraph(films: RawFilm[] = RAW_FILMS): Graph {
  const peopleById: Record<string, Person> = {};
  const moviesById: Record<string, Movie> = {};

  for (const film of films) {
    const movieId = film.id ? `m-${film.id}` : `m-${slug(film.title)}-${film.year}`;
    if (moviesById[movieId]) continue;
    const movie: Movie = { id: movieId, title: film.title, year: film.year, personIds: [] };
    moviesById[movieId] = movie;

    for (const name of film.cast) {
      const personId = `p-${slug(name)}`;
      const person = (peopleById[personId] ??= { id: personId, name, movieIds: [] });
      if (!movie.personIds.includes(personId)) movie.personIds.push(personId);
      if (!person.movieIds.includes(movieId)) person.movieIds.push(movieId);
    }
  }

  for (const person of Object.values(peopleById)) {
    person.movieIds.sort((a, b) => moviesById[b]!.year - moviesById[a]!.year);
  }

  return {
    peopleById,
    moviesById,
    personIds: Object.keys(peopleById),
    movieIds: Object.keys(moviesById),
  };
}

/** Shared prototype graph instance. */
export const GRAPH: Graph = buildGraph();

const key = (n: GraphNode) => `${n.kind}:${n.id}`;

function neighbours(graph: Graph, node: GraphNode): GraphNode[] {
  return node.kind === "person"
    ? (graph.peopleById[node.id]?.movieIds ?? []).map((id) => ({ kind: "movie" as const, id }))
    : (graph.moviesById[node.id]?.personIds ?? []).map((id) => ({ kind: "person" as const, id }));
}

/**
 * Shortest click path between two people, inclusive of both endpoints.
 * Returns null when unreachable. Clicks = path.length - 1.
 */
export function shortestPath(graph: Graph, fromPersonId: string, toPersonId: string): GraphNode[] | null {
  if (!graph.peopleById[fromPersonId] || !graph.peopleById[toPersonId]) return null;
  const start: GraphNode = { kind: "person", id: fromPersonId };
  if (fromPersonId === toPersonId) return [start];

  const prev = new Map<string, GraphNode | null>([[key(start), null]]);
  let frontier: GraphNode[] = [start];

  while (frontier.length) {
    const next: GraphNode[] = [];
    for (const node of frontier) {
      for (const nb of neighbours(graph, node)) {
        const k = key(nb);
        if (prev.has(k)) continue;
        prev.set(k, node);
        if (nb.kind === "person" && nb.id === toPersonId) {
          const path: GraphNode[] = [];
          let cur: GraphNode | null | undefined = nb;
          while (cur) {
            path.unshift(cur);
            cur = prev.get(key(cur));
          }
          return path;
        }
        next.push(nb);
      }
    }
    frontier = next;
  }
  return null;
}

export function shortestClicks(graph: Graph, a: string, b: string): number | null {
  const path = shortestPath(graph, a, b);
  return path ? path.length - 1 : null;
}

export function areCoStars(graph: Graph, a: string, b: string): boolean {
  const movies = new Set(graph.peopleById[a]?.movieIds ?? []);
  return (graph.peopleById[b]?.movieIds ?? []).some((id) => movies.has(id));
}

export interface Challenge {
  startId: string;
  targetId: string;
  /** BFS optimum in clicks. Never shown before completion. */
  best: number;
}

export interface ChallengeOptions {
  minClicks?: number;
  maxClicks?: number;
  /** Only use people with at least this many credits as endpoints. */
  minCredits?: number;
  /** Pair keys ("a|b") to avoid repeating. */
  avoid?: Set<string>;
  random?: () => number;
}

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Pick a start/target pair that are NOT co-stars and whose optimal route
 * sits inside the requested click window.
 */
export function generateChallenge(graph: Graph, options: ChallengeOptions = {}): Challenge {
  const {
    minClicks = 4,
    maxClicks = 8,
    minCredits = 3,
    avoid = new Set<string>(),
    random = Math.random,
  } = options;

  const pool = graph.personIds.filter((id) => (graph.peopleById[id]?.movieIds.length ?? 0) >= minCredits);
  const source = pool.length >= 2 ? pool : graph.personIds;

  let fallback: Challenge | null = null;
  for (let attempt = 0; attempt < 600; attempt++) {
    const a = source[Math.floor(random() * source.length)]!;
    const b = source[Math.floor(random() * source.length)]!;
    if (a === b) continue;
    if (avoid.has(pairKey(a, b))) continue;
    if (areCoStars(graph, a, b)) continue;
    const best = shortestClicks(graph, a, b);
    if (best === null) continue;
    if (best >= minClicks && best <= maxClicks) return { startId: a, targetId: b, best };
    if (!fallback && best >= 4) fallback = { startId: a, targetId: b, best };
  }
  if (fallback) return fallback;

  // Exhaustive last resort so the game can never fail to start.
  for (const a of source) {
    for (const b of source) {
      if (a === b || areCoStars(graph, a, b)) continue;
      const best = shortestClicks(graph, a, b);
      if (best !== null && best >= minClicks) return { startId: a, targetId: b, best };
    }
  }
  throw new Error("connect: no valid challenge pair in graph");
}
