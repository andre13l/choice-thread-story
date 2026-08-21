/**
 * Connect coverage regression fixtures.
 *
 *   bun scripts/connect-regression.ts
 *
 * These are TRUE credits that the graph must contain once the relevant film is
 * ingested. Community reports are QA fixtures, not truth: incorrect reports
 * (e.g. "Will Smith in Spider-Man: No Way Home") are recorded below as
 * negative fixtures and must NEVER appear in the catalogue.
 *
 * A fixture whose film is not in the catalogue yet is reported as SKIP, so the
 * check is meaningful during the TMDB migration without blocking it.
 */

import { db } from "./tmdb/store";

interface Fixture {
  person: string;
  movie: string;
  year: number;
}

const MUST_EXIST: Fixture[] = [
  { person: "Hugh Jackman", movie: "Deadpool & Wolverine", year: 2024 },
  { person: "Tom Hanks", movie: "Forrest Gump", year: 1994 },
  { person: "Jennifer Aniston", movie: "The Break-Up", year: 2006 },
  { person: "Paul Rudd", movie: "The Break-Up", year: 2006 },
  { person: "Vince Vaughn", movie: "Swingers", year: 1996 },
];

const MUST_NOT_EXIST: Fixture[] = [
  { person: "Will Smith", movie: "Spider-Man: No Way Home", year: 2021 },
];

async function findMovie(title: string, year: number): Promise<string[]> {
  const { data } = await db.from("connect_movies").select("id").eq("title", title).eq("year", year);
  return (data ?? []).map((r) => r.id as string);
}

async function findPerson(name: string): Promise<string[]> {
  const { data } = await db.from("connect_people").select("id").eq("name", name);
  return (data ?? []).map((r) => r.id as string);
}

async function linked(fixture: Fixture): Promise<"yes" | "no" | "skip"> {
  const movieIds = await findMovie(fixture.movie, fixture.year);
  const personIds = await findPerson(fixture.person);
  if (!movieIds.length) return "skip";
  if (!personIds.length) return "no";
  const { count } = await db
    .from("connect_cast")
    .select("movie_id", { count: "exact", head: true })
    .in("movie_id", movieIds)
    .in("person_id", personIds);
  return (count ?? 0) > 0 ? "yes" : "no";
}

async function main() {
  let failures = 0;
  let skipped = 0;

  for (const fixture of MUST_EXIST) {
    const result = await linked(fixture);
    if (result === "skip") {
      skipped++;
      console.log(`SKIP  ${fixture.person} / ${fixture.movie} (film not ingested yet)`);
    } else if (result === "yes") {
      console.log(`PASS  ${fixture.person} / ${fixture.movie}`);
    } else {
      failures++;
      console.log(`FAIL  ${fixture.person} / ${fixture.movie} — missing credit`);
    }
  }

  for (const fixture of MUST_NOT_EXIST) {
    const result = await linked(fixture);
    if (result === "yes") {
      failures++;
      console.log(`FAIL  ${fixture.person} must NOT be in ${fixture.movie}`);
    } else {
      console.log(`PASS  ${fixture.person} correctly absent from ${fixture.movie}`);
    }
  }

  console.log(`\n${failures} failures, ${skipped} skipped`);
  if (failures) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
