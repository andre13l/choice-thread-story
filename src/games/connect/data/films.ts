/**
 * CONNECT — prototype reference graph.
 *
 * Deliberately authored as a flat list of films with their credited cast,
 * because that mirrors the shape a TMDB ingestion produces (movies + credit
 * edges). `buildGraph()` derives stable person ids from names, so this file
 * can be swapped for a database-backed loader without touching gameplay.
 *
 * Facts only: titles, years, credited performers. No artwork, no synopses.
 *
 * The runtime graph is the generated snapshot in `./generated`, validated here
 * (stable ids, deduped cast, films with 2+ performers) before `buildGraph()`
 * consumes it.
 */

import { GENERATED_FILMS } from "./generated/films.generated";

export interface RawFilm {
  /** Stable film id (IMDb title id), shared with HIGHER / LOWER. */
  id: string;
  title: string;
  year: number;
  cast: string[];
}


function normalise(films: RawFilm[]): RawFilm[] {
  const seenIds = new Set<string>();
  const out: RawFilm[] = [];
  for (const film of films) {
    if (!film.id || seenIds.has(film.id)) continue;
    if (!film.title.trim() || /^Q\d+$/.test(film.title)) continue;
    if (!Number.isFinite(film.year)) continue;
    const cast = Array.from(new Set(film.cast.map((n) => n.trim()).filter(Boolean)));
    if (cast.length < 2) continue;
    seenIds.add(film.id);
    out.push({ ...film, cast });
  }
  return out;
}

/** Validated production dataset. */
export const RAW_FILMS: RawFilm[] = normalise(GENERATED_FILMS);
