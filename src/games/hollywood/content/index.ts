import { earlyEvents } from "./early";
import { midEvents } from "./mid";
import { lateEvents } from "./late";
import { movieChainEvents } from "./movieChain";
import type { GameEvent } from "../types";

export const hollywoodEvents: GameEvent[] = [
  ...earlyEvents,
  ...midEvents,
  ...lateEvents,
  ...movieChainEvents,
];

export const EVENT_COUNT = hollywoodEvents.length;
