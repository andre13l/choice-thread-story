/**
 * Catalogue selection rules + shared queries.
 *
 * Kept in their own module so both the legacy cache-based `ingest.ts` and the
 * durable Supabase-backed `run-ingestion.ts` apply exactly the same rules.
 */

import { values } from "./wikidata";

export const RULES = {
  /** Playable pool: recognizable enough that people expect full coverage. */
  poolMinNotability: 80,
  /** Films kept from a playable actor's filmography. */
  filmMinSitelinks: 5,
  filmMinYear: 1920,
  /** Cast members kept per film: everyone above this, plus every playable. */
  castMinSitelinks: 3,
  /** A connector only earns a place in the shipped graph with 2+ credits. */
  connectorMinCredits: 2,
} as const;

export const FILM_CLASSES = ["Q11424", "Q24869", "Q202866", "Q29168811", "Q20650540"];

export const filmQuery = (ids: string[]) => `
SELECT ?actor ?film ?filmLabel ?enName (MIN(?y) AS ?year) (SAMPLE(?sl) AS ?sitelinks) WHERE {
  ${values("actor", ids)}
  VALUES ?class { ${FILM_CLASSES.map((c) => `wd:${c}`).join(" ")} }
  ?film wdt:P161 ?actor ; wdt:P31 ?class ; wikibase:sitelinks ?sl ; wdt:P577 ?date .
  BIND(YEAR(?date) AS ?y)
  OPTIONAL { ?article schema:about ?film ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enName }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} GROUP BY ?actor ?film ?filmLabel ?enName`;
