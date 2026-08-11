import { useEffect, useState } from "react";
import type { CareerSnapshot } from "../types";

/* The hidden sequence. No labels, no explanation — just the moment. */

const STEPS = [
  { text: "Wait.", duration: 2200 },
  { text: "This career isn't over.", duration: 2600 },
  { text: "You built something almost nobody builds.", duration: 3200 },
] as const;

export function DirectorLegend({
  snapshot,
  onRestart,
}: {
  snapshot: CareerSnapshot;
  onRestart: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEPS[step]!.duration);
    return () => clearTimeout(t);
  }, [step]);

  const finale = step >= STEPS.length;

  return (
    <div className="legend-screen fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center">
      {!finale && (
        <p key={step} className="anim-legend-text font-display text-2xl tracking-wide md:text-3xl">
          {STEPS[step]!.text}
        </p>
      )}
      {finale && (
        <div className="anim-fade-in flex flex-col items-center">
          <h1 className="font-display text-[clamp(5rem,18vw,11rem)] leading-none tracking-[0.12em]">
            LEGEND
          </h1>
          <p className="mt-8 font-display text-xl italic opacity-80">You made it.</p>
          <p className="mt-10 text-[11px] uppercase tracking-[0.3em] opacity-50">
            {snapshot.films} films · {snapshot.oscars} Oscars ·{" "}
            {snapshot.score.toLocaleString("en-US")}
          </p>
          <button
            onClick={onRestart}
            className="mt-14 border border-current px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] opacity-80 transition-opacity duration-300 hover:opacity-100"
          >
            Direct another career
          </button>
        </div>
      )}
    </div>
  );
}
