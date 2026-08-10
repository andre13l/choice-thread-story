# Plan: From single Hollywood game to multi-game cinema site

## Current state (verified in code)

- TanStack Start app with two routes: `/` (hub listing PATHS with 4 locked teasers) and `/hollywood` (playable game, 622-line route file).
- `src/game/`: pure, data-driven engine (`engine.ts`, `types.ts`, `rng.ts`, `scoring.ts`, `storage.ts`, `config.ts`) + 88 authored events in `events/early|mid|late.ts` (~3,300 lines).
- Already present and reusable: flags/memory (`CareerFlags`, `history`), follow-up chaining (`forceEventId`, `queuedEventId`), anti-repeat window (`recentEventIds`), hidden stats, seeded RNG support (`createLocal`), seeded RNG utilities (`rng.ts`), localStorage persistence namespaced `paths.v1.hollywood.*`, the hidden LEGEND chain (`legend_signal` → `legend_gamble`, config in `config.ts`, never leaked to UI).
- No backend yet (Lovable Cloud not enabled). Percentile is a local simulation with a documented swap point in `scoring.ts`.

## Product decisions

**Brand neutrality.** Introduce `src/config/site.ts` with `SITE_NAME`, `SITE_TAGLINE`, storage key prefix. All copy, storage keys, share text and head metadata read from it. "PATHS" stays as the provisional value; renaming later is a one-line change. Route paths (`/hollywood`, `/higher-lower`, ...) contain no brand.

**The hub.** `/` becomes a games hub: HOLLYWOOD (flagship, "How far can you make it?"), HIGHER / LOWER, the multiplayer deduction game (working title "GUESS THE FILM"), and one locked placeholder slot for the future daily game. Same minimal editorial design language; no win/loss vocabulary anywhere.

**Copy discipline carried over.** No game or page (including leaderboards and the Walk of Fame) ever states completion rules, probabilities, or that Hollywood can be "beaten". Walk of Fame copy: "No one has their name here. Yet."

## Route map

```text
/                        games hub (rework of current index)
/hollywood               flagship game (existing route, UI refactored)
/hollywood/walk-of-fame  mysterious empty monument page
/higher-lower            endless solo game, metric picker + per-metric leaderboards
/guess                   create/join a room (deduction game lobby)
/guess/$roomId           live multiplayer room
/daily                   reserved placeholder ("Soon") — no mechanic decided
```

## Codebase restructure

Keep everything that works; reorganize for multiple games:

```text
src/config/site.ts            brand + storage prefix (single source)
src/games/core/               rng.ts, shared types, formatting (moved, unchanged logic)
src/games/hollywood/          engine.ts, types.ts, scoring.ts, storage.ts, config.ts,
                              content/ (existing 88 events), world/ (new), screens/ (UI
                              split out of the 622-line route file)
src/games/movies/             shared canonical movie dataset access (Higher/Lower +
                              Guess + future daily game all read the same films)
src/games/higher-lower/       game logic + screens
src/games/guess/              room client logic + question bank + screens
```

## Hollywood engine v2 (evolve, don't replace)

The current flat event arrays become one ingredient in a richer mixer. All 88 existing events and the LEGEND chain stay valid content.

1. **World state** — new `world` object on `GameState` (versioned save migration): named studios with prestige, 8–12 recurring **named characters** (directors, agents, rivals, producers — generated from name pools at career start, with relationship/power/active state), and a "films you passed on" ledger. `advanceWorld()` runs each turn alongside `advanceTime()`: directors rise and fall, rivals win awards, studios merge.
2. **Event templates / variants** — new `EventTemplate` type alongside `GameEvent`. A template (e.g. `role_offer`) has slots — studio, director, genre, budget tier, role size — filled from content pools **and live world state** ("Mara Ellison wants you for her $8M grief drama"). Selection mixes authored events + generated variants with per-template cooldowns and per-career caps, so repetition collapses while authored set-pieces still land.
3. **First-class chains** — generalize `forceEventId` into chain definitions (ordered stages with branches and chain state). Migrate the production-company and LEGEND chains onto it; add new multi-year arcs (feud, mentorship, comeback).
4. **Memory** — keep `flags`/`history`; add query helpers (by tag, by character, by decision) that eligibility and variant generation consult. Rejected offers come back 2–5 years later as world events: the film got made — with your rival — and now you read about it.
5. **Downfall director** — replace `checkEnd`'s mostly age-driven wind-down. The engine accumulates vulnerabilities (debt, burnout, scandal flags, ego/fame gap, fading relevance, isolation). Endings are drawn from ending classes weighted by the dominant vulnerability: bankruptcy, scandal, irrelevance, eccentric isolation, humiliation, death. Mid-career disasters stay recoverable (collapse → comeback → larger collapse is a supported arc). No retirement endings; LEGEND remains the sole hidden escape, thresholds and odds in `config.ts` untouched.
6. **Career length** — emergent: weak careers end fast (ruin, burnout, irrelevance), extraordinary ones run long via sustained relevance, not a fixed age cap.
7. **Deterministic runs (for Walk of Fame verification)** — switch the UI's `Math.random` to the existing seeded RNG and log choices per turn. Cheap now, and it lets the server re-simulate a claimed LEGEND run from seed + choices before engraving a star (M5).

