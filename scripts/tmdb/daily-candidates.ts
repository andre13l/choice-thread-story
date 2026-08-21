/**
 * Daily Connect candidate preparation.
 *
 *   bun scripts/tmdb/daily-candidates.ts --add 31,6193 [--date 2026-09-01]
 *   bun scripts/tmdb/daily-candidates.ts --validate [--limit 10]
 *   bun scripts/tmdb/daily-candidates.ts --list
 *
 * Lifecycle: pending -> hydrating -> validated -> ready.
 *  pending    the pair exists, nothing hydrated yet
 *  hydrating  both endpoints are queued/being hydrated by scripts/tmdb/sync.ts
 *  validated  a path of <= MAX_PATH_HOPS movie hops exists in OUR catalogue,
 *             both endpoints have >= 8 fully-cast films, no direct co-star link
 *  ready      approved for publication into `daily_connect`
 *
 * Nothing here touches already-published dailies: the archive and its numbering
 * are append-only.
 */

import { db } from "./store";
import { MAX_PATH_HOPS } from "./sync";
import { personKey } from "./upsert";

const MIN_ENDPOINT_FILMS = 8;

function arg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? (process.argv[index + 1] ?? null) : null;
}

async function filmsOf(personId: string): Promise<string[]> {
  const { data } = await db.from("connect_cast").select("movie_id").eq("person_id", personId);
  return (data ?? []).map((r) => r.movie_id as string);
}

async function castOf(movieIds: string[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  for (let i = 0; i < movieIds.length; i += 100) {
    const { data } = await db
      .from("connect_cast")
      .select("movie_id, person_id")
      .in("movie_id", movieIds.slice(i, i + 100));
    for (const row of data ?? []) {
      const list = out.get(row.movie_id as string) ?? [];
      list.push(row.person_id as string);
      out.set(row.movie_id as string, list);
    }
  }
  return out;
}

/** Breadth-first over the catalogue itself, counting movie hops. */
async function shortestHops(startId: string, targetId: string): Promise<number | null> {
  const seenPeople = new Set([startId]);
  let frontier = [startId];
  for (let hop = 1; hop <= MAX_PATH_HOPS; hop++) {
    const movieIds = new Set<string>();
    for (const personId of frontier) for (const m of await filmsOf(personId)) movieIds.add(m);
    const casts = await castOf([...movieIds]);
    const next: string[] = [];
    for (const people of casts.values()) {
      for (const personId of people) {
        if (personId === targetId) return hop;
        if (seenPeople.has(personId)) continue;
        seenPeople.add(personId);
        next.push(personId);
      }
    }
    if (!next.length) return null;
    frontier = next;
  }
  return null;
}

async function validate(limit: number) {
  const { data: rows } = await db
    .from("daily_connect_candidates")
    .select("id, start_person_id, target_person_id, status")
    .in("status", ["pending", "hydrating"])
    .limit(limit);

  for (const row of rows ?? []) {
    const start = row.start_person_id as string;
    const target = row.target_person_id as string;
    const [startFilms, targetFilms] = await Promise.all([filmsOf(start), filmsOf(target)]);

    if (startFilms.length < MIN_ENDPOINT_FILMS || targetFilms.length < MIN_ENDPOINT_FILMS) {
      await db
        .from("daily_connect_candidates")
        .update({
          status: "hydrating",
          validation: { startFilms: startFilms.length, targetFilms: targetFilms.length },
          last_error: "endpoints not hydrated deeply enough",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      continue;
    }

    const hops = await shortestHops(start, target);
    const coStars = startFilms.some((m) => targetFilms.includes(m));
    const ok = hops !== null && hops >= 2 && hops <= MAX_PATH_HOPS && !coStars;

    await db
      .from("daily_connect_candidates")
      .update({
        status: ok ? "validated" : "pending",
        optimal_clicks: hops,
        validation: {
          hops,
          coStars,
          startFilms: startFilms.length,
          targetFilms: targetFilms.length,
          maxHops: MAX_PATH_HOPS,
        },
        last_error: ok ? null : "no acceptable path within max depth",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    console.log(`${start} -> ${target}: hops=${hops} coStars=${coStars} => ${ok ? "validated" : "pending"}`);
  }
}

async function main() {
  const add = arg("add");
  if (add) {
    const [a, b] = add.split(",").map((s) => s.trim());
    if (!a || !b) throw new Error("--add expects two TMDB person ids: --add 31,6193");
    const { error } = await db.from("daily_connect_candidates").upsert(
      {
        start_person_id: personKey(a),
        target_person_id: personKey(b),
        planned_date: arg("date"),
        status: "pending",
      },
      { onConflict: "start_person_id,target_person_id" },
    );
    if (error) throw error;
    console.log(`candidate queued: ${personKey(a)} -> ${personKey(b)}`);
  }

  if (process.argv.includes("--validate")) await validate(Number(arg("limit") ?? 10));

  if (process.argv.includes("--list") || !add) {
    const { data } = await db
      .from("daily_connect_candidates")
      .select("planned_date, start_person_id, target_person_id, status, optimal_clicks")
      .order("planned_date", { nullsFirst: false });
    console.table(data ?? []);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
