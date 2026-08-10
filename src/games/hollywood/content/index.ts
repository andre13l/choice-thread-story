import { earlyEvents } from "./early";
import { midEvents } from "./mid";
import { lateEvents } from "./late";
import type { GameEvent } from "../types";

export const hollywoodEvents: GameEvent[] = [...earlyEvents, ...midEvents, ...lateEvents];

export const EVENT_COUNT = hollywoodEvents.length;
