/**
 * Wikidata SPARQL client for the CONNECT ingestion pipeline.
 *
 * Wikidata structured data is CC0, which is why it is the only production
 * ingestion source. Adapters for other catalogues can be added next to this
 * file, but none may be used in production without a compatible licence
 * (notably TMDB, whose terms require a commercial agreement).
 */

const ENDPOINT = "https://query.wikidata.org/sparql";
const UA = "NIRCOSI-Connect-Ingest/1.0 (https://nircosi.com; contact via site)";

export interface Binding {
  [key: string]: { value: string } | undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Runs a SPARQL query with polite retry/backoff. Returns raw bindings. */
export async function sparql(query: string, attempt = 0): Promise<Binding[]> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
      "User-Agent": UA,
    },
    body: new URLSearchParams({ query }),
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`wikidata ${res.status} after ${attempt} retries`);
    const wait = Number(res.headers.get("retry-after") ?? 0) * 1000 || 2000 * 2 ** attempt;
    await sleep(wait);
    return sparql(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`wikidata ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = (await res.json()) as { results: { bindings: Binding[] } };
  await sleep(400); // keep well inside the public endpoint's fair-use budget
  return json.results.bindings;
}

export const qid = (uri: string | undefined): string => (uri ?? "").split("/").pop() ?? "";

/** `VALUES ?x { wd:Q1 wd:Q2 }` clause builder. */
export const values = (variable: string, ids: string[]): string =>
  `VALUES ?${variable} { ${ids.map((id) => `wd:${id}`).join(" ")} }`;

export function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}
