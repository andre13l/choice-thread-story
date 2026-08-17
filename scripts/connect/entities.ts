/**
 * Wikibase entity API client (CC0 structured data, same source as SPARQL).
 *
 * The public SPARQL endpoint is rate-limited and slow for bulk cast
 * extraction; `wbgetentities` returns 50 full entities per request and can be
 * run with modest concurrency, which is what makes a full-catalogue cast
 * hydration practical. Same licence, same data, different transport.
 */

const API = "https://www.wikidata.org/w/api.php";
const UA = "NIRCOSI-Connect-Ingest/1.0 (https://nircosi.com; contact via site)";

export interface Snak {
  mainsnak?: { datavalue?: { value?: unknown } };
  qualifiers?: Record<string, { datavalue?: { value?: unknown } }[]>;
}
export interface Entity {
  id: string;
  labels?: Record<string, { value: string }>;
  sitelinks?: Record<string, unknown>;
  claims?: Record<string, Snak[]>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getEntities(
  ids: string[],
  props: string,
  attempt = 0,
): Promise<Record<string, Entity>> {
  const url = `${API}?action=wbgetentities&format=json&ids=${ids.join("|")}&props=${props}&languages=en&origin=*`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.status === 429 || res.status >= 500) throw new Error(`http ${res.status}`);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = (await res.json()) as { entities?: Record<string, Entity> };
    return json.entities ?? {};
  } catch (err) {
    if (attempt >= 6) throw err;
    await sleep(1000 * 2 ** attempt);
    return getEntities(ids, props, attempt + 1);
  }
}

/** Runs `worker` over `items` with bounded concurrency, preserving order. */
export async function pool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await worker(items[i]!, i);
      }
    }),
  );
  return out;
}

export const claimId = (s: Snak | undefined): string | null => {
  const v = s?.mainsnak?.datavalue?.value as { id?: string } | undefined;
  return v?.id ?? null;
};

export const qualifierId = (s: Snak, prop: string): string | null => {
  const v = s.qualifiers?.[prop]?.[0]?.datavalue?.value as { id?: string } | undefined;
  return v?.id ?? null;
};

export const qualifierString = (s: Snak, prop: string): string | null => {
  const v = s.qualifiers?.[prop]?.[0]?.datavalue?.value;
  return typeof v === "string" ? v : null;
};

export const claimString = (s: Snak | undefined): string | null => {
  const v = s?.mainsnak?.datavalue?.value;
  return typeof v === "string" ? v : null;
};

export const claimYear = (s: Snak | undefined): number | null => {
  const v = s?.mainsnak?.datavalue?.value as { time?: string } | undefined;
  if (!v?.time) return null;
  const year = Number(v.time.slice(1, 5));
  return Number.isFinite(year) && year !== 0 ? year : null;
};
