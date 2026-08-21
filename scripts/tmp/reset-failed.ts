import { db } from "../tmdb/store";
const { data } = await db.from("connect_sync_items").select("job_id,kind,ref_id").eq("status","failed");
for (const r of data ?? []) {
  await db.from("connect_sync_items").update({ status: "pending", attempts: 0, last_error: null }).match(r);
}
console.log("reset", data?.length ?? 0);
