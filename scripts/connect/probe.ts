/** Throwaway measurement: how many feature films does a batch of actors have? */
import { sparql, qid, values, chunk } from "./wikidata";

const ACTORS = process.argv.slice(2);

const filmQuery = (ids: string[]) => `
SELECT ?actor ?film ?filmLabel ?year ?sitelinks WHERE {
  ${values("actor", ids)}
  ?film wdt:P161 ?actor ;
        wdt:P31/wdt:P279* wd:Q11424 ;
        wikibase:sitelinks ?sitelinks .
  FILTER NOT EXISTS { ?film wdt:P31/wdt:P279* wd:Q24862 }
  FILTER NOT EXISTS { ?film wdt:P31/wdt:P279* wd:Q93204 }
  OPTIONAL { ?film wdt:P577 ?date }
  BIND(YEAR(?date) AS ?year)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;

const rows = [] as { actor: string; film: string; title: string; year: number; sitelinks: number }[];
for (const batch of chunk(ACTORS, 10)) {
  const t = Date.now();
  const bindings = await sparql(filmQuery(batch));
  console.log(`batch ${batch.length} -> ${bindings.length} rows in ${Date.now() - t}ms`);
  for (const b of bindings) {
    rows.push({
      actor: qid(b["actor"]?.value),
      film: qid(b["film"]?.value),
      title: b["filmLabel"]?.value ?? "",
      year: Number(b["year"]?.value ?? 0),
      sitelinks: Number(b["sitelinks"]?.value ?? 0),
    });
  }
}
const byActor = new Map<string, Set<string>>();
for (const r of rows) (byActor.get(r.actor) ?? byActor.set(r.actor, new Set()).get(r.actor)!).add(r.film);
for (const [a, films] of byActor) console.log(a, films.size);
console.log("distinct films", new Set(rows.map((r) => r.film)).size);
console.log(rows.filter((r) => /Break-Up|Swingers|Informant|Forrest/i.test(r.title)).slice(0, 10));
