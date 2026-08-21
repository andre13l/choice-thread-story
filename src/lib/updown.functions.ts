import { createServerFn } from "@tanstack/react-start";
import { loadUpDownPrompt } from "@/games/updown/updown.server";

/**
 * The frozen path for a UTC date — identical for every player.
 *
 * The client derives the same path locally, so this endpoint is a convenience
 * for tooling and never a prerequisite for starting the game.
 */
export const getDailyUpDown = createServerFn({ method: "GET" })
  .inputValidator((input: { date: string }) => input)
  .handler(async ({ data }) => loadUpDownPrompt(data.date));
