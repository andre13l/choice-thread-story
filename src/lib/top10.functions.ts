import { createServerFn } from "@tanstack/react-start";
import {
  giveUpTop10,
  loadTop10Prompt,
  submitTop10Guess,
} from "@/games/top10/top10.rpc.server";
import { searchTop10Catalog } from "@/games/top10/search.server";

/** The prompt only — never the answers. */
export const getTop10Today = createServerFn({ method: "GET" })
  .inputValidator((input: { date?: string }) => input ?? {})
  .handler(async ({ data }) => loadTop10Prompt(data.date));

/** One guess in, at most one answer out. */
export const guessTop10 = createServerFn({ method: "POST" })
  .inputValidator((input: { date: string; guess: string; found: number[] }) => input)
  .handler(async ({ data }) => submitTop10Guess(data.date, data.guess, data.found));

/** Full list — only after the player explicitly ends the round. */
export const revealTop10 = createServerFn({ method: "POST" })
  .inputValidator((input: { date: string }) => input)
  .handler(async ({ data }) => giveUpTop10(data.date));

/**
 * Autocomplete lookup. Deliberately date-free: it searches the shared
 * catalogue plus the whole challenge bank, so it can never reveal which
 * suggestions belong to today's list.
 */
export const searchTop10 = createServerFn({ method: "GET" })
  .inputValidator((input: { kind: "film" | "person"; q: string }) => input)
  .handler(async ({ data }) =>
    searchTop10Catalog(data.kind === "person" ? "person" : "film", data.q ?? ""),
  );
