import { Link } from "@tanstack/react-router";
import { Check, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { loadDailyStats, shiftDate, todayUTC, type DailyResult } from "@/games/core/dailyStats";
import { DAILY_GAMES, globalStreak, type DailyGameId } from "@/games/core/globalStreak";

const GAME_LABEL: Record<DailyGameId, string> = {
  connect: "Connect",
  top10: "Top 10",
  person: "Person",
  timeline: "Timeline",
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Day {
  date: string;
  done: DailyGameId[];
}

function useHistory() {
  const [today] = useState(() => todayUTC());
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<Day[]>([]);
  const [recent, setRecent] = useState<{ game: DailyGameId; result: DailyResult }[]>([]);

  useEffect(() => {
    setStreak(globalStreak(today));
    const byGame = DAILY_GAMES.map((g) => ({ game: g, stats: loadDailyStats(g) }));
    setDays(
      Array.from({ length: 7 }, (_, i) => shiftDate(today, i - 6)).map((date) => ({
        date,
        done: byGame.filter((b) => b.stats.results.some((r) => r.date === date)).map((b) => b.game),
      })),
    );
    const all = byGame.flatMap((b) => b.stats.results.map((result) => ({ game: b.game, result })));
    all.sort((a, z) => (a.result.date < z.result.date ? 1 : -1));
    setRecent(all.slice(0, 3));
  }, [today]);

  return { today, streak, days, recent };
}

/** Compact habit card: current streak plus the last seven days. */
export function StreakStrip() {
  const { today, streak, days } = useHistory();

  return (
    <section
      aria-label="Your daily streak"
      className="flex h-full flex-col rounded-md border border-border bg-card px-4 py-4"
    >
      <div className="flex items-center gap-2.5">
        <Flame className="h-4 w-4 shrink-0 text-gold" aria-hidden />
        <p className="min-w-0 text-[13px] font-semibold text-foreground">
          {streak} day streak
        </p>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">
        {streak > 0
          ? "Keep it going — three new challenges tomorrow."
          : "Finish a daily to start your streak."}
      </p>

      <ol className="mt-4 flex items-end gap-1.5">
        {days.map((day) => {
          const isToday = day.date === today;
          const complete = day.done.length === DAILY_GAMES.length;
          return (
            <li
              key={day.date}
              title={`${day.date} — ${day.done.length}/3`}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                {DOW[new Date(`${day.date}T00:00:00Z`).getUTCDay()]}
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {day.date.slice(8)}
              </span>
              <span
                aria-hidden
                className={`grid h-5 w-5 place-items-center rounded-full border text-[0px] ${
                  complete
                    ? "border-top10 bg-top10/12 text-top10"
                    : day.done.length > 0
                      ? "border-foreground/30"
                      : "border-border"
                } ${isToday ? "ring-1 ring-foreground/30 ring-offset-1 ring-offset-card" : ""}`}
              >
                {complete && <Check className="h-3 w-3" />}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Right-hand status panel: the newest real results across the dailies. */
export function RecentActivity() {
  const { recent } = useHistory();

  return (
    <section
      aria-label="Recent activity"
      className="flex h-full flex-col rounded-md border border-border bg-card px-4 py-4"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        Recent activity
      </p>

      <ul className="mt-3 flex-1 space-y-2">
        {recent.length === 0 ? (
          <li className="text-[12px] text-muted-foreground">No results yet.</li>
        ) : (
          recent.map(({ game, result }) => (
            <li
              key={`${game}-${result.date}`}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-[12px]"
            >
              <span className="min-w-0 truncate text-foreground">
                {GAME_LABEL[game]} #{result.number}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {result.gaveUp
                  ? "gave up"
                  : game === "top10"
                    ? `${result.score ?? 0}/${result.total ?? 10}`
                    : game === "person"
                      ? `${result.clues ?? 0} clues`
                      : `${result.clicks} links`}
              </span>
              <Check className="h-3.5 w-3.5 shrink-0 text-top10" aria-hidden />
            </li>
          ))
        )}
      </ul>

      <Link
        to="/daily"
        className="mt-4 block rounded-full border border-border px-3 py-1.5 text-center text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
      >
        View history
      </Link>
    </section>
  );
}
