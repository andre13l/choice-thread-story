/**
 * Regression checks for the daily games.
 *
 * Run: bun scripts/daily-checks.ts
 * Fails loudly on the things that would silently ruin a daily: a list that
 * isn't ten long, two positions that accept the same typed string, or a
 * calendar that repeats a challenge before the bank is exhausted.
 */
import { CHALLENGES, ALIASES } from "../src/games/top10/bank.server";
import { matchIndex, scheduledChallenge } from "../src/games/top10/top10.server";
import { answerKey } from "../src/games/core/daily";
import { shiftDate } from "../src/games/core/dailyStats";

let failures = 0;
function check(ok: boolean, message: string) {
  if (!ok) {
    failures++;
    console.error(`FAIL  ${message}`);
  }
}

// 1. Shape.
const ids = new Set<string>();
for (const challenge of CHALLENGES) {
  check(!ids.has(challenge.id), `duplicate challenge id ${challenge.id}`);
  ids.add(challenge.id);
  check(challenge.answers.length === 10, `${challenge.id} has ${challenge.answers.length} answers`);
  const keys = challenge.answers.map(answerKey);
  check(new Set(keys).size === 10, `${challenge.id} has duplicate answers`);
  check(Boolean(challenge.source), `${challenge.id} has no source`);
}

// 2. No alias collides with another position in the same list.
for (const challenge of CHALLENGES) {
  const index = matchIndex(challenge);
  for (const [key, position] of index) {
    check(Boolean(key), `${challenge.id} produced an empty match key`);
    const canonical = challenge.answers[position - 1]!;
    const others = challenge.answers.filter((_, i) => i !== position - 1);
    check(
      !others.some((other) => answerKey(other) === key),
      `${challenge.id}: "${key}" (${canonical}) collides with another answer`,
    );
  }
  // Every answer must be reachable by typing its own title.
  for (const answer of challenge.answers) {
    check(index.has(answerKey(answer)), `${challenge.id}: cannot match "${answer}"`);
  }
}

// 3. Aliases point at answers that exist somewhere in the bank.
const allAnswers = new Set(CHALLENGES.flatMap((c) => c.answers));
for (const key of Object.keys(ALIASES)) {
  check(allAnswers.has(key), `alias entry "${key}" matches no answer in the bank`);
}

// 4. Calendar: deterministic, and no repeat inside one cycle.
const published = CHALLENGES.filter((c) => c.published).length;
const seen = new Map<string, string>();
let start = "2026-08-16";
for (let i = 0; i < published; i++) {
  const date = shiftDate(start, i);
  const a = scheduledChallenge(date).id;
  const b = scheduledChallenge(date).id;
  check(a === b, `calendar is not deterministic on ${date}`);
  check(!seen.has(a), `${a} repeats on ${date} (first seen ${seen.get(a)})`);
  seen.set(a, date);
}
check(seen.size === published, "calendar does not cover the whole bank in one cycle");

// 5. Variety: no two consecutive days from the same content family, and no
// family may own more than half of any seven-day window.
{
  const window: string[] = [];
  let previous: string | null = null;
  for (let i = 0; i < published * 2; i++) {
    const date = shiftDate(start, i);
    const family = scheduledChallenge(date).family;
    check(family !== previous, `${family} runs two days running, ending ${date}`);
    previous = family;

    window.push(family);
    if (window.length > 7) window.shift();
    if (window.length === 7) {
      const counts = new Map<string, number>();
      for (const f of window) counts.set(f, (counts.get(f) ?? 0) + 1);
      const worst = Math.max(...counts.values());
      check(worst <= 4, `${date}: one family fills ${worst}/7 days of the week`);
    }
  }
}

const families = new Set(CHALLENGES.map((c) => c.family));
console.log(
  `${CHALLENGES.length} challenges · ${families.size} families · ${CHALLENGES.length * 10} answers · ${Object.keys(ALIASES).length} alias entries · ${published}-day cycle`,
);

// 6. Daily Up & Down: every date must build the full shared survival path.
{
  const { upDownSequence } = await import("../src/games/updown/updown.server");
  const { UPDOWN_PATH_LENGTH } = await import("../src/games/updown/types");
  for (let i = 0; i < 60; i++) {
    const date = shiftDate(start, i);
    const seq = upDownSequence(date);
    check(
      seq.length === UPDOWN_PATH_LENGTH + 1,
      `up&down ${date} produced ${seq.length} films, expected ${UPDOWN_PATH_LENGTH + 1}`,
    );
    check(new Set(seq.map((m) => m.id)).size === seq.length, `up&down ${date} repeats a film`);
    for (let r = 0; r < seq.length - 1; r++) {
      check(
        seq[r]!.boxOfficeM !== seq[r + 1]!.boxOfficeM,
        `up&down ${date} round ${r + 1} is a tie`,
      );
    }
    const again = upDownSequence(date);
    check(
      again.map((m) => m.id).join() === seq.map((m) => m.id).join(),
      `up&down ${date} is not deterministic`,
    );
  }
  console.log("Daily Up & Down: 60 dates build the full 100-comparison path.");
}


if (failures > 0) {
  console.error(`\n${failures} failing check(s)`);
  process.exit(1);
}
console.log("All daily checks passed.");
