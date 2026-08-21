/**
 * Catalogue coherence audit (legacy Wikidata + TMDB coexistence).
 *
 * Run: bun scripts/catalog-coherence.ts
 *
 * Read-only. It never merges or deletes: high-confidence duplicates are
 * reported as MERGE candidates and ambiguous ones as REVIEW, so a human
 * decides before any destructive migration runs. Exits non-zero when a hard
 * invariant is broken (duplicate tmdb_id, orphan cast edge, bad label).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

/** PostgREST caps a response at 1000 rows; page through everything. */
async function all<T>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await db.from(table).select(columns).range(from, from + size - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < size) return out;
  }
}

const norm = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

let failures = 0;
const review: string[] = [];
function fail(message: string) {
  failures++;
  console.error(`FAIL  ${message}`);
}
function flag(message: string) {
  review.push(message);
}

interface Person {
  id: string;
  name: string;
  tmdb_id: number | null;
  birth_year: number | null;
  source: string;
}
interface Movie {
  id: string;
  title: string;
  year: number;
  tmdb_id: number | null;
}

const people = await all<Person>("connect_people", "id, name, tmdb_id, birth_year, source");
const movies = await all<Movie>("connect_movies", "id, title, year, tmdb_id");
const cast = await all<{ person_id: string; movie_id: string }>(
  "connect_cast",
  "person_id, movie_id",
);

console.log(
  `catalogue: ${people.length} people (${people.filter((p) => p.tmdb_id !== null).length} TMDB-backed), ` +
    `${movies.length} movies, ${cast.length} cast edges`,
);

// 1. One canonical row per TMDB identity.
for (const [table, rows] of [
  ["connect_people", people],
  ["connect_movies", movies],
] as const) {
  const seen = new Map<number, string>();
  for (const row of rows) {
    if (row.tmdb_id === null) continue;
    const prev = seen.get(row.tmdb_id);
    if (prev) fail(`${table}: tmdb_id ${row.tmdb_id} on both ${prev} and ${row.id}`);
    seen.set(row.tmdb_id, row.id);
  }
}

// 2. Missing / artifact canonical names.
const QID_LABEL = /^Q\d+$/;
const BANNED_NAMES = ["zoe sandalia"];
for (const p of people) {
  if (!p.name || !p.name.trim()) fail(`connect_people ${p.id} has no name`);
  else if (QID_LABEL.test(p.name.trim())) fail(`connect_people ${p.id} name is a raw QID label`);
  if (BANNED_NAMES.includes(norm(p.name ?? ""))) fail(`banned legacy label on ${p.id}: ${p.name}`);
}
for (const m of movies) {
  if (!m.title || !m.title.trim()) fail(`connect_movies ${m.id} has no title`);
  if (!Number.isFinite(m.year)) fail(`connect_movies ${m.id} has no year`);
}

// 3. Referential integrity.
const knownPeople = new Set(people.map((p) => p.id));
const knownMovies = new Set(movies.map((m) => m.id));
const orphanPeople = cast.filter((c) => !knownPeople.has(c.person_id));
const orphanMovies = cast.filter((c) => !knownMovies.has(c.movie_id));
if (orphanPeople.length) fail(`${orphanPeople.length} cast edges point at missing people`);
if (orphanMovies.length) fail(`${orphanMovies.length} cast edges point at missing movies`);

// 4. Duplicate identity candidates.
//    person: same normalised name + same birth year, only one side TMDB-backed.
const byName = new Map<string, Person[]>();
for (const p of people) {
  const k = norm(p.name ?? "");
  if (!k) continue;
  byName.set(k, [...(byName.get(k) ?? []), p]);
}
let mergeCandidates = 0;
let ambiguous = 0;
for (const [name, group] of byName) {
  if (group.length < 2) continue;
  const withTmdb = group.filter((p) => p.tmdb_id !== null);
  const legacy = group.filter((p) => p.tmdb_id === null);
  if (withTmdb.length === 1 && legacy.length >= 1) {
    for (const l of legacy) {
      const bothYears = l.birth_year !== null && withTmdb[0]!.birth_year !== null;
      if (bothYears && l.birth_year === withTmdb[0]!.birth_year) {
        mergeCandidates++;
        flag(`MERGE  ${l.id} -> ${withTmdb[0]!.id} (${name}, birth ${l.birth_year})`);
      } else {
        ambiguous++;
        flag(`REVIEW ${l.id} vs ${withTmdb[0]!.id} (${name}, birth years differ/unknown)`);
      }
    }
  } else if (group.length > 1) {
    ambiguous++;
    flag(`REVIEW ${group.length} people share the name "${name}": ${group.map((p) => p.id).join(", ")}`);
  }
}

// 5. Duplicate movie identity: same normalised title + year.
const byTitle = new Map<string, Movie[]>();
for (const m of movies) {
  const k = `${norm(m.title ?? "")}|${m.year}`;
  byTitle.set(k, [...(byTitle.get(k) ?? []), m]);
}
for (const [k, group] of byTitle) {
  if (group.length < 2) continue;
  const withTmdb = group.filter((m) => m.tmdb_id !== null);
  if (withTmdb.length === 1) {
    mergeCandidates++;
    flag(`MERGE  movie duplicates for ${k}: ${group.map((m) => m.id).join(", ")}`);
  } else {
    ambiguous++;
    flag(`REVIEW movie duplicates for ${k}: ${group.map((m) => m.id).join(", ")}`);
  }
}

// 6. Zoe Saldaña fixture — the identity bug that motivated this audit.
{
  const rows = people.filter((p) => p.tmdb_id === 8691);
  if (rows.length !== 1) fail(`expected exactly one row for TMDB 8691, found ${rows.length}`);
  const row = rows[0];
  if (row && row.name !== "Zoe Saldaña") fail(`TMDB 8691 is named "${row.name}"`);
  if (row && !cast.some((c) => c.person_id === row.id)) fail(`${row.name} has no credits`);
}

// 7. Daily Person references resolve to a canonical, correctly-named person.
{
  const { data } = await db.from("daily_person").select("date, person_id");
  for (const row of data ?? []) {
    const person = people.find((p) => p.id === row.person_id);
    if (!person) fail(`daily_person ${row.date} points at missing person ${row.person_id}`);
    else if (BANNED_NAMES.includes(norm(person.name)) || QID_LABEL.test(person.name))
      fail(`daily_person ${row.date} would show the bad label "${person.name}"`);
  }
}

// 8. Legacy-only rows are reported, never deleted.
const legacyWithCredits = people.filter(
  (p) => p.tmdb_id === null && cast.some((c) => c.person_id === p.id),
);
console.log(`\nlegacy (non-TMDB) people still carrying credits: ${legacyWithCredits.length} — kept, not deleted`);
console.log(`merge candidates: ${mergeCandidates} · ambiguous (needs review): ${ambiguous}`);
if (review.length) {
  console.log("\n--- audit report ---");
  for (const line of [...review].sort().slice(0, 200)) console.log(line);
  if (review.length > 200) console.log(`... and ${review.length - 200} more`);
}

if (failures > 0) {
  console.error(`\n${failures} failing invariant(s)`);
  process.exit(1);
}
console.log("\nAll catalogue coherence invariants hold.");
