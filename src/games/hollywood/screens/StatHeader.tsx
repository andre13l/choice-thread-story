import { formatMoney } from "../scoring";
import type { GameState } from "../types";

export function StatHeader({ game }: { game: GameState }) {
  const s = game.stats;
  return (
    <div className="flex items-center justify-center gap-6 pt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
      <span>Age {s.age}</span>
      <span className="text-border">·</span>
      <span>{formatMoney(s.money)}</span>
      <span className="text-border">·</span>
      <span>Fame {Math.round(s.fame)}</span>
    </div>
  );
}
