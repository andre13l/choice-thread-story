import { createServerFn } from "@tanstack/react-start";
import { loadUpDownPrompt } from "@/games/updown/updown.server";

/** The frozen sequence for a UTC date — identical for every player. */
export const getDailyUpDown = createServerFn({ method: "GET" })
  .inputValidator((input: { date: string }) => input)
  .handler(async ({ data }) => loadUpDownPrompt(data.date));
