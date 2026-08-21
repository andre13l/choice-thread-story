/**
 * Catalogue source contract.
 *
 * Gameplay code never talks to an external provider — it reads NIRCOSI's own
 * Supabase catalogue. Ingestion talks to whatever implements this interface,
 * so TMDB can later be swapped for a differently licensed provider without a
 * single change in the games.
 */

export interface SourceMovie {
  sourceId: string;
  title: string;
  year: number;
  releaseDate: string | null;
  popularity: number;
  posterPath: string | null;
}

export interface SourcePerson {
  sourceId: string;
  name: string;
  birthYear: number | null;
  popularity: number;
  profilePath: string | null;
}

export interface SourceCredit {
  personSourceId: string;
  movieSourceId: string;
  character: string | null;
  order: number | null;
  creditId: string | null;
}

export interface CatalogSource {
  /** Stable provider name, persisted on every row it produces. */
  readonly name: string;
  getPerson(sourceId: string): Promise<SourcePerson | null>;
  /** Every acting credit for a person (used to expand the graph outward). */
  getPersonMovieCredits(
    sourceId: string,
  ): Promise<{ movie: SourceMovie; credit: SourceCredit }[]>;
  getMovie(sourceId: string): Promise<SourceMovie | null>;
  /** FULL cast for a movie — never truncated to top billing. */
  getMovieCast(sourceId: string): Promise<{ person: SourcePerson; credit: SourceCredit }[]>;
  searchPerson(name: string): Promise<SourcePerson | null>;
  searchMovie(title: string, year?: number): Promise<SourceMovie | null>;
}
