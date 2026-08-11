import { earlyEvents } from "./early";
import { midEvents } from "./mid";
import { lateEvents } from "./late";
import { movieChainEvents } from "./movieChain";
import { postOscarEvents } from "./postOscar";
import { downfallEvents } from "./downfall";
import type { GameEvent } from "../types";

export const hollywoodEvents: GameEvent[] = [
  ...earlyEvents,
  ...midEvents,
  ...lateEvents,
  ...movieChainEvents,
  ...postOscarEvents,
  // Terminal events are never in the ordinary pool — the downfall
  // engine surfaces them when the path's pressures call for an ending.
  ...downfallEvents,
];

export const EVENT_COUNT = hollywoodEvents.length;
