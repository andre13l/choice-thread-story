import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatMoney, formatMoneyFull } from "../../scoring";
import { loadCount } from "../storage";
import type { CareerSnapshot } from "../types";
import { ShareResult } from "./ShareResult";

function formatPercentile(p: number): string {
  const top = 100 - p;
  return `TOP ${top <= 0.01 ? "0.01" : top.toFixed(top < 1 ? 2 : 1)}%`;
}

export function CareerEndScreen({
  snapshot,
  onRestart,
}: {
  snapshot: CareerSnapshot;
  onRestart: () => void;
}) {
  const [sharing, setSharing] = useState(false);
  const lived = useMemo(() => loadCount(), []);

  const rows: [string, string][] = [
    ["Films directed", String(snapshot.films)],
    ["Career span", `${snapshot.startYear}–${snapshot.endYear}`],
    ["Total box office", formatMoney(snapshot.totalBoxOffice)],
    ["Avg critics", `${snapshot.avgCritics}`],
    ["Nominations", String(snapshot.nominations)],
    ["Oscars", String(snapshot.oscars)],
    ...(snapshot.biggestHit
      ? ([
          [
            "Biggest hit",
            `${snapshot.biggestHit.title} · ${formatMoney(snapshot.biggestHit.worldwide)}`,
          ],
        ] as [string, string][])
      : []),
    ...(snapshot.biggestFlop && snapshot.biggestFlop.title !== snapshot.biggestHit?.title
      ? ([
          [
            "Biggest loss",
            `${snapshot.biggestFlop.title} · ${formatMoney(snapshot.biggestFlop.worldwide)}`,
          ],
        ] as [string, string][])
      : []),
    ["Peak net worth", formatMoneyFull(snapshot.peakMoney)],
    ["Final net worth", formatMoneyFull(snapshot.finalMoney)],
  ];

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Every path ends
        </p>
        <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-muted-foreground">
          Age {snapshot.age}
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-gold/70" />
        <h2 className="mt-4 font-display text-[clamp(2.2rem,7vw,3.2rem)] leading-tight text-foreground">
          {snapshot.archetype}
        </h2>
        <p className="mx-auto mt-6 max-w-sm text-[14px] italic leading-relaxed text-muted-foreground">
          {snapshot.fate}
        </p>
        {snapshot.bestFilm && (
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-gold/70">
            {snapshot.bestFilm}
          </p>
        )}

        <div className="mt-10 divide-y divide-border/60 border border-border/70 bg-card/50 text-left backdrop-blur-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between px-5 py-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </span>
              <span className="ml-4 truncate font-display text-lg text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Career score
          </p>
          <p className="mt-2 font-display text-[clamp(3rem,10vw,4.5rem)] leading-none text-foreground">
            {snapshot.score.toLocaleString("en-US")}
          </p>
          <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.22em] text-gold/80">
            {formatPercentile(snapshot.percentile)}
          </p>
          {lived > 1 && (
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {lived} careers lived
            </p>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={onRestart}
            className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
          >
            Start over
          </button>
          <button
            onClick={() => setSharing(true)}
            className="border border-border px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:border-foreground"
          >
            Share result
          </button>
          <Link
            to="/"
            className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            All games
          </Link>
        </div>
      </div>
      {sharing && <ShareResult snapshot={snapshot} onClose={() => setSharing(false)} />}
    </div>
  );
}
