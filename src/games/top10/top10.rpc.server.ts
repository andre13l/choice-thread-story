/** Daily Top 10 handler bodies. SERVER ONLY — imported by top10.functions.ts. */
import { todayUTC } from "@/games/core/dailyStats";
import { challengeFor, matchGuess, promptFor } from "./top10.server";
import type { Top10GuessResult, Top10Prompt } from "./types";

export async function loadTop10Prompt(date?: string): Promise<Top10Prompt> {
  const day = date ?? todayUTC();
  return promptFor(day, await challengeFor(day));
}

export async function submitTop10Guess(
  date: string,
  guess: string,
  found: number[],
): Promise<Top10GuessResult> {
  const trimmed = (guess ?? "").trim().slice(0, 120);
  if (!trimmed) return { hit: null, duplicate: false };
  const challenge = await challengeFor(date);
  return matchGuess(challenge, trimmed, Array.isArray(found) ? found : []);
}

export async function giveUpTop10(date: string): Promise<{ answers: string[] }> {
  const challenge = await challengeFor(date);
  return { answers: challenge.answers };
}
