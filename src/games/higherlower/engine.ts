/**
 * Pure game engine for HIGHER/LOWER. No React, no DOM, no localStorage.
 */
import type { Rng } from "@/games/core/rng";
import { randInt } from "@/games/core/rng";
import { MOVIES, metricValue, type Metric, type Movie } from "./data/movies";

export type Guess = "higher" | "lower";

export interface RoundResult {
  correct: boolean;
  guess: Guess;
}

export interface RunState {
  metric: Metric;
  known: Movie;
  next: Movie;
  streak: number;
  usedIds: Set<string>;
  lastResult: RoundResult | null;
  gameOver: boolean;
}

const METRIC_LABELS: Record<Metric, string> = {
  boxOffice: "Worldwide box office",
  budget: "Production budget",
  rating: "IMDb rating",
  runtime: "Runtime",
  year: "Release year",
};

export function metricLabel(metric: Metric): string {
  return METRIC_LABELS[metric];
}

/** Draw a random movie not already used in this run. */
function drawMovie(rng: Rng, usedIds: Set<string>, pool: Movie[] = MOVIES): Movie {
  const available = pool.filter((m) => !usedIds.has(m.id));
  const source = available.length > 0 ? available : pool;
  return source[randInt(rng, 0, source.length - 1)]!;
}

/** Draw a random movie whose metric value differs from `value`, not already used. */
function drawDistinctMovie(rng: Rng, usedIds: Set<string>, metric: Metric, value: number): Movie {
  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = drawMovie(rng, usedIds);
    if (metricValue(candidate, metric) !== value) return candidate;
  }
  // Extremely unlikely fallback: search the whole catalogue.
  const fallback = MOVIES.find((m) => metricValue(m, metric) !== value);
  return fallback ?? MOVIES[0]!;
}

export function startRun(metric: Metric, rng: Rng): RunState {
  const known = drawMovie(rng, new Set());
  const usedIds = new Set([known.id]);
  const next = drawDistinctMovie(rng, usedIds, metric, metricValue(known, metric));
  usedIds.add(next.id);
  return { metric, known, next, streak: 0, usedIds, lastResult: null, gameOver: false };
}

export function answer(run: RunState, guess: Guess, rng: Rng): RunState {
  const knownValue = metricValue(run.known, run.metric);
  const nextValue = metricValue(run.next, run.metric);
  const actuallyHigher = nextValue > knownValue;
  const correct = guess === "higher" ? actuallyHigher : !actuallyHigher;

  if (!correct) {
    return { ...run, lastResult: { correct, guess }, gameOver: true };
  }

  const usedIds = new Set(run.usedIds);
  const newKnown = run.next;
  const newNext = drawDistinctMovie(rng, usedIds, run.metric, metricValue(newKnown, run.metric));
  usedIds.add(newNext.id);

  return {
    ...run,
    known: newKnown,
    next: newNext,
    streak: run.streak + 1,
    usedIds,
    lastResult: { correct, guess },
    gameOver: false,
  };
}

export function formatMetricValue(metric: Metric, movie: Movie): string {
  const value = metricValue(movie, metric);
  switch (metric) {
    case "boxOffice":
    case "budget":
      return formatMoney(value);
    case "rating":
      return value.toFixed(1);
    case "runtime":
      return formatRuntime(value);
    case "year":
      return String(value);
  }
}

export function formatMoney(millions: number): string {
  if (millions >= 1000) {
    return `$${(millions / 1000).toFixed(1)}B`;
  }
  return `$${Math.round(millions)}M`;
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export const ALL_METRICS: Metric[] = ["boxOffice", "budget", "rating", "runtime", "year"];
export type { Metric, Movie };
