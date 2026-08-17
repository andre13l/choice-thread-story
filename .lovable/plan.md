# Connect data architecture — read-only audit (no code or data changed)

## 1. Source of truth today

There are two copies of the catalogue, and **gameplay reads the static file, not the database**.

- Static snapshot: `public/data/connect-graph.json` — 2.42 MB raw, ~870 KB gzipped. Header fields: `source: "Wikidata (CC0) + Wikimedia Commons image metadata phase1"`. Contents: 24,969 people, 2,530 films, 52,701 cast rows.
- Runtime loader: `src/games/connect/data/dataset.ts` → `loadGraph()` does `fetch("/data/connect-graph.json")` and builds the in-memory bipartite graph via `buildGraph()`. It memoises into a module-level `cached` promise (one fetch per browser tab session).
- Consumers: `src/games/connect/useGraph.ts` → `ConnectGame.tsx` and `src/routes/connect.daily.tsx`. All navigation, cast lists, filmographies, search/filter (`components/Browse.tsx`, plain `String.includes` over the in-memory arrays), BFS (`graph.ts`), challenge generation (`graph.ts` / `popularity.ts`) and daily fallback (`daily.ts`) run entirely client-side against that JSON.

Supabase is used for Connect only at the edges:
- `src/lib/connect.functions.ts` → `getCatalogCounts()` reads the `connect_catalog_counts` view (only feeds the "films · actors · connections" line in `components/GraphStats.tsx`, with the snapshot as fallback) and `getDailyConnect()` reads `daily_connect` + two rows from `connect_people`.
- `src/games/person/person.server.ts` (Daily Person) and `src/games/top10/search.server.ts` (Top 10 autocomplete) read `connect_people` / `connect_movies` / `connect_cast` server-side — these are the only features where the DB is the real source of truth.

Consequence: the DB rows are a mirror for other games; **Connect gameplay never queries them**.

## 2. How the current dataset was produced and imported

- Generation: performed out-of-repo (no generator script exists under `scripts/` — only `daily-checks.ts`, `hollywood-checks.ts`, `hollywood-sim.ts`). The committed artifact is the only record. Rows are positional tuples: people `[qid, name, sitelinks, commonsFile, birthYear]`, films `[qid, title, year, sitelinks]`, cast index-aligned to films as `[personIndex, billingOrder, character]`.
- IDs are Wikidata QIDs for both films and people. No IMDb/TMDB IDs anywhere.
- Observable filters baked into the snapshot: film Wikidata sitelinks ≥ 35 (min 35, median 45, max 137 — this is the ~2.5k cap); film years 1920–2026; cast per film 2–223 (median 18, so cast is not truncated to top-billed); person sitelinks range 0–339 (no person notability floor — people enter via cast membership).
- Build-time pruning in `buildGraph()`: films with fewer than 2 in-graph cast members are dropped, and `personIds` excludes people with zero surviving credits. No connected-component pruning anywhere.
- Import: `src/routes/api/public/connect-import.ts` (POST). It fetches the same `/data/connect-graph.json`, refuses to run if `connect_movies` is non-empty unless `?reset=1` + `x-import-token` header (`CONNECT_IMPORT_TOKEN`), then upserts in 1,000-row chunks using `supabaseAdmin`. It applies its own extra rule: `challenge_eligible = notability >= 45 AND credits >= 3` (constants `MIN_NOTABILITY = 45`, `MIN_CREDITS = 3`).
- Live DB matches the snapshot exactly: 2,530 films, 24,969 people (1,312 `challenge_eligible`, 14,118 with a portrait), 52,701 cast rows.
- Data-quality artifacts found: 4 films have their QID as the title in both the snapshot and the DB (e.g. `Q134773`, a 1994 film with 136 sitelinks) — label resolution failed for those.

## 3. Schema (from `supabase/migrations/`)

