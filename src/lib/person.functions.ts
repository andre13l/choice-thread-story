import { createServerFn } from "@tanstack/react-start";
import { todayUTC } from "@/games/core/dailyStats";
import {
  checkGuess,
  promptFor,
  revealFor,
  searchPeople,
} from "@/games/person/person.server";

/** Clues up to the number the player has unlocked — never the whole ladder. */
export const getDailyPerson = createServerFn({ method: "GET" })
  .inputValidator((input: { date?: string; revealed?: number }) => input ?? {})
  .handler(async ({ data }) => promptFor(data.date ?? todayUTC(), data.revealed ?? 1));

export const guessDailyPerson = createServerFn({ method: "POST" })
  .inputValidator((input: { date: string; guess: string }) => input)
  .handler(async ({ data }) => ({
    guess: data.guess,
    correct: await checkGuess(data.date, (data.guess ?? "").slice(0, 120)),
  }));

export const revealDailyPerson = createServerFn({ method: "POST" })
  .inputValidator((input: { date: string }) => input)
  .handler(async ({ data }) => revealFor(data.date));

export const searchDailyPeople = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) => input)
  .handler(async ({ data }) => searchPeople((data.query ?? "").slice(0, 60)));
