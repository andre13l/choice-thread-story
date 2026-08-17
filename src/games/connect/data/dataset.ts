/**
 * CONNECT — catalogue loader.
 *
 * Source of truth for the shipped snapshot is `public/data/connect-graph.json`,
 * generated from Wikidata (CC0 structured data) plus Wikimedia Commons image
 * filenames. The same snapshot seeds the backend catalogue tables, so the
 * numbers shown in the product and the rows in the database agree.
 *
 * Identity is the Wikidata QID for both films and people — never a name slug —
 * so two different performers with the same name never merge.
 */

export interface RawDataset {
  /** Content hash of the catalogue this snapshot was generated from. */
  version?: string;
  /** [qid, name, sitelinks, commonsImageFile, birthYear, playable] */
  people: [string, string, number, string, number, (0 | 1)?][];
  /** [qid, title, year, sitelinks] */
  films: [string, string, number, number][];
  /** Per film (index-aligned with `films`): [personIndex, billingOrder, character] */
  cast: [number, number, string][][];
  source: string;
  generated: string;
}

export interface Person {
  id: string;
  name: string;
  /** Wikidata sitelink count — our notability proxy. */
  notability: number;
  /** Wikimedia Commons file name, empty when none is known. */
  image: string;
  birthYear: number;
  /**
   * Coverage tier. `true` means the ingestion pipeline deliberately hydrated
   * this actor's feature filmography, so they may be a challenge endpoint.
   * Connectors are traversable but never selectable.
   */
  playable: boolean;
  /** Film ids present IN CONNECT, newest first. Not a full filmography. */
  movieIds: string[];
}


export interface Movie {
  id: string;
  title: string;
  year: number;
  notability: number;
  /** Person ids in billing order. */
  personIds: string[];
  characters: Record<string, string>;
}

export interface Graph {
  peopleById: Record<string, Person>;
  moviesById: Record<string, Movie>;
  /** Traversable people (everyone with at least one credit). */
  personIds: string[];
  /** Coverage-qualified people — the only legal challenge endpoints. */
  playableIds: string[];
  movieIds: string[];
  counts: { films: number; people: number; connections: number; playable: number };
  source: string;
  version: string;
}

export function buildGraph(data: RawDataset): Graph {
  const peopleById: Record<string, Person> = {};
  const moviesById: Record<string, Movie> = {};
  const personIds: string[] = [];
  const movieIds: string[] = [];

  for (const [qid, name, notability, image, birthYear, playable] of data.people) {
    if (peopleById[qid]) continue;
    peopleById[qid] = {
      id: qid,
      name,
      notability,
      image,
      birthYear,
      playable: playable === 1,
      movieIds: [],
    };
    personIds.push(qid);
  }


  let connections = 0;
  data.films.forEach(([qid, title, year, notability], index) => {
    if (moviesById[qid]) return;
    const movie: Movie = { id: qid, title, year, notability, personIds: [], characters: {} };
    for (const [personIndex, , character] of data.cast[index] ?? []) {
      const personQid = data.people[personIndex]?.[0];
      const person = personQid ? peopleById[personQid] : undefined;
      if (!person || movie.personIds.includes(person.id)) continue;
      movie.personIds.push(person.id);
      if (character) movie.characters[person.id] = character;
      person.movieIds.push(qid);
      connections++;
    }
    if (movie.personIds.length < 2) return;
    moviesById[qid] = movie;
    movieIds.push(qid);
  });

  for (const person of Object.values(peopleById)) {
    person.movieIds = person.movieIds.filter((id) => moviesById[id]);
    person.movieIds.sort((a, b) => moviesById[b]!.year - moviesById[a]!.year);
  }

  return {
    peopleById,
    moviesById,
    personIds: personIds.filter((id) => peopleById[id]!.movieIds.length > 0),
    movieIds,
    counts: { films: movieIds.length, people: personIds.length, connections },
    source: data.source,
  };
}

let cached: Promise<Graph> | null = null;

/**
 * Fetches and builds the graph once per session. `origin` is only needed on
 * the server, where a relative URL cannot be resolved.
 */
export function loadGraph(origin?: string): Promise<Graph> {
  cached ??= fetch(`${origin ?? ""}/data/connect-graph.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`connect: dataset ${res.status}`);
      return res.json() as Promise<RawDataset>;
    })
    .then(buildGraph)
    .catch((error) => {
      cached = null;
      throw error;
    });
  return cached;
}
