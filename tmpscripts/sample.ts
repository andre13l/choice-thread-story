import { GRAPH } from "../src/games/connect/graph";
const ppl = Object.values(GRAPH.peopleById);
const pool = ppl.filter(p=>p.movieIds.length>=5 && p.movieIds.some(id=>GRAPH.moviesById[id]!.year>=1995));
const rnd=[...pool].sort(()=>Math.random()-0.5).slice(0,60);
console.log(rnd.map(p=>`${p.name}(${p.movieIds.length})`).join(", "));
const pool8 = ppl.filter(p=>p.movieIds.length>=8);
console.log("\n8+:", [...pool8].sort(()=>Math.random()-0.5).slice(0,40).map(p=>p.name).join(", "));
