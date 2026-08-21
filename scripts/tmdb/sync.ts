/**
 * TMDB ingestion driver — resumable, bounded, idempotent.
 *
 *   bun scripts/tmdb/sync.ts --people 31,6193 [--budget 200]
 *   bun scripts/tmdb/sync.ts --status
 *
 * HYDRATION RULE (documented, deliberate):
 *  - a seeded person gets their FULL acting filmography;
 *  - every movie that enters the graph gets its FULL TMDB cast — no top-billed
 *    truncation, which is exactly how Hugh Jackman used to go missing from
 *    "Deadpool & Wolverine";
 *  - Daily Connect pairs are only validated when a path of at most
 *    MAX_PATH_HOPS = 6 movie hops exists between the two endpoints.
 */

import { tmdbSource, mapLimit, tmdbToken } from "@/lib/catalog/tmdb.server";
import {
  claim,
  db,
  markFailed,
  markReady,
  pendingCount,
  refreshCounts,
  resumeJob,
  seedItems,
  setJob,
  type Job,
} from "./store";
import { upsertCredits, upsertMovies, upsertPeople } from "./upsert";

export const MAX_PATH_HOPS = 6;
const CONCURRENCY = 8;

function arg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? (process.argv[index + 1] ?? null) : null;
}

async function runPersonCredits(job: Job, ids: string[]) {
  await mapLimit(ids, CONCURRENCY, async (personId) => {
    try {
      const person = await tmdbSource.getPerson(personId);
      if (!person) throw new Error("person not found");
      const credits = await tmdbSource.getPersonMovieCredits(personId);

      const personIds = await upsertPeople([person], "playable");
      const movieIds = await upsertMovies(credits.map((c) => c.movie));
      await upsertCredits(
        credits.map((c) => c.credit),
        movieIds,
        personIds,
      );

      // Every film we touched now owes us its full cast.
      await seedItems(job, "movie_cast", [...movieIds.keys()]);
      await markReady(job, "person_credits", [personId]);
    } catch (error) {
      await markFailed(job, "person_credits", [personId], String(error));
    }
  });
}

async function runMovieCast(job: Job, ids: string[]) {
  await mapLimit(ids, CONCURRENCY, async (movieId) => {
    try {
      const [movie, cast] = await Promise.all([
        tmdbSource.getMovie(movieId),
        tmdbSource.getMovieCast(movieId),
      ]);
      if (movie && cast.length) {
        const movieIds = await upsertMovies([movie]);
        const personIds = await upsertPeople(cast.map((c) => c.person));
        await upsertCredits(
          cast.map((c) => c.credit),
          movieIds,
          personIds,
        );
      }
      await markReady(job, "movie_cast", [movieId]);
    } catch (error) {
      await markFailed(job, "movie_cast", [movieId], String(error));
    }
  });
}

async function status() {
  const { data } = await db
    .from("connect_sync_jobs")
    .select("id, label, stage, status, total_items, done_items, failed_items, last_error")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  if (process.argv.includes("--status")) return status();

  if (!tmdbToken()) {
    console.error(
      "TMDB_ACCESS_TOKEN is not set. Add it as a backend secret, then re-run this driver.",
    );
    process.exit(2);
  }

  const job = await resumeJob(arg("label") ?? "tmdb");
  const budget = Number(arg("budget") ?? 200);

  const seeds = (arg("people") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (seeds.length) {
    await seedItems(job, "person_credits", seeds);
    await setJob(job, { stage: "person_credits", status: "running" });
  }

  let spent = 0;
  while (spent < budget) {
    const people = await claim(job, "person_credits", Math.min(20, budget - spent));
    if (people.length) {
      await runPersonCredits(job, people);
      spent += people.length;
      await refreshCounts(job);
      continue;
    }
    const movies = await claim(job, "movie_cast", Math.min(40, budget - spent));
    if (!movies.length) break;
    await setJob(job, { stage: "movie_cast" });
    await runMovieCast(job, movies);
    spent += movies.length;
    await refreshCounts(job);
  }

  const remaining =
    (await pendingCount(job, "person_credits")) + (await pendingCount(job, "movie_cast"));
  await setJob(job, remaining === 0 ? { stage: "done", status: "ready" } : { status: "running" });
  await refreshCounts(job);
  console.log(`job ${job.id}: processed ${spent}, remaining ${remaining}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
