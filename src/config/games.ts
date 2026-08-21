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

/**
 * The public catalogue is deliberately two products: the daily puzzles and
 * Hollywood. Unlimited Connect / Higher or Lower still exist as routes for
 * internal use, but they are no longer surfaced anywhere in the product.
 */
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
    id: "daily",
    name: "DAILY",
    tagline: "Five film puzzles. One a day each.",
    status: "playable",
    to: "/daily",
  },
];
