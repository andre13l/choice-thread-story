/**
 * Hollywood balance simulation.
 *
 *   bun scripts/hollywood-sim.ts [runs]
 *
 * Plays N seeded careers with a plausible "decent player" policy and
 * reports the distributions we care about: early success, career length,
 * hit frequency, awards, endings and LEGEND rate. It is a balance probe,
 * not a test — but it also asserts the hard invariants (money continuity,
 * every career terminates).
 */

import assert from "node:assert/strict";
import { createRng } from "../src/games/core/rng";
import {
  applyAwards,
  applyEventChoice,
  applyFilm,
  checkLegend,
  endCareer,
  endingChance,
  newCareer,
  runAwards,
  upkeepFor,
} from "../src/games/hollywood/director/career";
import { generateCast } from "../src/games/hollywood/director/casting";
import { pickEvent } from "../src/games/hollywood/director/events";
import { computePressure, dominantFamily, eventChance } from "../src/games/hollywood/director/pressure";
import { generateOffers } from "../src/games/hollywood/director/offers";
import { resolveFilm } from "../src/games/hollywood/director/resolve";
import { studioResultOf } from "../src/games/hollywood/director/finance";
import type { DirectorCareer, FilmResult, Verdict } from "../src/games/hollywood/director/types";

const RUNS = Number(process.argv[2] ?? 2000);
const MAX_CYCLES = 200;

const filmsPerCareer: number[] = [];
const ages: number[] = [];
const turns: number[] = [];
const verdicts = new Map<Verdict, number>();
const endings = new Map<string, number>();
let totalFilms = 0;
let legends = 0;
let unterminated = 0;
let firstTwoGood = 0;
let firstTwoTotal = 0;
let oscarCareers = 0;
let anyAwardCareers = 0;
let moneyBreaks = 0;
let openingBreaks = 0;
let financeBreaks = 0;

function good(f: FilmResult): boolean {
  return f.studioResult > 0;
}

for (let run = 0; run < RUNS; run++) {
  let c: DirectorCareer = newCareer(run * 7919 + 13);
  const rng = createRng((run * 2654435761) >>> 0);
  let ended = false;
  let turnCount = 0;

  for (let cycle = 0; cycle < MAX_CYCLES && !ended; cycle++) {
    /* --- filmmaking turn: a decent player takes the strongest offer --- */
    const offers = generateOffers(c);
    const project = [...offers].sort(
      (a, b) =>
        b.commercial + b.prestige - b.risk * 0.5 - (a.commercial + a.prestige - a.risk * 0.5),
    )[0]!;
    const pool = generateCast(project, c);
    const cast = [...pool].sort((a, b) => b.draw + b.talent - (a.draw + a.talent)).slice(0, 2);
    const alloc = { cast: 35, production: 45, marketing: 20 };
    const film = resolveFilm({ project, cast, alloc, career: c });
    turnCount++;

    if (film.opening > film.worldwide) openingBreaks++;
    if (film.studioResult !== studioResultOf(film.worldwide, film.budget, film.theatrical !== false))
      financeBreaks++;

    const before = c.money;
    const { career: afterFilm, effects } = applyFilm(c, film);
    if (afterFilm.money !== before + effects.moneyDelta - effects.upkeep) moneyBreaks++;
    if (effects.upkeep !== upkeepFor(c, (afterFilm.months ?? 0) - (c.months ?? 0))) moneyBreaks++;

    const awards = runAwards(film, afterFilm);
    c = awards ? applyAwards(afterFilm, awards) : afterFilm;

    totalFilms++;
    verdicts.set(film.verdict, (verdicts.get(film.verdict) ?? 0) + 1);
    if (c.films.length <= 2) {
      firstTwoTotal++;
      if (good(film)) firstTwoGood++;
    }

    /* --- ending check --- */
    const r = createRng((c.seed ^ (cycle * 2654435761)) >>> 0);
    if (checkLegend(c, r())) {
      legends++;
      ended = true;
      break;
    }
    if (r() < endingChance(c)) {
      const family = dominantFamily(computePressure(c));
      c = endCareer(c, r());
      endings.set(family, (endings.get(family) ?? 0) + 1);
      ended = true;
      break;
    }

    /* --- career event turn --- */
    if (r() < eventChance(c)) {
      const ev = pickEvent(c, computePressure(c), r());
      if (ev) {
        // Policy: prefer the safe branch when already under stress.
        const choice = ev.choices.find((ch) => ch.tone === "safe") ?? ev.choices[0]!;
        const beforeEv = c.money;
        const out = applyEventChoice(c, ev, choice, r());
        const eff = out.effects;
        assert.equal(out.career.money, beforeEv + (eff.money ?? 0));
        c = out.career;
        turnCount++;
      }
    }
  }

  if (!ended) unterminated++;
  filmsPerCareer.push(c.films.length);
  ages.push(c.age);
  turns.push(turnCount);
  if (c.oscars > 0) oscarCareers++;
  if (c.nominations > 0) anyAwardCareers++;
}

/* ---------------- report ---------------- */

function pct(n: number, d: number): string {
  return `${((n / Math.max(1, d)) * 100).toFixed(1)}%`;
}
function stats(xs: number[]): string {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]!;
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  return `mean ${mean.toFixed(1)} · p10 ${q(0.1)} · median ${q(0.5)} · p90 ${q(0.9)} · max ${s[s.length - 1]}`;
}

console.log(`\nHOLLYWOOD BALANCE — ${RUNS} seeded careers\n`);
console.log(`films / career     ${stats(filmsPerCareer)}`);
console.log(`turns / career     ${stats(turns)}`);
console.log(`age at end         ${stats(ages)}`);
console.log(`\nfirst two films profitable   ${pct(firstTwoGood, firstTwoTotal)}`);
console.log(`careers with any nomination  ${pct(anyAwardCareers, RUNS)}`);
console.log(`careers with an Oscar        ${pct(oscarCareers, RUNS)}`);
console.log(`LEGEND                       ${pct(legends, RUNS)} (${legends})`);
console.log(`\nfilm outcomes (${totalFilms} films)`);
for (const [v, n] of [...verdicts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v.padEnd(16)} ${pct(n, totalFilms)}`);
}
console.log(`\nending families`);
for (const [f, n] of [...endings.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${f.padEnd(16)} ${pct(n, RUNS)}`);
}

console.log(`\ninvariants`);
console.log(`  careers that never ended   ${unterminated}`);
console.log(`  net-worth continuity fails ${moneyBreaks}`);
console.log(`  opening > worldwide        ${openingBreaks}`);
console.log(`  studio-result mismatches   ${financeBreaks}`);

assert.equal(moneyBreaks, 0, "net worth must equal previous + take - upkeep");
assert.equal(openingBreaks, 0, "opening weekend cannot exceed worldwide gross");
assert.equal(financeBreaks, 0, "studio result must come from the finance helper");
assert.equal(unterminated, 0, "every non-legend career must terminate");
console.log("\ninvariants OK\n");
