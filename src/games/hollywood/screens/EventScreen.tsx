import { CallInteraction } from "../interactions/CallInteraction";
import { QuickChoice } from "../interactions/QuickChoice";
import type { GameEvent, GameState } from "../types";
import { ScreenShell } from "./ScreenShell";

/**
 * Ordinary events: the default QUICK CHOICE compatibility path, with
 * alternative presentations routed by `event.presentation`.
 * Sequence events are routed to SequenceScreen by the page.
 */
export function EventScreen({
  game,
  event,
  onChoose,
}: {
  game: GameState;
  event: GameEvent;
  onChoose: (index: number) => void;
}) {
  return (
    <ScreenShell game={game}>
      {event.presentation === "call" ? (
        <CallInteraction game={game} event={event} onChoose={onChoose} />
      ) : (
        <QuickChoice game={game} event={event} onChoose={onChoose} />
      )}
    </ScreenShell>
  );
}
