import { QuickChoice } from "../interactions/QuickChoice";
import type { GameEvent, GameState } from "../types";
import { ScreenShell } from "./ScreenShell";

/**
 * Ordinary events: the default QUICK CHOICE compatibility path.
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
      <QuickChoice game={game} event={event} onChoose={onChoose} />
    </ScreenShell>
  );
}
