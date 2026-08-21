/**
 * The competitive reward on every daily result screen.
 *
 * Submits the finished result once (server dedupes per identity per game/date),
 * then shows the player's exact rank plus a compact window of the board around
 * them. Fully available to anonymous players — the account CTA appears only
 * AFTER they have seen where they placed.
 */
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitDailyScore } from "@/lib/leaderboard.functions";
import { todayUTC } from "@/games/core/dailyStats";
import type { DailyGameId } from "@/games/core/globalStreak";
import { leaderboardPage, rankOf } from "@/games/core/leaderboard";
import { formatPerformance, GAME_LABEL, type RankRow } from "@/games/core/ranking";
import { useSession } from "@/games/core/useSession";
import { visitorKey } from "@/games/core/visitor";

export function DailyRank({
  game,
  date,
  number,
  score,
  timeMs,
  meta = {},
  /** Gave-up / unfinished rounds are never ranked. */
  eligible = true,
  onRank,
}: {
  game: DailyGameId;
  date: string;
  number: number;
  score: number;
  timeMs: number;
  meta?: Record<string, number | string | boolean>;
  eligible?: boolean;
  onRank?: (rank: number | null, total: number) => void;
}) {
  const submit = useServerFn(submitDailyScore);
  const session = useSession();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<RankRow[]>([]);
  const [full, setFull] = useState(false);
  const [ready, setReady] = useState(false);

  const isToday = date === todayUTC();

  const loadWindow = useCallback(
    async (myRank: number | null) => {
      const offset = myRank ? Math.max(0, myRank - 4) : 0;
      setRows(await leaderboardPage(game, date, myRank ? 7 : 10, offset));
    },
    [game, date],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (!eligible || !isToday) {
        const page = await leaderboardPage(game, date, 10, 0);
        if (alive) {
          setRows(page);
          setReady(true);
        }
        return;
      }
      try {
        const res = await submit({
          data: { game, date, number, score, timeMs, meta, visitorKey: visitorKey() },
        });
        if (!alive) return;
        setEntryId(res.entryId);
        setRank(res.rank);
        setTotal(res.total);
        onRank?.(res.rank, res.total);
        await loadWindow(res.rank);
      } catch {
        // Ranking is a reward, never a blocker — the result screen stands alone.
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
    // Submits exactly once per finished round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signing in mid-screen re-labels the entry — refresh the window.
  useEffect(() => {
    if (!entryId || session.loading) return;
    void (async () => {
      const r = await rankOf(game, date, entryId);
      setRank(r.rank);
      setTotal(r.total);
      await loadWindow(r.rank);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.userId, session.username]);

  if (!ready) return null;

  return (
    <section className="mt-8 border border-border/70 text-left">
      <header className="flex items-baseline justify-between border-b border-border/70 px-4 py-3">
        <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
          {isToday ? "Today's leaderboard" : `Leaderboard · ${date}`}
        </p>
        {rank !== null && (
          <p className="text-[11px] font-medium tabular-nums text-foreground">
            #{rank} of {total}
          </p>
        )}
      </header>

      {!isToday && (
        <p className="border-b border-border/70 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
          Past puzzle — replays are not ranked
        </p>
      )}

      {rows.length === 0 ? (
        <p className="px-4 py-5 text-[12px] text-muted-foreground">
          No ranked results for this date yet.
        </p>
      ) : (
        <ol className="divide-y divide-border/60">
          {rows.map((row) => {
            const me = row.entryId === entryId;
            return (
              <li
                key={row.entryId}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] ${
                  me ? "bg-accent/60 font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="w-8 shrink-0 tabular-nums">{row.rank}</span>
                <span className="min-w-0 flex-1 truncate">{me ? "YOU" : row.label}</span>
                <span className="shrink-0 tabular-nums">
                  {formatPerformance(game, row.score, row.timeMs, row.meta)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3">
        <button
          type="button"
          onClick={() => setFull((f) => !f)}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {full ? "Hide full leaderboard" : "View full leaderboard"}
        </button>
        {!session.loading && !session.userId && rank !== null && (
          <Link
            to="/auth"
            className="text-[10px] uppercase tracking-[0.2em] text-link transition-opacity hover:opacity-70"
          >
            #{rank} today — save your score
          </Link>
        )}
      </div>

      {full && <FullBoard game={game} date={date} entryId={entryId} />}
    </section>
  );
}

/** Top-N with paging — never pulls the whole board to the client. */
export function FullBoard({
  game,
  date,
  entryId,
}: {
  game: DailyGameId;
  date: string;
  entryId?: string | null;
}) {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [page, setPage] = useState(0);
  const size = 25;

  useEffect(() => {
    void leaderboardPage(game, date, size, page * size).then(setRows);
  }, [game, date, page]);

  return (
    <div className="border-t border-border/70">
      <p className="px-4 pt-3 text-[9px] uppercase tracking-[0.26em] text-muted-foreground">
        {GAME_LABEL[game]} · {date}
      </p>
      <ol className="mt-2 divide-y divide-border/60">
        {rows.map((row) => (
          <li
            key={row.entryId}
            className={`flex items-center gap-3 px-4 py-2.5 text-[12px] ${
              row.entryId === entryId
                ? "bg-accent/60 font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <span className="w-8 shrink-0 tabular-nums">{row.rank}</span>
            <span className="min-w-0 flex-1 truncate">
              {row.entryId === entryId ? "YOU" : row.label}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatPerformance(game, row.score, row.timeMs, row.meta)}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em]">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          Previous
        </button>
        <span className="tabular-nums text-muted-foreground/70">Page {page + 1}</span>
        <button
          type="button"
          disabled={rows.length < size}
          onClick={() => setPage((p) => p + 1)}
          className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
