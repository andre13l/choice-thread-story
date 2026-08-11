import { useEffect, useState } from "react";
import type { AwardsRun } from "../career";

/**
 * AWARDS — nominations for the film the player actually built, then the
 * Best Director envelope. A milestone, not an ending.
 */
export function AwardsScreen({ awards, onDone }: { awards: AwardsRun; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const total = awards.nominations.length;

  useEffect(() => {
    if (step > total + 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 1500 : 700);
    return () => clearTimeout(t);
  }, [step, total]);

  const revealed = Math.max(0, Math.min(total, step - 1));
  const envelopeOpen = step > total + 1;

  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-[10px] uppercase tracking-[0.32em] text-gold">Awards season</p>
        <h2 className="mt-5 font-display text-[clamp(1.8rem,6vw,2.6rem)] leading-tight text-foreground">
          {awards.filmTitle}
        </h2>
        <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {total} {total === 1 ? "nomination" : "nominations"}
        </p>

        <div className="mt-8 flex flex-col gap-1.5 text-left">
          {awards.nominations.slice(0, revealed).map((n) => {
            const won = awards.wins.includes(n);
            return (
              <div
                key={n}
                className={`anim-fade-up flex items-center justify-between border px-4 py-3 ${
                  won ? "border-gold/60 bg-gold/5" : "border-border/60 bg-card/40"
                }`}
              >
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/85">{n}</span>
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] ${
                    won ? "text-gold" : "text-muted-foreground/60"
                  }`}
                >
                  {won ? "Won" : "Nominated"}
                </span>
              </div>
            );
          })}
        </div>

        {envelopeOpen && (
          <div className="anim-fade-up mt-10">
            {awards.bestDirectorWin ? (
              <>
                <div className="mx-auto h-px w-16 bg-gold/70" />
                <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-gold">Best Director</p>
                <p className="mt-4 font-display text-[clamp(2rem,8vw,3rem)] leading-none text-foreground">
                  You
                </p>
              </>
            ) : (
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {awards.bestDirectorNominated ? "The envelope went elsewhere" : "No director nod"}
              </p>
            )}

            <button
              onClick={onDone}
              className="mt-12 border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
            >
              Back to work
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
