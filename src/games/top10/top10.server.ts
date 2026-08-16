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

/** Deterministic rotation: same date, same list, for every player. */
export function scheduledChallenge(date: string): Top10Challenge {
  const pool = published();
  const order = seededShuffle(pool, CALENDAR_SEED);
  const index = ((dayNumberFromDate(date) % order.length) + order.length) % order.length;
  return order[index]!;
}

/** DB row wins when one exists and points at a known, published list. */
export async function challengeFor(date: string): Promise<Top10Challenge> {
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
