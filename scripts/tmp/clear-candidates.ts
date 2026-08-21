import { db } from "../tmdb/store";
const { error, count } = await db.from("daily_connect_candidates").delete({ count: "exact" }).neq("id", "00000000-0000-0000-0000-000000000000");
console.log("deleted", count, error?.message ?? "");
