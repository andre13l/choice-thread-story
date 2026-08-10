import type { EventOption, GameEvent, GameState } from "../types";

/**
 * QUICK CHOICE — the default interaction family.
 *
 * Every ordinary event renders through this compatibility path; events
 * with a `sequence` opt into richer steps instead. 2-3 options, fast
 * decisions, numbered like shots on a slate.
 */
export function QuickChoice({
  game,
  event,
  onChoose,
}: {
  game: GameState;
  event: GameEvent;
  onChoose: (index: number) => void;
}) {
  const text = typeof event.text === "function" ? event.text(game) : event.text;
  const options: EventOption[] = event.options ?? [];
  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center justify-center px-5 py-14 sm:px-6">
      <div className="w-full max-w-xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {(event.place ?? "Los Angeles").toUpperCase()} — Age {game.stats.age}
        </p>
        <p className="mt-6 font-serif text-[clamp(1.35rem,3.2vw,1.75rem)] leading-snug text-foreground">
          {text}
        </p>

        <div className="mt-12 flex flex-col gap-2.5">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => onChoose(i)}
              className="group flex items-baseline gap-5 border border-border/80 bg-card/50 px-5 py-4 text-left backdrop-blur-sm transition-all duration-200 hover:border-foreground/60 hover:bg-card sm:px-6"
            >
              <span className="shrink-0 font-serif text-sm italic text-muted-foreground/50 transition-colors duration-200 group-hover:text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-foreground">
                {option.label}
              </span>
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
  );
}
