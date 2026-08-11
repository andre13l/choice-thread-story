# Plan: Higher / Lower v2 — dataset, timer, persistent highscores

## Current state (verified in code)

- `src/games/higherlower/`: pure engine (`engine.ts`), 226-film static array (`data/movies.ts`), localStorage bests (`storage.ts`), one UI file (`HigherLowerGame.tsx`). No timer; reveal settles on an 800 ms timeout.
- Engine is already seeded (mulberry32 via `src/games/core/rng.ts`) and `drawMovie` already accepts an injectable `pool` — server re-simulation and dataset swap need no engine rewrite.
- No backend: Lovable Cloud is not enabled, no `src/integrations/`, no Supabase deps. `src/start.ts` has no bearer `functionMiddleware` yet.

## Assumptions (correct me if wrong)

- Movie source: **TMDB API** (free key, reputable, has all required fields incl. popularity, poster paths, credits). Their terms require an attribution notice ("This product uses the TMDB API but is not endorsed or certified by TMDB") on About/footer, and posters must be hotlinked from `image.tmdb.org`, not re-hosted. Commercial use may need a separate TMDB agreement — flagging for you to confirm; fallback is Wikidata/OMDb if that is a blocker.
- We DO need minimal user profiles (a display handle) because leaderboards need names. Profile = handle only, nothing else.
- Login methods: email/password + Google (Cloud defaults).

## Part 1 — Massive movie dataset (own DB, no runtime external calls)

**Table `movies`** (one row per film, ~300 bytes): `tmdb_id` (unique, stable external id), `title`, `year`, `box_office_m`, `budget_m`, `rating`, `runtime_min`, `popularity`, `genres text[]`, `poster_path` (path only, hotlinked), `top_cast jsonb` (top 5 cast + director names — enough for the future deduction/graph games; no separate credits table yet), `updated_at`. 10k rows ≈ 3 MB. Public `SELECT TO anon`, writes service-role only.

