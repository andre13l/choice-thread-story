import { createServerFn } from "@tanstack/react-start";
import { loadTimelinePrompt, loadTimelineReveal } from "@/games/timeline/timeline.server";

/** Titles and starting order only — never the release years. */
export const getDailyTimeline = createServerFn({ method: "GET" })
  .inputValidator((input: { date: string }) => input)
  .handler(async ({ data }) => loadTimelinePrompt(data.date));

/** Years and correct order — only after the single submission. */
export const revealDailyTimeline = createServerFn({ method: "POST" })
  .inputValidator((input: { date: string }) => input)
  .handler(async ({ data }) => loadTimelineReveal(data.date));
