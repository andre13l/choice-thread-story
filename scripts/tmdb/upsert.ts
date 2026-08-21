/**
 * Maps source rows onto the existing NIRCOSI catalogue tables.
 *
 * Identity rules (the Wikidata migration path):
 *  - a row already carrying the same `tmdb_id` wins;
 *  - otherwise an existing legacy (Wikidata) row is adopted by exact
 *    title+year / name match and gets its `tmdb_id` stamped on it;
 *  - otherwise a new row is created with a `tm<id>` / `tp<id>` key.
 * Legacy QIDs are never deleted or rewritten by ingestion.
 */

import type { SourceCredit, SourceMovie, SourcePerson } from "@/lib/catalog/source";
import { chunked, db } from "./store";

export const movieKey = (sourceId: string) => `tm${sourceId}`;
export const personKey = (sourceId: string) => `tp${sourceId}`;

async function adoptById(
  table: "connect_movies" | "connect_people",
  tmdbIds: number[],
): Promise<Map<number, string>> {
  const found = new Map<number, string>();
  for (const batch of chunked(tmdbIds, 200)) {
    const { data } = await db.from(table).select("id, tmdb_id").in("tmdb_id", batch);
    for (const row of data ?? []) found.set(Number(row.tmdb_id), row.id as string);
  }
  return found;
}

/** Upserts movies; returns sourceId -> catalogue id. */
export async function upsertMovies(movies: SourceMovie[]): Promise<Map<string, string>> {
  const unique = [...new Map(movies.map((m) => [m.sourceId, m])).values()];
  const adopted = await adoptById(
    "connect_movies",
    unique.map((m) => Number(m.sourceId)),
  );

  const ids = new Map<string, string>();
  const rows = unique.map((movie) => {
    const id = adopted.get(Number(movie.sourceId)) ?? movieKey(movie.sourceId);
    ids.set(movie.sourceId, id);
    return {
      id,
      tmdb_id: Number(movie.sourceId),
      title: movie.title,
      year: movie.year,
      release_date: movie.releaseDate,
      popularity: movie.popularity,
      poster_path: movie.posterPath,
      notability: Math.round(movie.popularity),
      source: "tmdb",
      last_synced_at: new Date().toISOString(),
    };
  });

  for (const batch of chunked(rows)) {
    const { error } = await db.from("connect_movies").upsert(batch, { onConflict: "id" });
    if (error) throw new Error(`connect_movies: ${error.message}`);
  }
  return ids;
}

/** Upserts people; returns sourceId -> catalogue id. Never downgrades coverage. */
export async function upsertPeople(
  people: SourcePerson[],
  coverage?: "playable" | "connector",
): Promise<Map<string, string>> {
  const unique = [...new Map(people.map((p) => [p.sourceId, p])).values()];
  const adopted = await adoptById(
    "connect_people",
    unique.map((p) => Number(p.sourceId)),
  );

  const ids = new Map<string, string>();
  const rows = unique.map((person) => {
    const id = adopted.get(Number(person.sourceId)) ?? personKey(person.sourceId);
    ids.set(person.sourceId, id);
    return {
      id,
      tmdb_id: Number(person.sourceId),
      name: person.name,
      birth_year: person.birthYear,
      popularity: person.popularity,
      profile_path: person.profilePath,
      notability: Math.round(person.popularity),
      source: "tmdb",
      last_synced_at: new Date().toISOString(),
      ...(coverage ? { coverage_status: coverage } : {}),
    };
  });

  for (const batch of chunked(rows)) {
    const { error } = await db.from("connect_people").upsert(batch, { onConflict: "id" });
    if (error) throw new Error(`connect_people: ${error.message}`);
  }
  return ids;
}

export async function upsertCredits(
  credits: SourceCredit[],
  movieIds: Map<string, string>,
  personIds: Map<string, string>,
) {
  const rows = credits
    .map((credit) => {
      const movie_id = movieIds.get(credit.movieSourceId);
      const person_id = personIds.get(credit.personSourceId);
      if (!movie_id || !person_id) return null;
      return {
        movie_id,
        person_id,
        billing: credit.order === null ? null : credit.order + 1,
        cast_order: credit.order,
        character_name: credit.character,
        tmdb_credit_id: credit.creditId,
        source: "tmdb",
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  for (const batch of chunked(rows)) {
    const { error } = await db
      .from("connect_cast")
      .upsert(batch, { onConflict: "movie_id,person_id" });
    if (error) throw new Error(`connect_cast: ${error.message}`);
  }
  return rows.length;
}
