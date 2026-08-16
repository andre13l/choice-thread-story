import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { getDailyConnect, type DailyConnectPayload } from "@/lib/connect.functions";
import { Portrait } from "@/games/connect/components/Portrait";
import { DAILY_GAME_ID } from "@/games/connect/daily";
import {
  currentStreak,
  loadDailyStats,
  resultFor,
  todayUTC,
  type DailyResult,
} from "@/games/core/dailyStats";

/**
 * The daily rail. Only Daily Connect is playable; the other two are honest
 * placeholders, not fake activity.
 */
export function TodayAtNircosi() {
  const fetchDaily = useServerFn(getDailyConnect);
  const [today] = useState(() => todayUTC());
  const [result, setResult] = useState<DailyResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [data, setData] = useState<DailyConnectPayload | null>(null);

  useEffect(() => {
    setResult(resultFor(DAILY_GAME_ID, today));
    setStreak(currentStreak(loadDailyStats(DAILY_GAME_ID), today));
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
    return () => {
      cancelled = true;
    };
  }, [fetchDaily, today]);

  return (
    <section className="mt-14 w-full text-left">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Today at Nircosi
        </h2>
        {streak > 0 && (
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            🔥 {streak} day streak
          </span>
        )}
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
            {result ? "Completed today" : "Play"}
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
        <SoonCard name="Daily Top 10" tagline="Name the ten. One list a day." />
        <SoonCard name="Daily Person" tagline="Deduce the actor from a drip of clues." />
      </div>
    </section>
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
    <span className="flex min-w-0 items-center gap-3">
      <Portrait person={{ name, image: imageFile ?? "" }} size="md" accent={accent ?? false} />
      <span className="truncate font-display text-[15px] font-semibold tracking-[0.03em] text-foreground">
        {name}
      </span>
    </span>
  );
}

function SoonCard({ name, tagline }: { name: string; tagline: string }) {
  return (
    <div className="flex flex-col justify-between border border-border/70 bg-card/30 px-6 py-5 opacity-45">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold tracking-[0.06em] text-muted-foreground">
          {name}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Coming next
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{tagline}</p>
    </div>
  );
}
