/**
 * Durable ingestion state, persisted in Supabase.
 *
 * Sandbox sessions are ephemeral; catalogue ingestion is not. Every unit of
 * work (an actor to expand, a film to fetch casts for, a person/character to
 * label) is a row in `connect_ingest_items`, and every fetched result lands in
 * the `connect_stage_*` tables. A run therefore resumes from the exact last
 * completed batch after any reset — no local cache is involved.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Stage = "pool" | "films" | "casts" | "people" | "chars" | "promote" | "done";

export const db: SupabaseClient = createClient(
  process.env["SUPABASE_URL"]!,
  process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  { auth: { persistSession: false } },
);

export interface Run {
  id: string;
  label: string;
  stage: Stage;
  status: string;
  stats: Record<string, unknown>;
}

/** Returns the running run for `label`, creating one if none exists. */
export async function resumeRun(label = "connect"): Promise<Run> {
  const { data, error } = await db
    .from("connect_ingest_runs")
    .select("id, label, stage, status, stats")
    .eq("label", label)
    .eq("status", "running")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  if (data?.[0]) return data[0] as Run;

  const { data: created, error: insErr } = await db
    .from("connect_ingest_runs")
    .insert({ label, stage: "pool", status: "running" })
    .select("id, label, stage, status, stats")
    .single();
  if (insErr) throw insErr;
  return created as Run;
}

export async function setStage(run: Run, stage: Stage, status = "running") {
  run.stage = stage;
  const { error } = await db
    .from("connect_ingest_runs")
    .update({ stage, status, updated_at: new Date().toISOString() })
    .eq("id", run.id);
  if (error) throw error;
}

export async function setStats(run: Run, stats: Record<string, unknown>) {
  run.stats = { ...run.stats, ...stats };
  await db
    .from("connect_ingest_runs")
    .update({ stats: run.stats, updated_at: new Date().toISOString() })
    .eq("id", run.id);
}

export async function fail(run: Run, message: string) {
  await db
    .from("connect_ingest_runs")
    .update({ last_error: message.slice(0, 2000), updated_at: new Date().toISOString() })
    .eq("id", run.id);
}

const CHUNK = 500;
export function chunked<T>(rows: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/** Idempotent: re-seeding an existing queue leaves completed items untouched. */
export async function seedItems(run: Run, stage: Stage, ids: string[]) {
  for (const batch of chunked([...new Set(ids)])) {
    const { error } = await db.from("connect_ingest_items").upsert(
      batch.map((item_id) => ({ run_id: run.id, stage, item_id })),
      { onConflict: "run_id,stage,item_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
}

export async function pendingCount(run: Run, stage: Stage): Promise<number> {
  const { count, error } = await db
    .from("connect_ingest_items")
    .select("item_id", { count: "exact", head: true })
    .eq("run_id", run.id)
    .eq("stage", stage)
    .neq("status", "done");
  if (error) throw error;
  return count ?? 0;
}

export async function claim(run: Run, stage: Stage, limit: number): Promise<string[]> {
  const { data, error } = await db
    .from("connect_ingest_items")
    .select("item_id")
    .eq("run_id", run.id)
    .eq("stage", stage)
    .neq("status", "done")
    .lt("attempts", 5)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => r.item_id as string);
}

export async function markDone(run: Run, stage: Stage, ids: string[]) {
  for (const batch of chunked(ids)) {
    const { error } = await db.from("connect_ingest_items").upsert(
      batch.map((item_id) => ({
        run_id: run.id,
        stage,
        item_id,
        status: "done",
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "run_id,stage,item_id" },
    );
    if (error) throw error;
  }
}

export async function markFailed(run: Run, stage: Stage, ids: string[], message: string) {
  for (const id of ids) {
    const { data } = await db
      .from("connect_ingest_items")
      .select("attempts")
      .eq("run_id", run.id)
      .eq("stage", stage)
      .eq("item_id", id)
      .maybeSingle();
    await db.from("connect_ingest_items").upsert(
      {
        run_id: run.id,
        stage,
        item_id: id,
        status: "failed",
        attempts: ((data?.attempts as number) ?? 0) + 1,
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "run_id,stage,item_id" },
    );
  }
}

/** Pages through a staged table (they are far bigger than one PostgREST page). */
export async function stageRows<T>(
  run: Run,
  table: string,
  columns: string,
  order: string,
): Promise<T[]> {
  const rows: T[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .eq("run_id", run.id)
      .order(order)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export async function putStage<T extends object>(table: string, rows: T[]) {
  for (const batch of chunked(rows)) {
    const { error } = await db.from(table).upsert(batch as never);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}
