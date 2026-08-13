/**
 * Local movie catalogue — HIGHER / LOWER.
 *
 * The runtime catalogue is the generated snapshot in `./generated`, validated
 * here before gameplay ever sees it. Everything reads through `metricValue`
 * and `moviesForMetric`, so the static array can later be swapped for a
 * backend catalogue without touching call sites.
 *
 * Metrics are worldwide box office, production budget, runtime and release
 * year. There is deliberately no rating metric — no rating or vote-count data
 * is stored, exposed or used anywhere in gameplay.
 */

import { GENERATED_MOVIES } from "./generated/movies.generated";

export type Metric = "boxOffice" | "budget" | "runtime" | "year";

export interface Movie {
  /** Stable catalogue id (IMDb title id), shared with CONNECT. */
  id: string;
  title: string;
  year: number;
  boxOfficeM: number;
  budgetM: number;
  runtimeMin: number;
}

export function metricValue(movie: Movie, metric: Metric): number {
  switch (metric) {
    case "boxOffice":
      return movie.boxOfficeM;
    case "budget":
      return movie.budgetM;
    case "runtime":
      return movie.runtimeMin;
    case "year":
      return movie.year;
  }
}

const CURRENT_YEAR = new Date().getUTCFullYear();

/** A record is only playable when its shared fields are sane. */
function isUsable(movie: Movie): boolean {
  if (!movie.id || !movie.title.trim()) return false;
  // Raw Wikidata QIDs occasionally leak through the snapshot join.
  if (/^Q\d+$/.test(movie.title)) return false;
  if (!Number.isFinite(movie.year) || movie.year < 1900 || movie.year > CURRENT_YEAR + 1) return false;
  if (!Number.isFinite(movie.runtimeMin) || movie.runtimeMin < 40 || movie.runtimeMin > 300) return false;
  return true;
}

function dedupe(movies: Movie[]): Movie[] {
  const byId = new Set<string>();
  const byTitleYear = new Set<string>();
  const out: Movie[] = [];
  for (const movie of movies) {
    const titleYear = `${movie.title.toLowerCase()}|${movie.year}`;
    if (byId.has(movie.id) || byTitleYear.has(titleYear)) continue;
    byId.add(movie.id);
    byTitleYear.add(titleYear);
    out.push(movie);
  }
  return out;
}

/** Validated catalogue. */
export const MOVIES: Movie[] = dedupe(GENERATED_MOVIES.filter(isUsable));

/** True when this film has a usable value for the given metric. */
export function hasMetric(movie: Movie, metric: Metric): boolean {
  const value = metricValue(movie, metric);
  if (!Number.isFinite(value)) return false;
  if (metric === "boxOffice" || metric === "budget") return value > 0;
  return true;
}

const POOLS = new Map<Metric, Movie[]>();

/** Films eligible to be compared under the given metric. */
export function moviesForMetric(metric: Metric): Movie[] {
  let pool = POOLS.get(metric);
  if (!pool) {
    pool = MOVIES.filter((m) => hasMetric(m, metric));
    POOLS.set(metric, pool);
  }
  return pool;
}
