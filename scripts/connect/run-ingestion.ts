/**
 * CONNECT — durable, resumable catalogue ingestion driver.
 *
 * All state lives in Supabase (`connect_ingest_runs`, `connect_ingest_items`,
 * `connect_stage_*`), so a sandbox reset costs nothing but the batch that was
 * in flight. Run it repeatedly until it reports stage `done`:
 *
 *   bun scripts/connect/run-ingestion.ts               # work until the budget runs out
 *   bun scripts/connect/run-ingestion.ts --budget=1200 # seconds of work (default 900)
 *   bun scripts/connect/run-ingestion.ts status        # progress only, no work
 *   bun scripts/connect/run-ingestion.ts promote       # force the promote stage
 */

import { sparql, qid, chunk } from "./wikidata";
import { getEntities, pool as entityPool, claimId, claimString, claimYear, qualifierId, qualifierString } from "./entities";
import { RULES, filmQuery } from "./rules";
import {
  db,
  resumeRun,
  setStage,
  setStats,
  fail,
  seedItems,
  pendingCount,
  claim,
  markDone,
  markFailed,
  stageRows,
  putStage,
  chunked,
  type Run,
} from "./store";

const arg = (name: string, fallback: number) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : fallback;
};
const BUDGET_MS = arg("budget", 900) * 1000;
const started = Date.now();
const outOfBudget = () => Date.now() - started > BUDGET_MS;

/* ------------------------------------------------------------------ pool */

async function stagePool(run: Run) {
  const ids = new Set<string>();
  for (const filter of ["notability", "challenge_eligible"] as const) {
    for (let from = 0; ; from += 1000) {
      let q = db.from("connect_people").select("id");
      q = filter === "notability"
        ? q.gte("notability", RULES.poolMinNotability)
        : q.eq("challenge_eligible", true);
      const { data, error } = await q.range(from, from + 999);
      if (error) throw error;
      data?.forEach((p) => ids.add(p.id as string));
      if (!data || data.length < 1000) break;
    }
  }
  const { data: dailies } = await db.from("daily_connect").select("start_person_id, target_person_id");
  dailies?.forEach((d) => {
    ids.add(d.start_person_id as string);
    ids.add(d.target_person_id as string);
  });

  await seedItems(run, "films", [...ids]);
  await setStats(run, { pool: ids.size });
  await setStage(run, "films");
  console.log(`pool: ${ids.size} playable candidates queued for film hydration`);
}

/* ----------------------------------------------------------------- films */

async function stageFilms(run: Run) {
  for (;;) {
    if (outOfBudget()) return false;
    const batch = await claim(run, "films", 15);
    if (!batch.length) break;
    try {
      const bindings = await sparql(filmQuery(batch));
      const films = new Map<string, { run_id: string; id: string; title: string; year: number; sitelinks: number }>();
      for (const b of bindings) {
        const id = qid(b["film"]?.value);
        const label = b["filmLabel"]?.value ?? "";
        const title = label && label !== id ? label : (b["enName"]?.value ?? "");
        const year = Number(b["year"]?.value ?? 0);
        const sitelinks = Number(b["sitelinks"]?.value ?? 0);
        if (!id || !title || title === id) continue;
        if (year < RULES.filmMinYear || sitelinks < RULES.filmMinSitelinks) continue;
        films.set(id, { run_id: run.id, id, title, year, sitelinks });
      }
      await putStage("connect_stage_movies", [...films.values()]);
      await markDone(run, "films", batch);
    } catch (err) {
      await markFailed(run, "films", batch, String(err));
      await fail(run, String(err));
    }
    const left = await pendingCount(run, "films");
    console.log(`films: ${left} actors pending`);
  }

  const movies = await stageRows<{ id: string }>(run, "connect_stage_movies", "id", "id");
  await seedItems(run, "casts", movies.map((m) => m.id));
  await setStats(run, { films: movies.length });
  await setStage(run, "casts");
  console.log(`films: done, ${movies.length} distinct films queued for cast hydration`);
  return true;
}

/* ----------------------------------------------------------------- casts */

