import { Phone } from "lucide-react";
import { useState } from "react";
import type { GameEvent, GameState } from "../types";

/**
 * INCOMING CALL — a quick-choice decision rendered as a phone call.
 *
 * Same EventOption math as QuickChoice; only the presentation changes.
 * options[0] = the "answer" action, options[1] = the "decline" action,
 * options[2] (rare) = a quiet third way out. The event's `place` names
 * the caller.
 */
export function CallInteraction({
  game,
  event,
  onChoose,
}: {
  game: GameState;
  event: GameEvent;
  onChoose: (index: number) => void;
}) {
  const [choosing, setChoosing] = useState<number | null>(null);
  const text = typeof event.text === "function" ? event.text(game) : event.text;
  const options = event.options ?? [];
  const caller = event.place ?? "Unknown number";

  const choose = (i: number) => {
    if (choosing !== null) return;
    setChoosing(i);
    setTimeout(() => onChoose(i), 350);
  };

  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center justify-center px-5 py-14 sm:px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Incoming call · age {game.stats.age}
        </p>

        <div className="mt-10 flex justify-center">
          <div className="anim-call-pulse flex h-24 w-24 items-center justify-center rounded-full border border-foreground/25 bg-card/60">
            <span className="font-display text-2xl tracking-[0.1em] text-foreground">
              {caller
                .split(" ")
                .filter((w) => w.length > 2)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "?"}
            </span>
          </div>
        </div>

        <p className="anim-call-glow mt-7 text-[11px] font-medium uppercase tracking-[0.3em] text-foreground/80">
          {caller}
        </p>

        <p className="mx-auto mt-8 max-w-md font-display text-[clamp(1.15rem,2.8vw,1.45rem)] leading-snug text-foreground">
          {text}
        </p>

        <div className="mt-12 flex flex-col items-center gap-4">
          {options.slice(0, 2).map((option, i) =>
            i === 0 ? (
              <button
                key={i}
                disabled={choosing !== null}
                onClick={() => choose(i)}
                className={`flex w-full max-w-xs items-center justify-center gap-2.5 border border-foreground bg-foreground px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.24em] text-primary-foreground transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:opacity-40 ${
                  choosing === i ? "animate-pulse" : ""
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                {option.label}
              </button>
            ) : (
              <button
                key={i}
                disabled={choosing !== null}
                onClick={() => choose(i)}
                className={`w-full max-w-xs border border-danger/50 px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.24em] text-danger transition-colors duration-300 hover:bg-danger/10 disabled:opacity-40 ${
                  choosing === i ? "animate-pulse" : ""
                }`}
              >
                {option.label}
              </button>
            ),
          )}
          {options[2] && (
            <button
              disabled={choosing !== null}
              onClick={() => choose(2)}
              className={`mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 ${
                choosing === 2 ? "animate-pulse" : ""
              }`}
            >
              {options[2].label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
