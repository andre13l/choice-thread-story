import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getDailyConnect, type DailyConnectPayload } from "@/lib/connect.functions";
import { getTop10Today } from "@/lib/top10.functions";
import { Portrait } from "@/games/connect/components/Portrait";
import { DAILY_GAME_ID } from "@/games/connect/daily";
import { completedToday, globalStreak, type DailyGameId } from "@/games/core/globalStreak";
import { resultFor, todayUTC, type DailyResult } from "@/games/core/dailyStats";
import type { Top10Prompt } from "@/games/top10/types";

/**
 * The daily rail: three live puzzles, one shared streak. Only real state is
 * shown — no fake activity, no invented player counts.
 */
export function TodayAtNircosi() {
  const fetchDaily = useServerFn(getDailyConnect);
  const fetchTop10 = useServerFn(getTop10Today);
  const [today] = useState(() => todayUTC());
  const [result, setResult] = useState<DailyResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState<Record<DailyGameId, boolean>>({
    connect: false,
    top10: false,
    person: false,
  });
  const [data, setData] = useState<DailyConnectPayload | null>(null);
  const [top10, setTop10] = useState<Top10Prompt | null>(null);

  useEffect(() => {
    setResult(resultFor(DAILY_GAME_ID, today));
    setDone(completedToday(today));
    setStreak(globalStreak(today));
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    void fetchDaily({ data: { date: today } })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        // The card degrades to generic copy when the backend is unreachable.
      });
    void fetchTop10({ data: { date: today } })
      .then((payload) => {
        if (!cancelled) setTop10(payload);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [fetchDaily, fetchTop10, today]);

  const played = Object.values(done).filter(Boolean).length;

  return (
    <section className="mt-14 w-full text-left">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Today at Nircosi
        </h2>
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {played}/3 played{streak > 0 ? ` · 🔥 ${streak}` : ""}
        </span>
      </div>

      <Link
        to="/connect/daily"
        className="group mt-5 block border border-link/40 bg-link/5 px-6 py-6 transition-colors duration-300 hover:border-link/70 hover:bg-link/10"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-link">
            Daily Connect{data ? ` #${data.number}` : ""}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-foreground">
            {done[DAILY_GAME_ID as DailyGameId] ? "Completed today" : "Play"}
          </span>
        </div>

        {data?.start && data.target ? (
          <div className="mt-5 flex items-center gap-4">
            <Endpoint name={data.start.name} imageFile={data.start.imageFile} />
            <span aria-hidden className="text-muted-foreground/50">
              →
            </span>
            <Endpoint name={data.target.name} imageFile={data.target.imageFile} accent />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Two actors, one shared puzzle. New pair every midnight UTC.
          </p>
        )}

        {result && (
          <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {result.gaveUp ? "Gave up" : `${result.clicks} connections`}
          </p>
        )}
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DailyCard
          to="/daily/top-10"
          label={`Daily Top 10${top10 ? ` #${top10.number}` : ""}`}
          title={top10?.title ?? "One ranked list. Ten blanks."}
          tagline="Name every entry. No multiple choice."
          done={done.top10}
          accent="text-gold"
          hover="hover:border-gold/70 hover:bg-gold/5"
        />
        <DailyCard
          to="/daily/person"
          label="Daily Person"
          title="Six clues, worst first."
          tagline="Deduce the hidden actor before the face appears."
          done={done.person}
          accent="text-foreground"
          hover="hover:border-foreground/60 hover:bg-foreground/5"
        />
      </div>

      <div className="mt-5">
        <Link
          to="/daily"
          className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          See all dailies →
        </Link>
      </div>
    </section>
  );
}

function DailyCard({
  to,
  label,
  title,
  tagline,
  done,
  accent,
  hover,
}: {
  to: "/daily/top-10" | "/daily/person";
  label: string;
  title: string;
  tagline: string;
  done: boolean;
  accent: string;
  hover: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col justify-between border border-border/70 bg-card/30 px-6 py-5 transition-colors duration-300 ${hover}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[10px] font-medium uppercase tracking-[0.24em] ${accent}`}>
          {label}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-foreground">
          {done ? "Completed" : "Play"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-snug text-foreground">{title}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{tagline}</p>
    </Link>
  );
}

function Endpoint({
  name,
  imageFile,
  accent,
}: {
  name: string;
  imageFile: string | null;
  accent?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
      <Portrait person={{ name, image: imageFile ?? "" }} size="md" accent={accent ?? false} />
      <span className="w-full truncate font-display text-[13px] font-semibold leading-tight tracking-[0.03em] text-foreground sm:text-[15px]">
        {name}
      </span>
    </span>
  );
}
