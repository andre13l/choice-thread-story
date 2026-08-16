/**
 * CONNECT — recognizability layer.
 *
 * The traversal graph stays complete: every credited performer is a valid
 * intermediate hop. This module only decides who is famous enough to be a
 * challenge *endpoint*, and how often each should be drawn.
 *
 * The signal is Wikidata sitelink count (how many language Wikipedias write
 * about the person), reinforced by how many Connect films they appear in.
 * No IMDb ratings, no proprietary popularity metrics.
 */

import type { Graph } from "./data/dataset";

export interface StarRating {
  id: string;
  name: string;
  /** 0..1 recognizability. */
  score: number;
}

/** A person must clear all of these to be used as a challenge endpoint. */
export const ENDPOINT_RULES = {
  minNotability: 45,
  minCredits: 3,
} as const;

function score(notability: number, credits: number): number {
  const fame = Math.min(notability / 140, 1);
  const presence = Math.min(credits / 12, 1);
  return Math.min(1, 0.75 * fame + 0.25 * presence);
}

/** Challenge-eligible people, most recognizable first. */
export function challengePool(graph: Graph): StarRating[] {
  const pool: StarRating[] = [];
  for (const id of graph.personIds) {
    const person = graph.peopleById[id]!;
    const credits = person.movieIds.length;
    if (credits < ENDPOINT_RULES.minCredits) continue;
    if (person.notability < ENDPOINT_RULES.minNotability) continue;
    pool.push({ id, name: person.name, score: score(person.notability, credits) });
  }
  pool.sort((a, b) => b.score - a.score);
  return pool;
}

const cache = new WeakMap<Graph, StarRating[]>();

export function cachedChallengePool(graph: Graph): StarRating[] {
  let pool = cache.get(graph);
  if (!pool) {
    pool = challengePool(graph);
    cache.set(graph, pool);
  }
  return pool;
}

/** Weighted draw, favouring the most recognizable names. */
export function pickWeighted(pool: StarRating[], random: () => number = Math.random): string {
  const total = pool.reduce((sum, entry) => sum + entry.score, 0);
  let ticket = random() * total;
  for (const entry of pool) {
    ticket -= entry.score;
    if (ticket <= 0) return entry.id;
  }
  return pool[pool.length - 1]!.id;
}
