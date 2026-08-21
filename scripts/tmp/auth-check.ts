import { tmdbSource } from "@/lib/catalog/tmdb.server";
const p = await tmdbSource.searchPerson("Hugh Jackman");
console.log("person:", p?.sourceId, p?.name);
const m = await tmdbSource.searchMovie("Deadpool & Wolverine", 2024);
console.log("movie:", m?.sourceId, m?.title, m?.year);
