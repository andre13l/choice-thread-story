/**
 * Catalogue identity regressions.
 *
 * Run: bun scripts/catalog-checks.ts
 * Guards against duplicated / corrupted person identities leaking into the
 * daily games — the class of bug that surfaced "Zoe Sandalia" as a Daily
 * Person clue while the authoritative TMDB row said "Zoe Saldaña".
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

let failures = 0;
function check(ok: boolean, message: string) {
  if (!ok) {
    failures++;
    console.error(`FAIL  ${message}`);
  }
}

/** Names that were known-bad corrupted Wikidata labels. */
const BANNED_NAMES = ["zoe sandalia"];

// 1. Exactly one catalogue row per TMDB person id.
{
  const { data, error } = await db
    .from("connect_people")
    .select("id, tmdb_id")
    .not("tmdb_id", "is", null);
  if (error) throw new Error(error.message);
  const seen = new Map<number, string>();
  for (const row of data ?? []) {
    const previous = seen.get(row.tmdb_id as number);
    check(!previous, `tmdb_id ${row.tmdb_id} is on both ${previous} and ${row.id}`);
    seen.set(row.tmdb_id as number, row.id);
  }
  console.log(`${seen.size} people carry a TMDB identity`);
}

// 2. Zoe Saldaña specifically: single row, correct name, credits attached.
{
  const { data } = await db
    .from("connect_people")
    .select("id, name, tmdb_id")
    .eq("tmdb_id", 8691);
  check((data ?? []).length === 1, `expected one row for TMDB 8691, found ${(data ?? []).length}`);
  const row = data?.[0];
  check(row?.name === "Zoe Saldaña", `TMDB 8691 is named "${row?.name}"`);
  if (row) {
    const { count } = await db
      .from("connect_cast")
      .select("movie_id", { count: "exact", head: true })
      .eq("person_id", row.id);
    check((count ?? 0) > 0, `${row.name} has no credits after the merge`);
  }
}

// 3. No known-bad legacy label survives anywhere in the catalogue.
for (const banned of BANNED_NAMES) {
  const { data } = await db.from("connect_people").select("id, name").ilike("name", banned);
  check((data ?? []).length === 0, `banned name "${banned}" still present: ${JSON.stringify(data)}`);
}

// 4. No dangling cast edges (the classic merge mistake).
{
  const { data: cast } = await db.from("connect_cast").select("person_id").limit(100000);
  const ids = [...new Set((cast ?? []).map((r) => r.person_id))];
  const { data: people } = await db.from("connect_people").select("id").limit(100000);
  const known = new Set((people ?? []).map((p) => p.id));
  const dangling = ids.filter((id) => !known.has(id));
  check(dangling.length === 0, `${dangling.length} cast rows point at missing people`);
}

if (failures > 0) {
  console.error(`\n${failures} failing check(s)`);
  process.exit(1);
}
console.log("All catalogue checks passed.");
