/**
 * Durable ingestion state for the TMDB pipeline.
 *
 * Every unit of work lives in Supabase (`connect_sync_jobs` /
 * `connect_sync_items`), never on local disk. A sandbox reset costs at most
 * the in-flight batch: re-running the driver resumes from the queue.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const db: SupabaseClient = createClient(
  process.env["SUPABASE_URL"]!,
  process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  { auth: { persistSession: false } },
);

export type ItemKind = "person" | "person_credits" | "movie_cast";
export type Stage = "seed" | "person_credits" | "movie_cast" | "promote" | "done";

export interface Job {
  id: string;
  label: string;
  stage: Stage;
  status: string;
  stats: Record<string, unknown>;
}

export function chunked<T>(rows: T[], size = 500): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

export async function resumeJob(label = "tmdb"): Promise<Job> {
  const { data, error } = await db
    .from("connect_sync_jobs")
    .select("id, label, stage, status, stats")
    .eq("label", label)
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  if (data?.[0]) return data[0] as Job;

  const { data: created, error: insErr } = await db
    .from("connect_sync_jobs")
    .insert({ label, source: "tmdb", status: "running", stage: "seed" })
    .select("id, label, stage, status, stats")
    .single();
  if (insErr) throw insErr;
  return created as Job;
}

export async function setJob(job: Job, patch: Partial<Record<string, unknown>>) {
  Object.assign(job, patch);
  const { error } = await db
    .from("connect_sync_jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", job.id);
  if (error) throw error;
}

export async function seedItems(job: Job, kind: ItemKind, refIds: string[]) {
  for (const batch of chunked([...new Set(refIds)])) {
    const { error } = await db.from("connect_sync_items").upsert(
      batch.map((ref_id) => ({ job_id: job.id, kind, ref_id })),
      { onConflict: "job_id,kind,ref_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
}

export async function claim(job: Job, kind: ItemKind, limit: number): Promise<string[]> {
  const { data, error } = await db
    .from("connect_sync_items")
    .select("ref_id")
    .eq("job_id", job.id)
    .eq("kind", kind)
    .neq("status", "ready")
    .lt("attempts", 5)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => row.ref_id as string);
}

export async function pendingCount(job: Job, kind: ItemKind): Promise<number> {
  const { count, error } = await db
    .from("connect_sync_items")
    .select("ref_id", { count: "exact", head: true })
    .eq("job_id", job.id)
    .eq("kind", kind)
    .neq("status", "ready");
  if (error) throw error;
  return count ?? 0;
}

export async function markReady(job: Job, kind: ItemKind, refIds: string[]) {
  for (const batch of chunked(refIds)) {
    const { error } = await db.from("connect_sync_items").upsert(
      batch.map((ref_id) => ({
        job_id: job.id,
        kind,
        ref_id,
        status: "ready",
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "job_id,kind,ref_id" },
    );
    if (error) throw error;
  }
}

export async function markFailed(job: Job, kind: ItemKind, refIds: string[], message: string) {
  for (const ref_id of refIds) {
    const { data } = await db
      .from("connect_sync_items")
      .select("attempts")
      .eq("job_id", job.id)
      .eq("kind", kind)
      .eq("ref_id", ref_id)
      .maybeSingle();
    await db.from("connect_sync_items").upsert(
      {
        job_id: job.id,
        kind,
        ref_id,
        status: "failed",
        attempts: ((data?.attempts as number) ?? 0) + 1,
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "job_id,kind,ref_id" },
    );
  }
}

export async function refreshCounts(job: Job) {
  const total = await countBy(job, null);
  const ready = await countBy(job, "ready");
  const failed = await countBy(job, "failed");
  await setJob(job, { total_items: total, done_items: ready, failed_items: failed });
}

async function countBy(job: Job, status: string | null): Promise<number> {
  let query = db
    .from("connect_sync_items")
    .select("ref_id", { count: "exact", head: true })
    .eq("job_id", job.id);
  if (status) query = query.eq("status", status);
  const { count } = await query;
  return count ?? 0;
}
