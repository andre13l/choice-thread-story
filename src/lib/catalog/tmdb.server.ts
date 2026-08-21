/**
 * TMDB adapter — SERVER ONLY.
 *
 * Auth: Bearer application token read from `TMDB_ACCESS_TOKEN` at call time
 * (never at module scope, never shipped to the browser). Includes retry with
 * exponential backoff, 429 `retry-after` handling and a small concurrency
 * limiter so bulk ingestion stays inside TMDB's rate limits.
 *
 * This product uses the TMDB API but is not endorsed or certified by TMDB.
 */

import type {
  CatalogSource,
  SourceCredit,
  SourceMovie,
  SourcePerson,
} from "./source";

const BASE = "https://api.themoviedb.org/3";
const MAX_ATTEMPTS = 5;

export function tmdbToken(): string | null {
  return process.env["TMDB_ACCESS_TOKEN"] ?? null;
}

export class TmdbAuthMissingError extends Error {
  constructor() {
    super(
      "TMDB_ACCESS_TOKEN is not configured. Add it as a backend secret before running ingestion.",
    );
    this.name = "TmdbAuthMissingError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Minimal promise pool — bounded concurrency without a dependency. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const token = tmdbToken();
  if (!token) throw new TmdbAuthMissingError();

  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let wait = 500;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(wait);
      wait *= 2;
      continue;
    }

    if (response.status === 404) return null;
    if (response.status === 401) throw new Error("TMDB rejected the access token (401).");
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await sleep(Math.max(1000, retryAfter * 1000));
      continue;
    }
    if (response.status >= 500) {
      if (attempt === MAX_ATTEMPTS) throw new Error(`TMDB ${response.status} on ${path}`);
      await sleep(wait);
      wait *= 2;
      continue;
    }
    if (!response.ok) throw new Error(`TMDB ${response.status} on ${path}`);
    return (await response.json()) as T;
  }
  throw new Error(`TMDB request failed after ${MAX_ATTEMPTS} attempts: ${path}`);
}

interface TmdbMovie {
  id: number;
  title: string;
  release_date?: string | null;
  popularity?: number;
  poster_path?: string | null;
}

interface TmdbPerson {
  id: number;
  name: string;
  birthday?: string | null;
  popularity?: number;
  profile_path?: string | null;
  known_for_department?: string;
}

interface TmdbCastEntry extends TmdbPerson {
  character?: string | null;
  order?: number | null;
  credit_id?: string | null;
}

interface TmdbMovieCredit extends TmdbMovie {
  character?: string | null;
  order?: number | null;
  credit_id?: string | null;
}

function year(date?: string | null): number | null {
  if (!date || date.length < 4) return null;
  const value = Number(date.slice(0, 4));
  return Number.isFinite(value) && value > 1870 ? value : null;
}

function toMovie(raw: TmdbMovie): SourceMovie | null {
  const y = year(raw.release_date);
  if (!raw.title || y === null) return null;
  return {
    sourceId: String(raw.id),
    title: raw.title,
    year: y,
    releaseDate: raw.release_date && raw.release_date.length === 10 ? raw.release_date : null,
    popularity: raw.popularity ?? 0,
    posterPath: raw.poster_path ?? null,
  };
}

function toPerson(raw: TmdbPerson): SourcePerson {
  return {
    sourceId: String(raw.id),
    name: raw.name,
    birthYear: year(raw.birthday),
    popularity: raw.popularity ?? 0,
    profilePath: raw.profile_path ?? null,
  };
}

export const tmdbSource: CatalogSource = {
  name: "tmdb",

  async getPerson(sourceId) {
    const raw = await tmdbGet<TmdbPerson>(`/person/${sourceId}`);
    return raw ? toPerson(raw) : null;
  },

  async getPersonMovieCredits(sourceId) {
    const raw = await tmdbGet<{ cast?: TmdbMovieCredit[] }>(`/person/${sourceId}/movie_credits`);
    const out: { movie: SourceMovie; credit: SourceCredit }[] = [];
    for (const entry of raw?.cast ?? []) {
      const movie = toMovie(entry);
      if (!movie) continue;
      out.push({
        movie,
        credit: {
          personSourceId: String(sourceId),
          movieSourceId: movie.sourceId,
          character: entry.character || null,
          order: entry.order ?? null,
          creditId: entry.credit_id ?? null,
        },
      });
    }
    return out;
  },

  async getMovie(sourceId) {
    const raw = await tmdbGet<TmdbMovie>(`/movie/${sourceId}`);
    return raw ? toMovie(raw) : null;
  },

  /** FULL cast — TMDB returns every credited actor, and we keep all of them. */
  async getMovieCast(sourceId) {
    const raw = await tmdbGet<{ cast?: TmdbCastEntry[] }>(`/movie/${sourceId}/credits`);
    return (raw?.cast ?? []).map((entry) => ({
      person: toPerson(entry),
      credit: {
        personSourceId: String(entry.id),
        movieSourceId: String(sourceId),
        character: entry.character || null,
        order: entry.order ?? null,
        creditId: entry.credit_id ?? null,
      },
    }));
  },

  async searchPerson(name) {
    const raw = await tmdbGet<{ results?: TmdbPerson[] }>("/search/person", {
      query: name,
      include_adult: "false",
    });
    const hit = raw?.results?.[0];
    return hit ? toPerson(hit) : null;
  },

  async searchMovie(title, y) {
    const raw = await tmdbGet<{ results?: TmdbMovie[] }>("/search/movie", {
      query: title,
      include_adult: "false",
      ...(y ? { primary_release_year: String(y) } : {}),
    });
    for (const result of raw?.results ?? []) {
      const movie = toMovie(result);
      if (movie && (!y || Math.abs(movie.year - y) <= 1)) return movie;
    }
    return null;
  },
};
