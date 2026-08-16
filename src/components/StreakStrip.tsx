import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  loadDailyStats,
  shiftDate,
  todayUTC,
  type DailyResult,
} from "@/games/core/dailyStats";
import { DAILY_GAMES, globalStreak, type DailyGameId } from "@/games/core/globalStreak";

const GAME_LABEL: Record<DailyGameId, string> = {
  connect: "Connect",
  top10: "Top 10",
  person: "Person",
};

const DOT: Record<DailyGameId, string> = {
  connect: "bg-connect",
  top10: "bg-top10",
  person: "bg-person",
};

/**
 * Compact habit strip: current streak, days played, and the last week of
 * real local results. Purely local data — nothing invented.
 */
export function StreakStrip() {
  const [today] = useState(() => todayUTC());
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [days, setDays] = useState<{ date: string; done: DailyGameId[] }[]>([]);
  const [recent, setRecent] = useState<{ game: DailyGameId; result: DailyResult }[]>([]);

  useEffect(() => {
    setStreak(globalStreak(today));

    const byGame = DAILY_GAMES.map((g) => ({ game: g, stats: loadDailyStats(g) }));
    setBest(Math.max(0, ...byGame.map((b) => b.stats.bestStreak)));

    const week = Array.from({ length: 7 }, (_, i) => shiftDate(today, i - 6)).map((date) => ({
      date,
      done: byGame.filter((b) => b.stats.results.some((r) => r.date === date)).map((b) => b.game),
    }));
    setDays(week);

    const all = byGame.flatMap((b) => b.stats.results.map((result) => ({ game: b.game, result })));
    all.sort((a, z) => (a.result.date < z.result.date ? 1 : -1));
    setRecent(all.slice(0, 4));
  }, [today]);

  return (
    <section
      aria-label="Your daily streak"
      className="grid gap-8 rounded-sm border border-border bg-card px-6 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10"
    >
      <div className="flex gap-8">
        <Metric label="Streak" value={streak} />
        <Metric label="Best" value={best} />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground/70">
          Last 7 days
        </p>
        <ol className="mt-3 flex gap-2">
          {days.map((day) => (
            <li
              key={day.date}
              title={`${day.date} — ${day.done.length}/3`}
              className="flex h-9 w-full max-w-11 flex-col items-center justify-center gap-1 rounded-sm border border-border/70"
            >
              <span className="flex gap-0.5" aria-hidden>
                {DAILY_GAMES.map((g) => (
                  <span
                    key={g}
                    className={`h-1.5 w-1.5 rounded-full ${
                      day.done.includes(g) ? DOT[g] : "bg-border"
                    }`}
                  />
                ))}
              </span>
              <span className="text-[9px] tabular-nums text-muted-foreground/70">
                {day.date.slice(8)}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          {recent.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              No results yet — finish a daily to start your streak.
            </p>
          ) : (
            recent.map(({ game, result }) => (
              <span key={`${game}-${result.date}`} className="text-[12px] text-muted-foreground">
                <span className="text-foreground">{GAME_LABEL[game]}</span> · {result.date.slice(5)}{" "}
                ·{" "}
                {result.gaveUp
                  ? "gave up"
                  : game === "top10"
                    ? `${result.score ?? 0}/${result.total ?? 10}`
                    : game === "person"
                      ? `${result.clues ?? 0} clues`
                      : `${result.clicks} links`}
              </span>
            ))
          )}
          <Link
            to="/daily"
            className="text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            All dailies →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl tabular-nums leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}
