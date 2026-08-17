/**
 * CONNECT — catalogue ingestion (Wikidata, CC0).
 *
 * Repeatable, repo-checked-in replacement for the old out-of-repo snapshot
 * generator. Coverage model:
 *
 *   PLAYABLE  — a deliberately hydrated actor. Every feature film in their
 *               Wikidata filmography above a low sitelink floor is ingested,
 *               so exposing them as a Connect endpoint is defensible.
 *   CONNECTOR — anyone else who appears in the cast of an ingested film.
 *               Traversable, never an endpoint, filmography NOT expanded.
 *
 * Film selection is therefore driven by the playable pool, not by a global
 * notability cutoff (the old `sitelinks >= 35` rule, which is what excluded
 * mainstream titles like The Break-Up and Swingers).
 *
 * Usage:
 *   bun scripts/connect/ingest.ts pool     # choose + persist the playable pool
 *   bun scripts/connect/ingest.ts films    # hydrate filmographies (cached)
 *   bun scripts/connect/ingest.ts casts    # hydrate casts of those films
 *   bun scripts/connect/ingest.ts upsert   # write everything to Supabase
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { sparql, qid, values, chunk } from "./wikidata";

const CACHE = ".cache/connect";
mkdirSync(CACHE, { recursive: true });

const read = <T>(name: string): T | null =>
  existsSync(`${CACHE}/${name}`) ? (JSON.parse(readFileSync(`${CACHE}/${name}`, "utf8")) as T) : null;
const write = (name: string, data: unknown) =>
  writeFileSync(`${CACHE}/${name}`, JSON.stringify(data));

export const RULES = {
  /** Playable pool: recognizable enough that people expect full coverage. */
  poolMinNotability: 80,
  /** Films kept from a playable actor's filmography. Was 35 globally. */
  filmMinSitelinks: 5,
  filmMinYear: 1920,
  /** Cast members kept per film: everyone above this, plus every playable. */
  castMinSitelinks: 3,
  /** A connector only earns a place in the shipped graph with 2+ credits. */
  connectorMinCredits: 2,
} as const;

const FILM_CLASSES = ["Q11424", "Q24869", "Q202866", "Q29168811", "Q20650540"];

function admin() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false },
  });
}

export interface FilmRow {
  id: string;
  title: string;
  year: number;
  sitelinks: number;
}
export interface CastRow {
  movie: string;
  person: string;
  billing: number | null;
  character: string | null;
}
export interface PersonRow {
  id: string;
  name: string;
  sitelinks: number;
  birthYear: number | null;
  image: string | null;
}

/* ------------------------------------------------------------------ pool */

/**
 * The pool starts from people the catalogue already knows are recognizable,
 * and always includes anyone a Daily Connect has used or a report named, so
 * reported gaps are covered by the rule rather than by hand.
 */
export async function selectPool(): Promise<string[]> {
  const supabase = admin();
  const ids = new Set<string>();

  // Every actor the product already exposes as selectable must be covered,
  // plus anyone above the notability floor.
  for (const filter of ["notability", "challenge_eligible"] as const) {
    for (let from = 0; ; from += 1000) {
      let q = supabase.from("connect_people").select("id");
      q = filter === "notability"
        ? q.gte("notability", RULES.poolMinNotability)
        : q.eq("challenge_eligible", true);
      const { data, error } = await q.range(from, from + 999);
      if (error) throw error;
      data?.forEach((p) => ids.add(p.id));
      if (!data || data.length < 1000) break;
    }
  }


  const { data: dailies } = await supabase.from("daily_connect").select("start_person_id, target_person_id");
  dailies?.forEach((d) => {
    ids.add(d.start_person_id);
    ids.add(d.target_person_id);
  });

  const pool = [...ids];
  write("pool.json", pool);
  console.log(`pool: ${pool.length} playable candidates`);
  return pool;
}

/* ----------------------------------------------------------------- films */

const filmQuery = (ids: string[]) => `
SELECT ?actor ?film ?filmLabel ?enName (MIN(?y) AS ?year) (SAMPLE(?sl) AS ?sitelinks) WHERE {
  ${values("actor", ids)}
  VALUES ?class { ${FILM_CLASSES.map((c) => `wd:${c}`).join(" ")} }
  ?film wdt:P161 ?actor ; wdt:P31 ?class ; wikibase:sitelinks ?sl ; wdt:P577 ?date .
  BIND(YEAR(?date) AS ?y)
  OPTIONAL { ?article schema:about ?film ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enName }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} GROUP BY ?actor ?film ?filmLabel ?enName`;

