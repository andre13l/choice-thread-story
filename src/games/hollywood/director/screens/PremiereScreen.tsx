import { useEffect, useMemo, useRef, useState } from "react";
import { formatMoney } from "../../scoring";
import type { CycleEffects } from "../career";
import { reactionsFor } from "../reactions";
import { VERDICT_LABEL } from "../resolve";
import type { FilmResult } from "../types";
import { useCountUp } from "./useCountUp";

const STEP_MS = [1700, 2600, 2200, 2100, 1900, 2200];

/**
 * PREMIERE — the payoff. Poster, a room filling up, then the numbers
 * landing one at a time. Nothing here is text the player has to read.
 */
export function PremiereScreen({
  film,
  effects,
  onDone,
}: {
  film: FilmResult;
  effects: CycleEffects;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const reactions = useMemo(() => reactionsFor(film), [film]);

  useEffect(() => {
    if (step >= STEP_MS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS[step]!);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [step]);

  const done = step >= STEP_MS.length;
  const theatrical = film.theatrical !== false;

  return (
    <div
      className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14"
      onClick={() => !done && setStep((s) => Math.min(STEP_MS.length, s + 1))}
    >
      <div className="w-full max-w-2xl">
        {/* Poster */}
        <div className="anim-fade-up border border-border/70 bg-card/40 px-6 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/80">
            {theatrical ? "Premiere night" : "Delivered"} · {film.year}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2rem,7vw,3.4rem)] leading-none tracking-[0.02em] text-foreground">
            {film.title}
          </h2>
          <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {film.cast.map((c) => c.name).join("  ·  ")}
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-muted-foreground/60">
            {film.studio} · {film.genre}
          </p>
        </div>

        {/* The room */}
        {step >= 1 && <Auditorium occupancy={film.occupancy} theatrical={theatrical} />}

        {/* Opening */}
        {step >= 2 && (
          <Panel label={theatrical ? "Opening weekend" : "First-window revenue"}>
            <Money value={film.opening} />
          </Panel>
        )}

        {/* Worldwide vs budget */}
        {step >= 3 && <GrossPanel film={film} theatrical={theatrical} />}

        {/* Scores */}
        {step >= 4 && (
          <div className="anim-fade-up mt-3 grid grid-cols-2 gap-3">
            <ScorePanel label="Critics" value={film.critics} />
            <ScorePanel label="Audience" value={film.audience} />
          </div>
        )}

        {/* Reactions */}
        {step >= 5 && (
          <div className="anim-fade-up mt-3 flex flex-col gap-2">
            {reactions.map((r, i) => (
              <div
                key={i}
                className={`border px-4 py-3 ${
                  r.critic ? "border-gold/35 bg-card/50" : "border-border/60 bg-card/30"
                }`}
              >
                <p
                  className={`text-[9px] uppercase tracking-[0.2em] ${
                    r.critic ? "text-gold/80" : "text-muted-foreground/70"
                  }`}
                >
                  {r.handle}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-foreground/85">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Career effects */}
        {done && (
          <div className="anim-fade-up mt-5">
            <div className="border border-border/70 bg-card/50">
              <p className="border-b border-border/50 px-4 py-2.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {VERDICT_LABEL[film.verdict]}
              </p>
              <div className="grid grid-cols-2 gap-px bg-border/40 sm:grid-cols-4">
                <Delta label="You earned" value={formatMoney(effects.moneyDelta)} good={effects.moneyDelta >= 0} />
                <Delta label="Respect" value={signed(effects.reputation)} good={effects.reputation >= 0} />
                <Delta label="Recognition" value={signed(effects.recognition)} good={effects.recognition >= 0} />
                <Delta label="Studio trust" value={signed(effects.studioTrust)} good={effects.studioTrust >= 0} />
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={onDone}
                className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
              >
                What's next
              </button>
            </div>
          </div>
        )}

        {!done && (
          <p className="mt-6 text-center text-[9px] uppercase tracking-[0.24em] text-muted-foreground/40">
            Tap to skip ahead
          </p>
        )}
      </div>
    </div>
  );
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}`;
}

const SEAT_COLS = 18;
const SEAT_ROWS = 8;

function Auditorium({ occupancy, theatrical }: { occupancy: number; theatrical: boolean }) {
  const total = SEAT_COLS * SEAT_ROWS;
  const target = Math.round((occupancy / 100) * total);
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1800);
      setFilled(Math.round(target * (1 - Math.pow(1 - t, 2))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div className="anim-fade-up mt-3 border border-border/70 bg-card/40 px-4 py-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {theatrical ? "Opening night turnout" : "Screening room"}
        </p>
        <p className="font-display text-2xl leading-none text-foreground">
          {Math.round((filled / total) * 100)}%
        </p>
      </div>

      <div className="mt-4 h-1 w-full bg-foreground/10" />
      <div
        className="mt-4 grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${SEAT_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: total }, (_, i) => {
          const on = i < filled;
          return (
            <span
              key={i}
              className={`aspect-square transition-colors duration-300 ${
                on ? "bg-gold/80" : "bg-foreground/10"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="anim-fade-up mt-3 border border-border/70 bg-card/40 px-5 py-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Money({ value }: { value: number }) {
  const n = useCountUp(value, 1500);
  return <p className="font-display text-[clamp(2rem,7vw,3rem)] leading-none text-foreground">{formatMoney(n)}</p>;
}

function GrossPanel({ film, theatrical }: { film: FilmResult; theatrical: boolean }) {
  const n = useCountUp(film.worldwide, 1800);
  const max = Math.max(film.worldwide, film.budget, 1);
  const grossW = (film.worldwide / max) * 100;
  const budgetW = (film.budget / max) * 100;
  const profit = film.studioResult >= 0;
  return (
    <div className="anim-fade-up mt-3 border border-border/70 bg-card/40 px-5 py-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {theatrical ? "Worldwide box office" : "Total revenue"}
      </p>
      <p
        className={`mt-2 font-display text-[clamp(2.2rem,9vw,3.6rem)] leading-none ${
          profit ? "text-foreground" : "text-danger"
        }`}
      >
        {formatMoney(n)}
      </p>
      <div className="mt-5 h-3 w-full bg-secondary/40">
        <div
          className={`h-full transition-[width] duration-1000 ${profit ? "bg-gold/70" : "bg-danger/60"}`}
          style={{ width: `${grossW}%` }}
        />
      </div>
      <div className="mt-1 h-3 w-full bg-secondary/40">
        <div className="h-full bg-foreground/25" style={{ width: `${budgetW}%` }} />
      </div>

      <div className="mt-2 flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Budget {formatMoney(film.budget)}</span>
        <span className={profit ? "text-foreground/80" : "text-danger"}>
          {profit ? "+" : ""}
          {formatMoney(film.studioResult)} to the studio
        </span>
      </div>
    </div>
  );
}

function ScorePanel({ label, value }: { label: string; value: number }) {
  const n = useCountUp(value, 1100);
  const tone = value >= 75 ? "text-gold" : value >= 50 ? "text-foreground" : "text-danger";
  return (
    <div className="border border-border/70 bg-card/40 px-5 py-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-[clamp(2rem,8vw,2.8rem)] leading-none ${tone}`}>
        {Math.round(n)}
      </p>
      <div className="mt-3 h-[3px] w-full bg-secondary/70">
        <div
          className={`h-full ${value >= 75 ? "bg-gold/80" : value >= 50 ? "bg-foreground/70" : "bg-danger/70"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Delta({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="bg-card/60 px-4 py-3">
      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-lg ${good ? "text-foreground" : "text-danger"}`}>{value}</p>
    </div>
  );
}