- `connect_movies(id text PK, title, year, notability, source default 'wikidata', created_at)`; index on `lower(title)`.
- `connect_people(id text PK, name, notability, birth_year, image_file, image_attribution_url, image_source default 'wikimedia-commons', challenge_eligible bool, source, created_at)`; indexes on `lower(name)` and a partial index on `challenge_eligible WHERE challenge_eligible`.
- `connect_cast(movie_id → connect_movies.id ON DELETE CASCADE, person_id → connect_people.id ON DELETE CASCADE, billing, character_name, PK(movie_id, person_id))`; extra index on `person_id`. No surrogate key — the composite PK makes upserts idempotent.
- `connect_catalog_counts` — `security_invoker` view of four `count(*)` subqueries (films, people, connections, challenge_actors). Full scans; fine today, slow at 500k edges.
- `connect_reports(id uuid, kind CHECK in 5 values, movie_id, person_id, message 1–1000 chars, context jsonb, visitor_key, status CHECK new/reviewing/accepted/rejected, created_at)`; indexes on `created_at DESC` and `(visitor_key, created_at DESC)`. `movie_id`/`person_id` are **not** foreign keys, deliberately — a report can name something not in the catalogue. `BEFORE INSERT` trigger `connect_reports_rate_limit()` caps 10 inserts/hour/visitor_key.
- RLS: catalogue tables are `SELECT USING (true)` for anon; `connect_reports` is INSERT-only for anon (no SELECT policy → nobody can read reports from the client). `daily_connect` is SELECT where `published`. `daily_person` has RLS enabled with no anon policy (server-only, correct).
- IDs everywhere are Wikidata QIDs as `text`, so adding rows requires knowing/minting a QID.

## 4. Would adding a film + cast to Supabase make it playable?

**No.** Connect's board is built purely from `public/data/connect-graph.json`. A DB-only insert would:
- change the counts line in `GraphStats` (via the view),
- become searchable in Daily Top 10 autocomplete and usable by Daily Person,
- have zero effect on Connect navigation, filmographies, BFS or challenge generation.

Cache/runtime specifics that matter for any fix:
- The JSON is served from `public/`, so it is a deploy-time artifact: updating it requires a new build/deploy.
- Browser HTTP caching plus the module-level `cached` promise in `dataset.ts` means returning players can hold a stale graph until a hard reload; the URL is unversioned (no hash/query param), so cache-busting is not currently possible without renaming the file or adding a version query.
- `daily_connect` rows reference person QIDs; the client recomputes `shortestPath` against its local graph, so a graph/DB drift can make a published daily's `optimal_clicks` disagree with what the client computes.

## 5. Scale bottlenecks at 10k–30k films / 200k–500k edges

Current cost is ~2.42 MB raw / 870 KB gz for 53k edges — roughly 46 B/edge gzipped plus per-person overhead.

- Initial download: linear extrapolation puts 200k edges at ~3–4 MB gz and 500k edges at ~8–10 MB gz, with people likely growing to 100k–250k. That is unacceptable as a blocking fetch before first paint on mobile — this is the hard wall, hit well before 10k films.
- Client graph construction: `buildGraph()` allocates one object per person/film plus per-credit arrays and does a sort per person. At 500k edges expect multi-hundred-ms to seconds of main-thread work and 150–400 MB of JS heap; mobile Safari tab crashes become likely.
- Search: `Browse.tsx` filters use linear `toLowerCase().includes` over arrays — fine per-film, but any global search over 250k people would need an index (prefix trie / server search like `top10/search.server.ts` already does).
- Shortest path: BFS in `graph.ts` is O(V+E) with `Map`/string keys (`"person:Q123"`). At 500k edges a full worst-case BFS is ~100–400 ms per call. `generateChallenge` runs up to 400 attempts, each with a BFS, and `dailyChallenge` up to 600 — that is minutes of blocking main thread. This breaks before the download does for the daily fallback path.
- DB: `connect_catalog_counts` full-scan counts, and the import endpoint's 1,000-row chunk upserts (500 sequential round-trips for 500k edges) will exceed request timeouts on a Worker.
- Build/deploy: a multi-MB JSON in `public/` inflates every deploy artifact and the Worker bundle's static assets.

