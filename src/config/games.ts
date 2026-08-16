/**
 * Hub game registry. Slots render in order; `soon` games are locked
 * placeholders so the hub architecture doesn't change as games ship.
 * The daily game's mechanic is intentionally undecided — it stays a slot.
 */
export interface GameSlot {
  id: string;
  name: string;
  tagline: string;
  status: "playable" | "soon";
  /** Route when playable. */
  to?: string;
  /** Render the large flagship card instead of a grid tile. */
  flagship?: boolean;
}

export const GAMES: GameSlot[] = [
  {
    id: "hollywood",
    name: "HOLLYWOOD",
    tagline: "How far can you make it?",
    status: "playable",
    to: "/hollywood",
    flagship: true,
  },
  {
    id: "higher-lower",
    name: "HIGHER / LOWER",
    tagline: "Box office, budgets, runtimes — trust your gut.",
    status: "playable",
    to: "/higher-lower",
  },
  {
    id: "connect",
    name: "CONNECT",
    tagline: "Two actors, no shared film. Link them in the fewest clicks.",
    status: "playable",
    to: "/connect",
  },
  {
    id: "guess",
    name: "GUESS THE FILM",
    tagline: "One knows the movie. The others ask.",
    status: "soon",
  },

  {
    id: "daily",
    name: "DAILY",
    tagline: "Three film puzzles. One a day each.",
    status: "playable",
    to: "/daily",
  },
];
