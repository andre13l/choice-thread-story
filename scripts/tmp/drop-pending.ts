import { db } from "../tmdb/store";
const { count } = await db.from("daily_connect_candidates").delete({ count: "exact" }).eq("status","pending");
console.log("dropped", count);
