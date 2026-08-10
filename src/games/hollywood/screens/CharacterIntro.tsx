import { characterFlavor } from "../engine";
import { formatMoney } from "../scoring";
import type { GameState } from "../types";

export function CharacterIntro({ game, onContinue }: { game: GameState; onContinue: () => void }) {
  const s = game.stats;
  return (
    <div className="anim-fade-up flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Los Angeles
        </p>
        <h2 className="mt-6 font-serif text-6xl text-foreground">You are 18.</h2>
        <p className="mt-6 font-serif text-lg italic leading-relaxed text-muted-foreground">
          {characterFlavor(s)}
        </p>

        <div className="mt-10 grid grid-cols-3 divide-x divide-border border border-border bg-card">
          <div className="px-4 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Money
            </p>
            <p className="mt-2 font-serif text-xl text-foreground">{formatMoney(s.money)}</p>
          </div>
          <div className="px-4 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Fame
            </p>
            <p className="mt-2 font-serif text-xl text-foreground">{Math.round(s.fame)}</p>
          </div>
          <div className="px-4 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Connections
            </p>
            <p className="mt-2 font-serif text-xl text-foreground">{Math.round(s.connections)}</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="mt-12 border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
        >
          Step off the bus
        </button>
      </div>
    </div>
  );
}