async function stageCasts(run: Run) {
  for (;;) {
    if (outOfBudget()) return false;
    const claimed = await claim(run, "casts", 1200);
    if (!claimed.length) break;
    const batches = chunk(claimed, 50);
    await entityPool(batches, 6, async (ids) => {
      try {
        const entities = await getEntities(ids, "claims");
        const rows: Record<string, unknown>[] = [];
        const seen = new Set<string>();
        for (const id of ids) {
          for (const st of entities[id]?.claims?.["P161"] ?? []) {
            const person = claimId(st);
            if (!person || seen.has(`${id}|${person}`)) continue;
            seen.add(`${id}|${person}`);
            rows.push({
              run_id: run.id,
              movie_id: id,
              person_id: person,
              billing: Number(qualifierString(st, "P1545") ?? 0) || null,
              character_qid: qualifierId(st, "P453"),
            });
          }
        }
        await putStage("connect_stage_cast", rows);
        await markDone(run, "casts", ids);
      } catch (err) {
        await markFailed(run, "casts", ids, String(err));
      }
    });
    console.log(`casts: ${await pendingCount(run, "casts")} films pending`);
  }

  const cast = await stageRows<{ person_id: string }>(run, "connect_stage_cast", "person_id", "movie_id");
  await seedItems(run, "people", cast.map((c) => c.person_id));
  await setStats(run, { edges: cast.length });
  await setStage(run, "people");
  console.log(`casts: done, ${cast.length} credits`);
  return true;
}

/* ---------------------------------------------------------------- people */

async function stagePeople(run: Run) {
  for (;;) {
    if (outOfBudget()) return false;
    const claimed = await claim(run, "people", 1200);
    if (!claimed.length) break;
    await entityPool(chunk(claimed, 50), 6, async (ids) => {
      try {
        const entities = await getEntities(ids, "labels|sitelinks|claims");
        const rows: Record<string, unknown>[] = [];
        for (const id of ids) {
          const e = entities[id];
          if (!e) continue;
          const enwiki = e.sitelinks?.["enwiki"] as { title?: string } | undefined;
          const name = e.labels?.["en"]?.value ?? enwiki?.title ?? "";
          if (!name || name === id) continue;
          const image = claimString(e.claims?.["P18"]?.[0]);
          rows.push({
            run_id: run.id,
            id,
            name,
            sitelinks: Object.keys(e.sitelinks ?? {}).length,
            birth_year: claimYear(e.claims?.["P569"]?.[0]),
            image_file: image ? image.replace(/_/g, " ") : null,
          });
        }
        await putStage("connect_stage_people", rows);
        await markDone(run, "people", ids);
      } catch (err) {
        await markFailed(run, "people", ids, String(err));
      }
    });
    console.log(`people: ${await pendingCount(run, "people")} pending`);
  }

  const chars = await stageRows<{ character_qid: string | null }>(
    run, "connect_stage_cast", "character_qid", "movie_id",
  );
  await seedItems(run, "chars", chars.map((c) => c.character_qid).filter((c): c is string => !!c));
  await setStage(run, "chars");
  console.log("people: done");
  return true;
}

/* ------------------------------------------------------------ characters */

async function stageChars(run: Run) {
  for (;;) {
    if (outOfBudget()) return false;
    const claimed = await claim(run, "chars", 1200);
    if (!claimed.length) break;
    await entityPool(chunk(claimed, 50), 6, async (ids) => {
      try {
        const entities = await getEntities(ids, "labels");
        const rows = ids
          .map((id) => ({ run_id: run.id, id, label: entities[id]?.labels?.["en"]?.value ?? "" }))
          .filter((r) => r.label && r.label !== r.id);
        await putStage("connect_stage_characters", rows);
        await markDone(run, "chars", ids);
      } catch (err) {
        await markFailed(run, "chars", ids, String(err));
      }
    });
    console.log(`chars: ${await pendingCount(run, "chars")} pending`);
  }
  await setStage(run, "promote");
  console.log("chars: done");
  return true;
}

/* --------------------------------------------------------------- promote */

/**
 * Copies the staged catalogue into the live tables, applying the coverage
 * rules. Coverage flags are rewritten for EVERY person in the catalogue, so a
 * person who left the pool cannot keep a stale `playable` status and remain
 * selectable without hydrated coverage.
 */