## Backend (Lovable Cloud) — only what's needed

Enabled at M4. No accounts required to play anything; an anonymous local handle + client token identifies leaderboard entries. No real names, DOB, location — nothing personal.

| Data | Why | Lifetime |
|---|---|---|
| `movies` table (~400 curated films: title, year, box office, budget, rating, runtime, Oscars/noms) | Shared dataset for Higher/Lower + Guess options + future daily game; updatable without redeploy | Permanent, public read |
| `hl_scores` (metric, streak, handle) | Higher/Lower per-metric leaderboards | Permanent, top-N per metric |
| `walk_of_fame` (handle, date, verified career snapshot) | Only verified LEGEND runs; a high score can never insert here | Permanent, append-only |
| `rooms` + round state | Guess multiplayer; realtime via Supabase Realtime (presence + broadcast), table holds room metadata | Ephemeral: `expires_at`, cron cleanup |
| `stats_daily` (aggregate counters: careers played, score distribution buckets) | Replaces the simulated percentile with real data via the existing `scoring.ts` swap point | Aggregates only, no run logs |

Explicitly **not** stored: normal Hollywood runs, per-event decisions, any personal data. Hollywood stays fully local (current `storage.ts` pattern, key prefix moved to site config).

## Milestones (Hollywood quality first)

- **M1 — Shell & brand neutrality.** `site.ts` config, hub rework with 4 slots, code reorg into `src/games/`, split `hollywood.tsx` into screens. Zero behavior change.
- **M2 — Hollywood world state + characters + variants.** `world` state, named characters, `advanceWorld`, template/variant generator, mixed selection with cooldowns. Biggest perceived-quality jump.
- **M3 — Hollywood chains, memory, downfall director.** Chain system, rejected-film callbacks, ending classes by vulnerability, emergent career length. Seeded deterministic runs.
- **M4 — Lovable Cloud + Higher/Lower.** Enable Cloud, `movies` dataset, endless game with metric picker, per-metric leaderboards (`hl_scores`).
- **M5 — Walk of Fame.** Page with mysterious empty state; server-verified LEGEND recording via deterministic re-simulation; no other path to a star.
- **M6 — Guess the Film multiplayer.** Rooms (create/join by code), Supabase Realtime, rotating chooser, controlled movie option set, large yes/no question bank, round scoring, ephemeral expiry.
- **M7 — Daily game slot.** Placeholder already live since M1; mechanic decided later. Architecture (movies dataset, handle identity, `stats_daily`) already supports streak-style daily results.

Before any public launch: flip `TEST_MODE` to `false` in `src/games/hollywood/config.ts` (restores ~1/1,000,000 LEGEND rarity).

## Technical details

- Engine stays pure/React-free; screens import it. All new systems (`world`, templates, chains) are additive fields on `GameState` with a save-version migration so existing localStorage runs don't crash.
- Multiplayer uses Supabase Realtime channels (broadcast + presence) for gameplay traffic; Postgres only for room metadata and final round scores. Room codes are short human-readable strings; rooms auto-expire.
- LEGEND verification: server function re-runs the career from the submitted seed + choice log through the same engine module (shared import) and only writes `walk_of_fame` if the re-simulation reproduces the LEGEND outcome. Nothing about the thresholds is ever sent to or rendered by the client.
- RLS: public `SELECT` on `movies` and leaderboard reads; inserts via server functions with validation; `walk_of_fame` insert only from the verification path; room tables scoped to room members.
- Higher/Lower comparisons run client-side against the public dataset; the server stores only the final streak per metric (validated for plausibility bounds).
