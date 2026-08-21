import { MOVIES } from "@/games/higherlower/data/movies";
const pool = MOVIES.filter(m=>Number.isFinite(m.boxOfficeM)&&m.boxOfficeM>=80);
console.log("pool", pool.length, "total", MOVIES.length);
const fr=new Set(pool.map(m=>m.title.toLowerCase().split(/[:–—]/)[0]!.replace(/[^a-z0-9 ]+/g,"").trim()));
console.log("franchises", fr.size);
