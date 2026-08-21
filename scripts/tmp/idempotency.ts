import { tmdbSource } from "@/lib/catalog/tmdb.server";
import { upsertCredits, upsertMovies, upsertPeople } from "../tmdb/upsert";
const movie = await tmdbSource.getMovie("533535");
const cast = await tmdbSource.getMovieCast("533535");
const m = await upsertMovies([movie!]);
const p = await upsertPeople(cast.map((c) => c.person));
const n = await upsertCredits(cast.map((c) => c.credit), m, p);
console.log("re-upserted credits:", n);
