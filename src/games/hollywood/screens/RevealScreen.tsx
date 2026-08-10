import type { GameState } from "../types";
import type { OutcomeView } from "../useHollywoodGame";
import { StatHeader } from "./StatHeader";

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
    <div className="flex min-h-screen flex-col">
      <StatHeader game={game} />
      <div className="anim-fade-up flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl text-center">
          <p className="font-serif text-[clamp(1.35rem,3.2vw,1.75rem)] leading-snug text-foreground">
            {outcome.text}
          </p>
          {outcome.note && (
            <p className="mt-4 font-serif text-base italic text-muted-foreground">{outcome.note}</p>
          )}
          {outcome.lines.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {outcome.lines.map((line, i) => (
                <span
                  key={i}
                  className={`text-[12px] font-medium uppercase tracking-[0.18em] ${
                    line.negative ? "text-danger" : "text-muted-foreground"
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
    </div>
  );
}
