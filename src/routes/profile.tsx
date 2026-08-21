import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/games/core/useSession";
import { myHistory, type HistoryRow } from "@/games/core/leaderboard";
import { formatPerformance, GAME_LABEL } from "@/games/core/ranking";
import { dayNumberFromDate } from "@/games/core/dailyStats";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: `Your profile — streak and daily history | ${SITE.name}` },
      {
        name: "description",
        content:
          "Your NIRCOSI profile: username, current and best daily streak, and the history of every daily film puzzle you have finished.",
      },
      { property: "og:title", content: `Your ${SITE.name} profile` },
      { property: "og:description", content: "Streaks and daily history for your film puzzles." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/** One UTC date with at least one finished daily keeps the streak alive. */
function streaks(dates: string[]): { current: number; best: number } {
  const days = [...new Set(dates)].map(dayNumberFromDate).sort((a, b) => b - a);
  if (days.length === 0) return { current: 0, best: 0 };
  const today = Math.floor(Date.now() / 86_400_000);
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    run = days[i - 1]! - days[i]! === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  let current = 0;
  if (today - days[0]! <= 1) {
    current = 1;
    for (let i = 1; i < days.length; i += 1) {
      if (days[i - 1]! - days[i]! !== 1) break;
      current += 1;
    }
  }
  return { current, best: Math.max(best, current) };
}

function ProfilePage() {
  const navigate = useNavigate();
  const session = useSession();
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.loading && !session.userId) void navigate({ to: "/auth", replace: true });
  }, [session.loading, session.userId, navigate]);

  useEffect(() => {
    if (!session.userId) return;
    void myHistory().then(setHistory);
  }, [session.userId, session.username]);

  useEffect(() => {
    setName(session.username ?? "");
  }, [session.username]);

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { error: err } = await supabase.rpc("set_username", { _username: name.trim() });
    setSaving(false);
    if (err) setError(err.message.replace(/^.*ERROR:\s*/, ""));
    else await supabase.auth.refreshSession();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  };

  const s = streaks(history.map((h) => h.date));
  const byDate = history.reduce<Record<string, HistoryRow[]>>((acc, row) => {
    (acc[row.date] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-14">
      <div className="w-full max-w-xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {SITE.name} profile
        </p>
        <h1 className="mt-5 font-display text-[clamp(1.9rem,7vw,3rem)] leading-none tracking-[0.08em] text-foreground">
          {session.username ? session.username.toUpperCase() : "CHOOSE A NAME"}
        </h1>

        <dl className="mt-8 grid grid-cols-3 border border-border/70">
          <Cell label="Streak" value={String(s.current)} />
          <Cell label="Best" value={String(s.best)} />
          <Cell label="Played" value={String(history.length)} />
        </dl>

        <form onSubmit={saveUsername} className="mt-8">
          <label
            htmlFor="username"
            className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground"
          >
            Leaderboard username
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={3}
              maxLength={20}
              required
              placeholder="3–20 letters, numbers or _"
              className="min-w-0 flex-1 border border-border/70 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            />
            <button
              type="submit"
              disabled={saving || name.trim() === (session.username ?? "")}
              className="border border-foreground bg-foreground px-5 text-[10px] font-medium uppercase tracking-[0.2em] text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-40"
            >
              Save
            </button>
          </div>
          {error && <p className="mt-2 text-[12px] text-muted-foreground">{error}</p>}
        </form>

        <h2 className="mt-12 text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
          Recent dailies
        </h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing yet — finish a daily and it will appear here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 border border-border/70">
            {Object.entries(byDate).map(([date, rows]) => (
              <li key={date} className="px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {date} · {rows.length} played
                </p>
                <ul className="mt-2 space-y-1">
                  {rows.map((row) => (
                    <li
                      key={row.game}
                      className="flex items-center justify-between gap-3 text-[12px] text-foreground"
                    >
                      <span className="truncate">{GAME_LABEL[row.game]}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatPerformance(row.game, row.score, row.timeMs, row.meta)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/daily"
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Today&apos;s dailies
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-border/70 px-4 py-4 last:border-r-0">
      <dt className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