**Ingestion**: `scripts/ingest-movies.ts` run locally with bun (env: `TMDB_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Pulls TMDB `discover` by decade with `vote_count.gte` + popularity thresholds so classics are represented alongside recent hits, upserts ~5–10k recognizable titles in minutes. Re-run quarterly to refresh; old films' figures are static. Production runtime never calls TMDB.

**Gameplay reads**: `getMovieCatalogue` public server fn returns a compact columnar payload (id, title, year, 5 metrics, popularity) + `catalogue_version`. ~500 KB raw / ~150–250 KB gzip for 10k films; client fetches once per session and caches (memory + sessionStorage keyed by version). Posters deliberately excluded from the bundle — stored in the table for future use. Engine's existing `pool` parameter consumes it; `metricValue`/formatting unchanged.

## Part 2 — Timer (pure frontend, zero backend)

- New `src/games/higherlower/config.ts`: `timePerComparisonMs = 8000`, `warningMs = 3000`, plausibility cap (Part 3). Single source, mirrors Hollywood's config pattern.
- **Deadline-based**, not tick-counting: `deadline = Date.now() + 8000` stored per round in the reducer; UI re-renders via a short interval. Backgrounding a tab does not pause the clock (no free thinking time); on return the timeout fires immediately. New `timeout` action = loss → reveal actual value, game-over copy "Out of time".
- UI: thin full-width progress bar under the streak header, shrinks left-to-right, turns `text-danger` under 3 s with a subtle pulse. No large numerals. Keyboard arrows unchanged.

## Part 3 — Login + daily / all-time highscores

**Auth**: enable Lovable Cloud. New public `/auth` route (email/password + Google via `lovable.auth.signInWithOAuth`; `configure_social_auth` at build time). Anonymous play is untouched — sign-in is only a nudge on the game-over screen. Handle captured at signup (fallback: `Player-XXXX`). Register bearer `functionMiddleware` in `src/start.ts` (append, keep existing middleware).

**Tables** (upsert-only, no run history):
- `profiles`: `user_id`, `handle`. Public select, own-row write.
- `hl_alltime`: `(user_id, metric)` PK, `best int`, `updated_at`. Max 5 rows/user, forever.
- `hl_daily`: `(user_id, metric, day)` PK, `best int`. One row per user per metric per active day; cron deletes rows older than 30 days.
- `hl_run_tokens`: `(id, user_id, metric, seed, catalogue_version, used_at)` — single-use run seeds, deleted on use + daily cron cleanup.

**Storage math**: ~80 bytes/row. 1M registered users → `hl_alltime` ≈ 5M rows ≈ 400 MB worst case (realistic: far less). 100k daily players × 2 modes × 30-day retention ≈ 6M rows ≈ 500 MB–1 GB worst case; 7-day retention quarters that. Nothing else grows.

**Anti-cheat (the core ask: DevTools can't submit a fake score)**:
1. `startHlRun` server fn (auth) mints a single-use seed token storing `seed` + `catalogue_version` (2 h validity).
2. Client plays from that seed; on game over, `submitHlRun` sends `{ tokenId, guesses: "hlhlh…", durationMs }` — never a score.
3. Server consumes the token (rejects re-use/expiry), re-runs `seed + guesses` through the **same shared engine module** against the deterministic pool ordering for that `catalogue_version`, computes the true streak, rejects implausible values (cap ~60) and inhuman durations (< streak × 1 s), then upserts `hl_alltime`/`hl_daily` with `GREATEST`.
4. A bare fabricated score is impossible (server derives it); a replayed token is rejected; fabricating 200 correct guesses requires re-simulating the client itself — accepted residual risk for a casual game, bounded by the cap.
Anonymous runs keep a client-side random seed and never touch the server.

**Leaderboards**: `/higher-lower/leaderboard` route — metric tabs, Daily / All-time toggle, top 50 + your rank/personal best (indexes on `(metric, day, best desc)` and `(metric, best desc)`). Game-over screen gains "Sign in to compete" (anonymous) or "New daily/all-time best" (signed-in).

## What stays local

The entire game loop (draw, compare, reveal), timer, anonymous bests + rounds counter, and all of Hollywood. The server only stores the catalogue and per-(user, metric[, day]) best rows.

## Files to change

```text
scripts/ingest-movies.ts                new — TMDB → movies upsert (run manually)
supabase migration                      movies, profiles, hl_alltime, hl_daily,
                                        hl_run_tokens + grants + RLS + indexes + cron
src/games/movies/catalogue.ts           new — shared types + compact payload mapping
src/lib/movies.functions.ts             new — getMovieCatalogue (public),
                                        startHlRun / submitHlRun / getHlLeaderboard (auth)
src/games/higherlower/config.ts         new — timer, cap, cache settings
src/games/higherlower/engine.ts         pool injection + exported simulateRun() validator
src/games/higherlower/HigherLowerGame.tsx  timer UI, timeout action, submit flow
src/games/higherlower/storage.ts        unchanged (anonymous bests)
src/routes/auth.tsx                     new — sign-in/sign-up + handle
src/routes/higher-lower/leaderboard.tsx new — daily/all-time boards
src/routes/about.tsx                    TMDB attribution line
src/components/site/SiteHeader.tsx      Sign in link
src/start.ts                            append bearer functionMiddleware
```

## Build order (credit-lean, each phase independently shippable)

1. **Timer** — 3 files, no backend, immediate feel.
2. **Dataset** — enable Cloud, `movies` migration, ingestion script (needs your free TMDB key in Project Settings → Secrets), catalogue endpoint + client cache. Gameplay instantly feels bigger.
3. **Scores** — auth, profiles, tokens, validated submission, leaderboards. Largest phase; everything above works without it.

## Technical details

- Determinism contract: catalogue payload is ordered by `tmdb_id`; `simulateRun(seed, metric, guesses, pool)` is pure and imported by both the client and `submitHlRun`. Token's `catalogue_version` must match the current one or the run is rejected (only possible during an ingest window).
- Timer uses one interval per round, cleared on unmount; no `setInterval` accumulation across rounds.
- RLS: `movies` + leaderboard reads `TO anon`; `hl_alltime`/`hl_daily`/`hl_run_tokens` own-row policies via `context.supabase` in `requireSupabaseAuth` fns; `profiles` public select on handle only.
- Cron: pg_cron jobs for `hl_daily` retention and token cleanup, created in the same migration.
- Hub gains a leaderboard entry point on the Higher/Lower card; no Hollywood or Walk of Fame changes.