async function promote(run: Run) {
  const poolIds = new Set(
    (await db.from("connect_ingest_items").select("item_id").eq("run_id", run.id).eq("stage", "films").limit(100000))
      .data?.map((r) => r.item_id as string) ?? [],
  );

  const films = await stageRows<{ id: string; title: string; year: number; sitelinks: number }>(
    run, "connect_stage_movies", "id, title, year, sitelinks", "id",
  );
  const people = await stageRows<{ id: string; name: string; sitelinks: number; birth_year: number | null; image_file: string | null }>(
    run, "connect_stage_people", "id, name, sitelinks, birth_year, image_file", "id",
  );
  const cast = await stageRows<{ movie_id: string; person_id: string; billing: number | null; character_qid: string | null }>(
    run, "connect_stage_cast", "movie_id, person_id, billing, character_qid", "movie_id",
  );
  const chars = new Map(
    (await stageRows<{ id: string; label: string }>(run, "connect_stage_characters", "id, label", "id"))
      .map((c) => [c.id, c.label]),
  );

  const filmById = new Map(films.map((f) => [f.id, f]));
  const personById = new Map(people.map((p) => [p.id, p]));
  const valid = cast.filter((c) => filmById.has(c.movie_id) && personById.has(c.person_id));

  const credits = new Map<string, number>();
  for (const c of valid) credits.set(c.person_id, (credits.get(c.person_id) ?? 0) + 1);

  const keep = (id: string) =>
    poolIds.has(id) ||
    (personById.get(id)!.sitelinks >= RULES.castMinSitelinks &&
      (credits.get(id) ?? 0) >= RULES.connectorMinCredits);

  const keptPeople = people.filter((p) => keep(p.id));
  const keptIds = new Set(keptPeople.map((p) => p.id));
  const keptCast = valid.filter((c) => keptIds.has(c.person_id));

  const filmCredits = new Map<string, number>();
  for (const c of keptCast) filmCredits.set(c.movie_id, (filmCredits.get(c.movie_id) ?? 0) + 1);
  const keptFilms = films.filter((f) => (filmCredits.get(f.id) ?? 0) >= 2);
  const filmIds = new Set(keptFilms.map((f) => f.id));
  const finalCast = keptCast.filter((c) => filmIds.has(c.movie_id));

  const now = new Date().toISOString();
  await putStage(
    "connect_people",
    keptPeople.map((p) => ({
      id: p.id,
      name: p.name,
      notability: p.sitelinks,
      birth_year: p.birth_year,
      image_file: p.image_file,
      image_attribution_url: p.image_file
        ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.image_file)}`
        : null,
      challenge_eligible: poolIds.has(p.id),
      coverage_status: poolIds.has(p.id) ? "playable" : "connector",
      credit_count: credits.get(p.id) ?? 0,
      hydrated_at: poolIds.has(p.id) ? now : null,
    })),
  );
  await putStage(
    "connect_movies",
    keptFilms.map((f) => ({ id: f.id, title: f.title, year: f.year, notability: f.sitelinks })),
  );
  await putStage(
    "connect_cast",
    finalCast.map((c) => ({
      movie_id: c.movie_id,
      person_id: c.person_id,
      billing: c.billing,
      character_name: (c.character_qid && chars.get(c.character_qid)) || null,
    })),
  );

  // Anything still flagged playable but outside the hydrated pool must lose
  // endpoint eligibility, otherwise it stays selectable without coverage.
  for (const batch of chunked([...keptIds].filter((id) => poolIds.has(id)), 1000)) void batch;
  const { error: demoteErr } = await db
    .from("connect_people")
    .update({ coverage_status: "connector", challenge_eligible: false, hydrated_at: null })
    .eq("coverage_status", "playable")
    .lt("hydrated_at", now);
  if (demoteErr) throw demoteErr;

  await setStats(run, {
    playable: keptPeople.filter((p) => poolIds.has(p.id)).length,
    connectors: keptPeople.filter((p) => !poolIds.has(p.id)).length,
    films: keptFilms.length,
    edges: finalCast.length,
  });
  await setStage(run, "done", "done");
  console.log("promote: done", run.stats);
  return true;
}

/* ------------------------------------------------------------------ main */

async function status(run: Run) {
  const stages = ["films", "casts", "people", "chars"] as const;
  const out: Record<string, number> = {};
  for (const s of stages) out[s] = await pendingCount(run, s);
  console.log({ run: run.id, stage: run.stage, status: run.status, stats: run.stats, pending: out });
}

const run = await resumeRun();
const cmd = process.argv[2];

if (cmd === "status") {
  await status(run);
} else if (cmd === "promote") {
  await promote(run);
} else {
  for (;;) {
    if (outOfBudget()) {
      console.log(`budget reached at stage "${run.stage}" — rerun to resume`);
      break;
    }
    if (run.stage === "pool") await stagePool(run);
    else if (run.stage === "films") { if (!(await stageFilms(run))) break; }
    else if (run.stage === "casts") { if (!(await stageCasts(run))) break; }
    else if (run.stage === "people") { if (!(await stagePeople(run))) break; }
    else if (run.stage === "chars") { if (!(await stageChars(run))) break; }
    else if (run.stage === "promote") { await promote(run); break; }
    else break;
  }
  await status(run);
}