export async function hydrateFilms(pool: string[]) {
  const films = new Map<string, FilmRow>(Object.entries(read<Record<string, FilmRow>>("films.json") ?? {}));
  const done = new Set(read<string[]>("films-done.json") ?? []);
  const credits: Record<string, string[]> = read("credits.json") ?? {};

  const todo = pool.filter((id) => !done.has(id));
  for (const [i, batch] of chunk(todo, 15).entries()) {
    const bindings = await sparql(filmQuery(batch));
    for (const b of bindings) {
      const id = qid(b["film"]?.value);
      const label = b["filmLabel"]?.value ?? "";
      // Some notable films (e.g. Forrest Gump) carry no English Wikidata
      // label; the English Wikipedia article title is the correct fallback.
      const title = label && label !== id ? label : (b["enName"]?.value ?? "");
      const year = Number(b["year"]?.value ?? 0);
      const sitelinks = Number(b["sitelinks"]?.value ?? 0);
      if (!id || !title || title === id) continue; // unresolved label -> skip
      if (year < RULES.filmMinYear) continue;
      if (sitelinks < RULES.filmMinSitelinks) continue;
      films.set(id, { id, title, year, sitelinks });
      const actor = qid(b["actor"]?.value);
      (credits[actor] ??= []).push(id);
    }

    batch.forEach((id) => done.add(id));
    if (i % 5 === 0 || done.size === pool.length) {
      write("films.json", Object.fromEntries(films));
      write("films-done.json", [...done]);
      write("credits.json", credits);
      console.log(`films: ${done.size}/${pool.length} actors, ${films.size} films`);
    }
  }
  write("films.json", Object.fromEntries(films));
  write("films-done.json", [...done]);
  write("credits.json", credits);
  console.log(`films: done, ${films.size} distinct films`);
  return films;
}

/* ----------------------------------------------------------------- casts */

const castQuery = (ids: string[]) => `
SELECT ?film ?person ?personLabel ?enName ?sitelinks ?birth ?image ?order ?charLabel WHERE {
  ${values("film", ids)}
  ?film p:P161 ?st .
  ?st ps:P161 ?person .
  ?person wikibase:sitelinks ?sitelinks .
  OPTIONAL { ?st pq:P1545 ?order }
  OPTIONAL { ?st pq:P453 ?char }
  OPTIONAL { ?person wdt:P569 ?birthDate BIND(YEAR(?birthDate) AS ?birth) }
  OPTIONAL { ?person wdt:P18 ?image }
  OPTIONAL { ?article schema:about ?person ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enName }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

export async function hydrateCasts(filmIds: string[]) {
  const people = new Map<string, PersonRow>(
    Object.entries(read<Record<string, PersonRow>>("people.json") ?? {}),
  );
  const cast: CastRow[] = read("cast.json") ?? [];
  const done = new Set(read<string[]>("casts-done.json") ?? []);

  const todo = filmIds.filter((id) => !done.has(id));
  for (const [i, batch] of chunk(todo, 60).entries()) {
    const bindings = await sparql(castQuery(batch));
    for (const b of bindings) {
      const personId = qid(b["person"]?.value);
      const label = b["personLabel"]?.value ?? "";
      const name = label && label !== personId ? label : (b["enName"]?.value ?? "");
      if (!personId || !name || name === personId) continue;

      const sitelinks = Number(b["sitelinks"]?.value ?? 0);
      const imageUrl = b["image"]?.value ?? "";
      people.set(personId, {
        id: personId,
        name,
        sitelinks,
        birthYear: Number(b["birth"]?.value ?? 0) || null,
        image: imageUrl ? decodeURIComponent(imageUrl.split("/").pop()!).replace(/_/g, " ") : null,
      });
      const character = b["charLabel"]?.value ?? null;
      cast.push({
        movie: qid(b["film"]?.value),
        person: personId,
        billing: Number(b["order"]?.value ?? 0) || null,
        character: character && character !== qid(b["char"]?.value) ? character : null,
      });
    }
    batch.forEach((id) => done.add(id));
    if (i % 10 === 0 || done.size === filmIds.length) {
      write("people.json", Object.fromEntries(people));
      write("cast.json", cast);
      write("casts-done.json", [...done]);
      console.log(`casts: ${done.size}/${filmIds.length} films, ${cast.length} credits`);
    }
  }
  write("people.json", Object.fromEntries(people));
  write("cast.json", cast);
  write("casts-done.json", [...done]);
  console.log(`casts: done, ${people.size} people, ${cast.length} credits`);
}

/* ---------------------------------------------------------------- upsert */

export function loadCache() {
  const pool = new Set(read<string[]>("pool.json") ?? []);
  const films = read<Record<string, FilmRow>>("films.json") ?? {};
  const people = read<Record<string, PersonRow>>("people.json") ?? {};
  const rawCast = read<CastRow[]>("cast.json") ?? [];

  // De-duplicate credits (a person can hold several cast statements per film).
  const seen = new Set<string>();
  const cast = rawCast.filter((c) => {
    if (!films[c.movie] || !people[c.person]) return false;
    const key = `${c.movie}|${c.person}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const credits = new Map<string, number>();
  for (const c of cast) credits.set(c.person, (credits.get(c.person) ?? 0) + 1);

  const keep = (id: string) =>
    pool.has(id) ||
    ((people[id]!.sitelinks >= RULES.castMinSitelinks) &&
      (credits.get(id) ?? 0) >= RULES.connectorMinCredits);

  const keptPeople = Object.values(people).filter((p) => keep(p.id));
  const keptIds = new Set(keptPeople.map((p) => p.id));
  const keptCast = cast.filter((c) => keptIds.has(c.person));

  const filmCredits = new Map<string, number>();
  for (const c of keptCast) filmCredits.set(c.movie, (filmCredits.get(c.movie) ?? 0) + 1);
  const keptFilms = Object.values(films).filter((f) => (filmCredits.get(f.id) ?? 0) >= 2);
  const filmIds = new Set(keptFilms.map((f) => f.id));

  return {
    pool,
    people: keptPeople,
    films: keptFilms,
    cast: keptCast.filter((c) => filmIds.has(c.movie)),
    credits,
  };
}

