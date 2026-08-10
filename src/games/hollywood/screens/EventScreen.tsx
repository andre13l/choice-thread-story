import type { GameEvent, GameState } from "../types";
import { StatHeader } from "./StatHeader";

export function EventScreen({
  game,
  event,
  onChoose,
}: {
  game: GameState;
  event: GameEvent;
  onChoose: (index: number) => void;
}) {
  const text = typeof event.text === "function" ? event.text(game) : event.text;
  return (
    <div className="flex min-h-screen flex-col">
      <StatHeader game={game} />
      <div className="anim-fade-up flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {(event.place ?? "Los Angeles").toUpperCase()} — Age {game.stats.age}
          </p>
          <p className="mt-6 font-serif text-[clamp(1.35rem,3.2vw,1.75rem)] leading-snug text-foreground">
            {text}
          </p>

          <div className="mt-12 flex flex-col gap-3">
            {event.options.map((option, i) => (
              <button
                key={i}
                onClick={() => onChoose(i)}
                className="group flex items-baseline justify-between gap-6 border border-border bg-card px-6 py-4 text-left transition-all duration-200 hover:border-foreground"
              >
                <span className="text-[15px] font-medium text-foreground">{option.label}</span>
                {option.hint && (
                  <span
                    className={`shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] ${
                      option.danger ? "text-danger" : "text-muted-foreground"
                    }`}
                  >
                    {option.hint}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