## 6. Evaluation of the Tier-A / Tier-B model

The proposal fits the existing code well and is the right shape, with one correction: the real constraint is **payload and BFS cost**, not actor count, so the tiering must be expressed as edges shipped to the client.

- Tier A (searchable, challenge-eligible, deep coverage): the existing `challenge_eligible` flag already encodes exactly this idea (`notability ≥ 45 && credits ≥ 3`, currently 1,312 people). Reuse the column rather than inventing a new one; consider `tier smallint` if more than two levels are wanted.
- Tier B (connector-only): people who exist as cast rows but whose filmography is not recursively expanded. Important caveat: a Tier-B person with only one in-graph credit adds a dead-end node and inflates payload without ever creating a path. `buildGraph()` already drops zero-credit people; the same logic should drop client-side any Tier-B person with < 2 credits (keep them in the DB for display/attribution, exclude from the shipped graph).
- Risk to watch: Tier-B expansion is what actually creates the missing edges users report (e.g. Vince Vaughn ↔ Jennifer Aniston via *The Break-Up*). Tiering must be applied to *films* too: the current sitelinks ≥ 35 film floor is the direct cause of most reports — every title reported (The Break-Up, Swingers, The Informant!, Picture Perfect, Rumor Has It, Murder Mystery, Wanderlust, The Object of My Affection) is a mainstream English-language film that falls under 35 sitelinks. Verified: none of those titles exist in `connect_movies`.
- Structural recommendation regardless of tiering: make Supabase the single source of truth and generate the client snapshot from it (a build step or a cached server function), so DB inserts and gameplay stop drifting.

## 7. Reports as an ingestion priority queue

Current signal (25 rows, all 2026-08-17): 24 `movie_missing`, 1 `actor_missing_from_movie`, 1 `other`. Free-text only; the same film arrives as "The Break-Up", "The break up Vince Vaughn Jen aniston", "The Breakup", "The break-up" — four rows, one title. Reports are insert-only for anon and readable only via service role, which is correct for a triage queue.

Usable as a queue with additive changes only:
- Add `resolved_movie_id` / `resolved_person_id`, `dedupe_key` (normalised title + year) and a triage `status` transition; the existing `status` CHECK already has `reviewing/accepted/rejected`.
- Rank the queue by distinct `visitor_key` count per `dedupe_key` — "The Break-Up" would immediately be the top item.
- Resolution step: normalised title → Wikidata QID lookup → ingest film + full cast → mark accepted. That turns each report into a concrete ingestion job rather than a text note.
- The `other` report ("use a proper database like TMDB") is worth taking as a real signal about the sitelinks floor, not the storage engine.

## 8. Recommended sequence (not implemented)

1. Freeze the current playable snapshot; add a version/hash to the graph URL so a refreshed catalogue can invalidate browser caches deterministically.
2. Make Supabase authoritative: write a repo-checked-in generator that queries Wikidata and writes into `connect_movies`/`connect_people`/`connect_cast`, and a second step that emits `connect-graph.json` from the DB. Retire the one-shot `connect-import.ts` path once that exists.
3. Lower the film floor deliberately (sitelinks ≥ 35 → a mainstream-cinema rule combining sitelinks, release year and cast overlap with Tier-A people) rather than importing everything; measure resulting edge count before shipping.
4. Introduce explicit tiering columns and generate the client snapshot from Tier A + Tier B people with ≥ 2 in-graph credits, keeping the shipped payload under a fixed budget (suggest ≤ 1.5 MB gz).
5. Backfill the reported titles first, driven by the report queue, and verify each with a targeted path check.
6. Only when the payload budget is exceeded, move BFS/search server-side (a server function over the DB, or a precomputed adjacency binary format) — before that point, keep the client graph, which is what makes Connect feel instant.
7. Re-run `src/games/connect/validate.ts` and `scripts/daily-checks.ts` after every catalogue change, and re-verify that published `daily_connect.optimal_clicks` still matches the client BFS after the graph grows.

Nothing above has been executed; no files, schema or rows were modified during this audit.