async function upsert() {
  const supabase = admin();
  const { pool, people, films, cast, credits } = loadCache();
  const now = new Date().toISOString();

  const peopleRows = people.map((p) => ({
    id: p.id,
    name: p.name,
    notability: p.sitelinks,
    birth_year: p.birthYear,
    image_file: p.image,
    image_attribution_url: p.image
      ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.image)}`
      : null,
    challenge_eligible: pool.has(p.id),
    coverage_status: pool.has(p.id) ? "playable" : "connector",
    credit_count: credits.get(p.id) ?? 0,
    hydrated_at: pool.has(p.id) ? now : null,
  }));

  const push = async <T>(table: string, rows: T[]) => {
    for (const [i, batch] of chunk(rows, 500).entries()) {
      const { error } = await supabase.from(table).upsert(batch as never);
      if (error) throw new Error(`${table}: ${error.message}`);
      if (i % 20 === 0) console.log(`${table}: ${i * 500}/${rows.length}`);
    }
    console.log(`${table}: ${rows.length} rows`);
  };

  await push("connect_people", peopleRows);
  await push(
    "connect_movies",
    films.map((f) => ({ id: f.id, title: f.title, year: f.year, notability: f.sitelinks })),
  );
  await push(
    "connect_cast",
    cast.map((c) => ({
      movie_id: c.movie,
      person_id: c.person,
      billing: c.billing,
      character_name: c.character,
    })),
  );
}

/* ------------------------------------------------------------------ main */

const stage = process.argv[2];
if (stage === "pool") await selectPool();
else if (stage === "films") await hydrateFilms(read<string[]>("pool.json") ?? (await selectPool()));
else if (stage === "casts")
  await hydrateCasts(Object.keys(read<Record<string, FilmRow>>("films.json") ?? {}));
else if (stage === "upsert") await upsert();
else if (stage === "measure") {
  const { people, films, cast, pool } = loadCache();
  console.log({
    playable: people.filter((p) => pool.has(p.id)).length,
    connectors: people.filter((p) => !pool.has(p.id)).length,
    films: films.length,
    edges: cast.length,
  });
} else console.log("stages: pool | films | casts | upsert | measure");
