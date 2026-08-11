/**
 * Short fictional audience/press reactions. Generic social snippets —
 * no real platform, no real people.
 */

import { createRng } from "../../core/rng";
import { hashString, pick } from "./names";
import type { FilmResult, Verdict } from "./types";

const HANDLES = [
  "@reelrot", "@popcorn_ghost", "@filmwitch", "@nine_reels", "@backrowbrian",
  "@aperture_ann", "@cinema.lurker", "@tuesdaymatinee", "@thirdactproblem", "@grainandnoise",
];

const CRITICS = ["The Ledger", "Frame Rate", "Cine Quarterly", "The Evening Post", "Reel Report"];

const POOLS: Record<Verdict, string[]> = {
  phenomenon: [
    "saw it twice this weekend. the theatre CHEERED.",
    "this is the one everyone will be quoting for ten years",
    "queue went around the block. i have never seen that here.",
    "genuinely the biggest thing since i started going to the movies",
  ],
  blockbuster: [
    "loud, huge, extremely worth the ticket",
    "took my whole family, everyone had a great time",
    "the third act alone justifies the budget",
    "already booked for a rewatch",
  ],
  hit: [
    "solid. real movie. would recommend.",
    "didn't expect much and left happy",
    "the leads are great together",
    "good Saturday night film",
  ],
  sleeper: [
    "nobody is talking about this and they SHOULD be",
    "made for nothing and it looks incredible",
    "word of mouth is going to carry this thing",
    "cheapest ticket, best time i've had all year",
  ],
  "acclaimed-flop": [
    "empty theatre for one of the best films of the year",
    "four of us in the room. criminal.",
    "this will be rediscovered in ten years, watch",
    "beautiful. bleak. nobody came.",
  ],
  "crowd-pleaser": [
    "critics hated it, my entire row was screaming",
    "who cares what the reviews said, this ruled",
    "dumb in the best possible way",
    "not art. extremely fun.",
  ],
  modest: [
    "fine! it was fine.",
    "watched it, enjoyed it, already forgetting it",
    "does what it says on the poster",
    "perfectly okay night out",
  ],
  flop: [
    "that was a long ninety minutes",
    "walked out at the hour mark, sorry",
    "somebody green-lit this",
    "the trailer was better than the film",
  ],
  disaster: [
    "how much did this COST",
    "i have never watched money burn in real time before",
    "eight people in an IMAX screening, four left early",
    "genuinely one of the worst things i have paid for",
  ],
  cult: [
    "this is going to have a midnight screening crowd, calling it",
    "unhinged and i loved it",
    "flopped hard, will be a t-shirt in five years",
    "nobody saw it. those of us who did are changed.",
  ],
};

const CRITIC_LINES: { min: number; lines: string[] }[] = [
  { min: 88, lines: ["A major film, made by someone in complete control.", "The year's high-water mark."] },
  { min: 72, lines: ["Confident, sharp, and better than it needed to be.", "Handsomely made and genuinely felt."] },
  { min: 55, lines: ["Competent. Occasionally more than that.", "Watchable, if never surprising."] },
  { min: 38, lines: ["A film that mistakes noise for scale.", "Expensive and oddly weightless."] },
  { min: 0, lines: ["An ordeal.", "Almost impressive in its incoherence."] },
];

export interface Reaction {
  handle: string;
  text: string;
  critic?: boolean;
}

export function reactionsFor(film: FilmResult): Reaction[] {
  const r = createRng(hashString(`react:${film.id}`) >>> 0);
  const pool = [...(POOLS[film.verdict] ?? POOLS.modest)];
  const out: Reaction[] = [];
  const count = 3;
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(r() * pool.length);
    out.push({ handle: pick(r, HANDLES), text: pool.splice(idx, 1)[0]! });
  }
  const band = CRITIC_LINES.find((b) => film.critics >= b.min)!;
  out.splice(1, 0, { handle: pick(r, CRITICS), text: pick(r, band.lines), critic: true });
  return out;
}
