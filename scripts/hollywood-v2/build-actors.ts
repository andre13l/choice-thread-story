/**
 * HOLLYWOOD V2 — actor bank build.
 *
 * Derives `public/data/hollywood-actors.json` from the shipped Connect
 * snapshot (`public/data/connect-graph.json`), so the casting pool and the
 * rest of the platform share one catalogue identity (Wikidata QIDs, aligned
 * with the TMDB-backed backend tables) instead of a second movie database.
 *
 * A person qualifies as castable when they actually appear in the graph's
 * cast edges (so Barack Obama does not audition), clear a notability floor,
 * and have a plausible birth year. Portraits stay as Wikimedia Commons file
 * names — rendered via Special:FilePath with attribution, never rehosted.
 *
 *   bun scripts/hollywood-v2/build-actors.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

interface RawDataset {
  people: [string, string, number, string, number, (0 | 1)?][];
  films: [string, string, number, number][];
  cast: [number, number, string][][];
}

const raw = JSON.parse(readFileSync("public/data/connect-graph.json", "utf8")) as RawDataset;

const NOTABILITY_FLOOR = 12;
const MIN_CREDITS = 2;
const MAX_ACTORS = 4200;
const TOP_CREDITS = 4;

const filmByIndex = raw.films;
const perPerson = new Map<number, { filmIndex: number; billing: number }[]>();
raw.cast.forEach((entries, filmIndex) => {
  for (const [personIndex, billing] of entries) {
    if (!perPerson.has(personIndex)) perPerson.set(personIndex, []);
    perPerson.get(personIndex)!.push({ filmIndex, billing });
  }
});

interface ActorRow {
  id: string;
  name: string;
  notability: number;
  image: string;
  birthYear: number;
  credits: [string, number][];
}

const out: ActorRow[] = [];
raw.people.forEach(([qid, name, notability, image, birthYear], index) => {
  if (notability < NOTABILITY_FLOOR) return;
  if (!name || /^Q\d+$/.test(name)) return;
  if (birthYear < 1850 || birthYear > 2012) return;
  const appearances = perPerson.get(index) ?? [];
  if (appearances.length < MIN_CREDITS) return;

  // Top credits: billing order breaks ties behind film notability.
  const credits = appearances
    .map(({ filmIndex, billing }) => {
      const film = filmByIndex[filmIndex];
      if (!film) return null;
      const [, title, year, filmNotability] = film;
      if (!title || /^Q\d+$/.test(title)) return null;
      return { title, year, score: filmNotability * 100 - billing };
    })
    .filter((c): c is { title: string; year: number; score: number } => c !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_CREDITS)
    .map((c) => [c.title, c.year] as [string, number]);
  if (credits.length === 0) return;

  out.push({ id: qid, name, notability, image: image ?? "", birthYear, credits });
});

out.sort((a, b) => b.notability - a.notability);
const actors = out.slice(0, MAX_ACTORS);

const payload = {
  version: new Date().toISOString().slice(0, 10),
  source: "NIRCOSI catalogue (Wikidata CC0 identities + Wikimedia Commons portraits; TMDB-aligned)",
  count: actors.length,
  // Compact tuples: [qid, name, notability, imageFile, birthYear, [[title, year], ...]]
  actors: actors.map((a) => [a.id, a.name, a.notability, a.image, a.birthYear, a.credits]),
};

mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/hollywood-actors.json", JSON.stringify(payload));

const withImage = actors.filter((a) => a.image).length;
const bands = [180, 110, 60, 35, 18, 0];
const dist = bands.map(
  (floor, i) => actors.filter((a) => a.notability >= floor && (i === 0 || a.notability < bands[i - 1]!)).length,
);
console.log(`actors: ${actors.length} (${withImage} with portrait)`);
console.log(`notability bands [>=180,>=110,>=60,>=35,>=18,<18]: ${dist.join(" / ")}`);
console.log(`sample: ${actors.slice(0, 3).map((a) => `${a.name}(${a.notability})`).join(", ")}`);
