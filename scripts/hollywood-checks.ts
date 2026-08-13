/**
 * Deterministic checks for the Hollywood director path.
 *
 *   bun scripts/hollywood-checks.ts
 *
 * 1. Studio financial model: the number shown on the premiere screen must
 *    always equal the engine's studioResult, computed by one helper.
 * 2. Endgame invariant: every ordinary (non-LEGEND) career must terminate.
 */

import assert from "node:assert/strict";
import { createRng } from "../src/games/core/rng";
import { newCareer, applyFilm, applyAwards, runAwards, endingChance, checkLegend, careerFate } from "../src/games/hollywood/director/career";
import { generateOffers, accessScore } from "../src/games/hollywood/director/offers";
import { generateCast } from "../src/games/hollywood/director/casting";
import { resolveFilm } from "../src/games/hollywood/director/resolve";
import { studioResultOf, studioRentals, rentalsShare } from "../src/games/hollywood/director/finance";
import { hashString } from "../src/games/hollywood/director/names";
import { DIRECTOR_PACING } from "../src/games/hollywood/director/config";
import type { DirectorCareer } from "../src/games/hollywood/director/types";

/* ---------------- 1. finance ---------------- */

assert.equal(rentalsShare(true), 0.47);
assert.equal(studioRentals(543_000, true), 255_210);
assert.equal(studioResultOf(543_000, 580_000, true), -324_790);
assert.equal(studioResultOf(278_000, 360_000, true), -229_340);
assert.equal(studioResultOf(1_800_000, 1_900_000, true), -1_054_000);
assert.equal(studioResultOf(1_000_000, 500_000, false), 350_000);
console.log("finance helper: representative cases OK");

/* ---------------- 2. simulation ---------------- */

const RUNS = Number(process.argv[2] ?? 1200);
const MAX_CYCLES = 400;

let terminal = 0;
let legends = 0;
let escaped = 0;
let financeMismatch = 0;
const ages: number[] = [];
const filmCounts: number[] = [];
const fates = new Map<string, number>();

for (let run = 0; run < RUNS; run++) {
  let career: DirectorCareer = newCareer(run * 7919 + 13);
  const rng = createRng((run * 2654435761) >>> 0);
  let ended = false;
  let legend = false;

  for (let cycle = 0; cycle < MAX_CYCLES && !ended; cycle++) {
    const offers = generateOffers(career);
    const project = offers[Math.floor(rng() * offers.length)]!;
    const pool = generateCast(project, career);
    const cast = pool.slice(0, 2);
    const alloc = { cast: 35, production: 45, marketing: 20 };
    const film = resolveFilm({ project, cast, alloc, career });

    if (film.studioResult !== studioResultOf(film.worldwide, film.budget, film.theatrical !== false)) {
      financeMismatch++;
    }

    const { career: afterFilm } = applyFilm(career, film);
    const awards = runAwards(film, afterFilm);
    career = awards ? applyAwards(afterFilm, awards) : afterFilm;

    const r = createRng((career.seed ^ hashString(`end:${career.cycle}`)) >>> 0);
    if (checkLegend(career, r())) {
      legend = true;
      ended = true;
      break;
    }
    if (r() < endingChance(career)) {
      ended = true;
      career = { ...career, ended: true, fate: careerFate(career) };
    }
  }

  if (legend) {
    legends++;
  } else if (ended) {
    terminal++;
    ages.push(career.age);
    filmCounts.push(career.films.length);
    const key =
      career.money < -3_000_000
        ? "financial ruin"
        : accessScore(career) < 14
          ? "no more offers"
          : career.age >= DIRECTOR_PACING.softEndAge
            ? "aged out"
            : "industry moved on";
    fates.set(key, (fates.get(key) ?? 0) + 1);
  } else {
    escaped++;
  }
}

const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

console.log(`runs: ${RUNS}`);
console.log(`terminal endings: ${terminal} (${((terminal / RUNS) * 100).toFixed(2)}%)`);
console.log(`legend escapes: ${legends}`);
console.log(`never ended within ${MAX_CYCLES} cycles: ${escaped}`);
console.log(`finance mismatches: ${financeMismatch}`);
console.log(`age  median ${med(ages)} max ${Math.max(...ages)}`);
console.log(`films median ${med(filmCounts)} max ${Math.max(...filmCounts)}`);
console.log("ending families:", Object.fromEntries([...fates].sort((a, b) => b[1] - a[1])));

assert.equal(financeMismatch, 0, "engine/UI finance formula diverged");
assert.equal(escaped, 0, "a career escaped without a terminal ending");
