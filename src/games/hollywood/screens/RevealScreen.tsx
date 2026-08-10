import type { GameState } from "../types";
import type { OutcomeView } from "../useHollywoodGame";
import { ScreenShell } from "./ScreenShell";

export function RevealScreen({
  game,
  outcome,
  onContinue,
}: {
  game: GameState;
  outcome: OutcomeView;
  onContinue: () => void;
}) {
  return (
    <ScreenShell game={game}>
      <div className="anim-fade-up flex flex-1 flex-col items-center justify-center px-5 py-14 sm:px-6">
        <div className="w-full max-w-xl text-center">
          <p className="font-serif text-[clamp(1.35rem,3.2vw,1.75rem)] leading-snug text-foreground">
            {outcome.text}
          </p>
          {outcome.note && (
            <p className="mt-5 font-serif text-base italic text-gold/80">{outcome.note}</p>
          )}
          {outcome.lines.length > 0 && (
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
              {outcome.lines.map((line, i) => (
                <span
                  key={i}
                  className={`border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    line.negative
                      ? "border-danger/40 text-danger"
                      : "border-border/80 text-foreground/80"
                  }`}
                >
                  {line.label}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={onContinue}
            className="mt-12 border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
          >
            Continue
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
