/**
 * DAILY TOP 10 — scheduling and answer matching. SERVER ONLY.
 *
 * Separation of concerns, deliberately:
 *   bank.server.ts  = reusable challenge content (what the lists are)
 *   this file       = the calendar (which list runs on which UTC date) and
 *                     the matcher (what counts as naming an answer)
 *   daily_top10     = optional DB override, so a list can be scheduled or
 *                     unpublished without a deploy
 *
 * The calendar is a deterministic shuffle of the published bank, so a date
 * always resolves to a challenge even with no DB row, and the bank cycles
 * without repeating until it has been exhausted.
 */
import { answerKey, dailyNumber, seededShuffle } from "@/games/core/daily";
import { dayNumberFromDate } from "@/games/core/dailyStats";
import { ALIASES, CHALLENGES, type Top10Challenge } from "./bank.server";
import type { Top10GuessResult, Top10Prompt } from "./types";

const CALENDAR_SEED = 0x70b1a5;

function published(): Top10Challenge[] {
  return CHALLENGES.filter((c) => c.published);
}

/**
 * Editorial pins: a date can be nailed to a specific list. A pin is applied as
 * a swap with whatever the rotation would otherwise have run that day, so the
 * cycle still covers the bank exactly once. Never edit a pin for a past date.
 */
const PINNED: Record<string, string> = {
  "2026-08-21": "oscars-actor-2015-2024",
};

/**
 * The rotation, built once: a deterministic order over the published bank in
 * which no two neighbours — including across the wrap from the last day of a
 * cycle to the first — come from the same content family. The bank is
 * dominated by "highest-grossing films of YEAR" lists, so a blind shuffle
 * produces long box-office runs; this pulls awards, franchise and filmography
 * lists between them.
 *
 * Pinned dates are placed first and the rest of the calendar is built around
 * them, so a pin never creates the repetition the rotation exists to avoid.
 */
function buildOrder(): Top10Challenge[] {
  const pool = published();
  const size = pool.length;

  const groups = new Map<string, Top10Challenge[]>();
  for (const challenge of seededShuffle(pool, CALENDAR_SEED)) {
    const list = groups.get(challenge.family) ?? [];
    list.push(challenge);
    groups.set(challenge.family, list);
  }

  const slots: (Top10Challenge | null)[] = Array.from({ length: size }, () => null);
  const pinnedSlots: number[] = [];

  for (const [date, id] of Object.entries(PINNED)) {
    const challenge = pool.find((c) => c.id === id);
    if (!challenge) continue;
    const slot = ((dayNumberFromDate(date) % size) + size) % size;
    const list = groups.get(challenge.family)!;
    list.splice(list.indexOf(challenge), 1);
    slots[slot] = challenge;
    pinnedSlots.push(slot);
  }

  /*
   * Classic "no two identical neighbours" placement: lay the families out
   * largest-first across every other slot, then across the slots in between.
   * The dominant family therefore lands on one parity and can never touch
   * itself. The starting parity is chosen opposite the first pin, so pinning a
   * date doesn't push the dominant family onto the pin's own parity.
   */
  const startParity = pinnedSlots.length ? 1 - (pinnedSlots[0]! % 2) : 0;
  const free: number[] = [];
  for (const parity of [startParity, 1 - startParity]) {
    for (let i = parity; i < size; i += 2) if (!slots[i]) free.push(i);
  }

  const flat = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .flatMap(([, list]) => list);

  free.forEach((slot, i) => {
    slots[slot] = flat[i]!;
  });

  return slots as Top10Challenge[];
}

let ORDER: Top10Challenge[] | null = null;
function calendarOrder(): Top10Challenge[] {
  if (!ORDER) ORDER = buildOrder();
  return ORDER;
}

/** Deterministic rotation: same date, same list, for every player. */
export function scheduledChallenge(date: string): Top10Challenge {
  const order = calendarOrder();
  const index = ((dayNumberFromDate(date) % order.length) + order.length) % order.length;
  return order[index]!;
}

/** Pins win (they are baked into the rotation), then a DB row. */
export async function challengeFor(date: string): Promise<Top10Challenge> {
  const pinnedId = PINNED[date];
  if (pinnedId) {
    const pinned = published().find((c) => c.id === pinnedId);
    if (pinned) return pinned;
  }
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("daily_top10")
      .select("challenge_id, published")
      .eq("date", date)
      .maybeSingle();
    if (data?.published) {
      const match = published().find((c) => c.id === data.challenge_id);
      if (match) return match;
    }
  } catch {
    // Backend unavailable — the deterministic calendar is the fallback.
  }
  return scheduledChallenge(date);
}

export function promptFor(date: string, challenge: Top10Challenge): Top10Prompt {
  return {
    date,
    number: dailyNumber(date),
    challengeId: challenge.id,
    title: challenge.title,
    ...(challenge.subtitle ? { subtitle: challenge.subtitle } : {}),
    category: challenge.category,
    source: challenge.source,
    ...(challenge.sourceUrl ? { sourceUrl: challenge.sourceUrl } : {}),
    total: challenge.answers.length,
    answerType: challenge.answerType ?? "film",
  };
}

/** Every accepted key for an answer → its 1-based position. */
export function matchIndex(challenge: Top10Challenge): Map<string, number> {
  const index = new Map<string, number>();
  challenge.answers.forEach((answer, i) => {
    const keys = [answer, ...(ALIASES[answer] ?? [])].map(answerKey);
    for (const key of keys) if (key && !index.has(key)) index.set(key, i + 1);
  });
  return index;
}

export function matchGuess(
  challenge: Top10Challenge,
  guess: string,
  found: number[],
): Top10GuessResult {
  const position = matchIndex(challenge).get(answerKey(guess));
  if (!position) return { hit: null, duplicate: false };
  if (found.includes(position)) {
    return { hit: { position, answer: challenge.answers[position - 1]! }, duplicate: true };
  }
  return { hit: { position, answer: challenge.answers[position - 1]! }, duplicate: false };
}
