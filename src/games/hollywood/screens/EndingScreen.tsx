import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatMoneyFull, formatPercentile, shareText } from "../scoring";
import { loadCount } from "../storage";
import type { CareerSummary } from "../types";

export function EndingScreen({
  summary,
  onRestart,
}: {
  summary: CareerSummary;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const lived = useMemo(() => loadCount(), []);

  const rows: [string, string][] = [
    ["Movies", String(summary.movies)],
    ["Leading roles", String(summary.leadingRoles)],
    ["Oscars", String(summary.oscars)],
    ["Career earnings", formatMoneyFull(summary.careerEarnings)],
    ["Peak net worth", formatMoneyFull(summary.peakMoney)],
    ["Final net worth", formatMoneyFull(summary.finalMoney)],
    ["Peak fame", String(Math.round(summary.peakFame))],
  ];

  const onShare = async () => {
    const text = shareText({
      score: summary.score,
      percentile: summary.percentile,
      movies: summary.movies,
      oscars: summary.oscars,
      peakMoney: summary.peakMoney,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Your path
        </p>
        <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-muted-foreground">
          Age {summary.age}
        </p>
        <div className="mt-6 h-px w-16 mx-auto bg-gold/70" />
        <h2 className="mt-4 font-serif text-[clamp(2.5rem,8vw,3.5rem)] leading-tight text-foreground">
          {summary.archetype}
        </h2>

        <div className="mt-10 divide-y divide-border/60 border border-border/70 bg-card/50 text-left backdrop-blur-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between px-5 py-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </span>
              <span className="font-serif text-lg text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Career score
          </p>
          <p className="mt-2 font-serif text-[clamp(3rem,10vw,4.5rem)] leading-none text-foreground">
            {summary.score.toLocaleString("en-US")}
          </p>
          <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.22em] text-gold/80">
            {formatPercentile(summary.percentile)}
          </p>
          {lived > 1 && (
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {lived} paths lived
            </p>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={onRestart}
            className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
          >
            Live another path
          </button>
          <button
            onClick={onShare}
            className="border border-border px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:border-foreground"
          >
            {copied ? "Copied" : "Share"}
          </button>
          <Link
            to="/"
            className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            All games
          </Link>
        </div>
      </div>
    </div>
  );
}
