/**
 * CONNECT — pure graph engine. No React, no DOM, no data loading.
 *
 * The bipartite graph is people <-> movies. One "click" is one hop, so a
 * path Actor -> Movie -> Actor costs 2 clicks.
 */

import type { Graph } from "./data/dataset";
import { challengePool, pickWeighted, type StarRating } from "./popularity";

export type { Graph, Movie, Person } from "./data/dataset";

export type NodeKind = "person" | "movie";
export interface GraphNode {
  kind: NodeKind;
  id: string;
}

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
  /** Pair keys ("a|b") to avoid repeating. */
  avoid?: Set<string>;
  random?: () => number;
  /**
   * Recognizability-weighted endpoint pool. Endpoints are drawn from here;
   * the full graph is still used for traversal, so routes stay rich.
   */
  endpointPool?: StarRating[];
}

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Pick a start/target pair that are NOT co-stars, are both reachable, and
 * whose optimal route sits inside the requested click window.
 */
export function generateChallenge(graph: Graph, options: ChallengeOptions = {}): Challenge {
  const {
    minClicks = 4,
    maxClicks = 8,
    avoid = new Set<string>(),
    random = Math.random,
    endpointPool,
  } = options;

  const pool = endpointPool?.length ? endpointPool : challengePool(graph);
  const draw = (): string => pickWeighted(pool, random);

  let fallback: Challenge | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const a = draw();
    const b = draw();
    if (a === b) continue;
    if (avoid.has(pairKey(a, b))) continue;
    if (areCoStars(graph, a, b)) continue;
    const best = shortestClicks(graph, a, b);
    if (best === null) continue;
    if (best >= minClicks && best <= maxClicks) return { startId: a, targetId: b, best };
    if (!fallback && best >= 2) fallback = { startId: a, targetId: b, best };
  }
  if (fallback) return fallback;

  // Last resort so the game can never fail to start.
  for (const rating of pool) {
    for (const other of pool) {
      if (rating.id === other.id || areCoStars(graph, rating.id, other.id)) continue;
      const best = shortestClicks(graph, rating.id, other.id);
      if (best !== null && best >= 2) return { startId: rating.id, targetId: other.id, best };
    }
  }
  throw new Error("connect: no valid challenge pair in graph");
}

/** Simple ranked search across people and films. */
export interface SearchHit {
  kind: NodeKind;
  id: string;
  label: string;
  sub: string;
}

export function searchGraph(graph: Graph, query: string, limit = 12): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: (SearchHit & { score: number })[] = [];

  const push = (kind: NodeKind, id: string, label: string, sub: string, weight: number) => {
    const lower = label.toLowerCase();
    const at = lower.indexOf(q);
    if (at === -1) return;
    hits.push({ kind, id, label, sub, score: (at === 0 ? 1000 : 400 - at * 4) + weight });
  };

  for (const id of graph.personIds) {
    const p = graph.peopleById[id]!;
    push("person", id, p.name, `${p.movieIds.length} in Connect`, Math.min(p.notability, 200));
  }
  for (const id of graph.movieIds) {
    const m = graph.moviesById[id]!;
    push("movie", id, m.title, String(m.year), Math.min(m.notability, 200));
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...hit }) => hit);
}
