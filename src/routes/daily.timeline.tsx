import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { SITE } from "@/config/site";
import {
  DailyFooterLinks,
  DailyHeader,
  NextDailyNote,
  ResultSurface,
  ShareButton,
  Stat,
  accentButton,
  formatTime,
} from "@/games/core/components/DailyChrome";
import { loadProgress, saveProgress } from "@/games/core/dailyProgress";
import {
  currentStreak,
  loadDailyStats,
  recordDaily,
  resultFor,
  todayUTC,
  type DailyResult,
  type DailyStats,
} from "@/games/core/dailyStats";
import {
  TIMELINE_GAME_ID,
  TIMELINE_SIZE,
  type TimelinePrompt,
  type TimelineReveal,
} from "@/games/timeline/types";
import { getDailyTimeline, revealDailyTimeline } from "@/lib/timeline.functions";

export const Route = createFileRoute("/daily/timeline")({
  component: DailyTimelinePage,
  head: () => ({
    meta: [
      { title: `Daily Timeline — order six films by release year | ${SITE.name}` },
      {
        name: "description",
        content:
          "Six films, one shot: put them in theatrical release order, oldest to newest. A new timeline puzzle every midnight UTC, the same six films for everyone.",
      },
      { property: "og:title", content: `Daily Timeline | ${SITE.name}` },
      {
        property: "og:description",
        content: "Six films. One submission. Put them in release order, oldest to newest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Phase = "intro" | "playing" | "done";

interface Progress {
  order: string[];
  startedAt: number;
  done: boolean;
}

/** Correct positions, comparing the player's order against the solution. */
export function scoreOrder(order: string[], solution: string[]): number {
  return order.reduce((n, key, i) => (key === solution[i] ? n + 1 : n), 0);
}

function DailyTimelinePage() {
  const date = useMemo(() => todayUTC(), []);
  const fetchPrompt = useServerFn(getDailyTimeline);
  const fetchReveal = useServerFn(revealDailyTimeline);

  const [prompt, setPrompt] = useState<TimelinePrompt | null>(null);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [order, setOrder] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [reveal, setReveal] = useState<TimelineReveal | null>(null);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    setStats(loadDailyStats(TIMELINE_GAME_ID));
    const saved = loadProgress<Progress>(TIMELINE_GAME_ID, date);
    if (saved?.order?.length) {
      setOrder(saved.order);
      setStartedAt(saved.startedAt ?? null);
      if (!saved.done) setPhase("playing");
    }
    const existing = resultFor(TIMELINE_GAME_ID, date);
    if (existing) {
      setResult(existing);
      recorded.current = true;
      setPhase("done");
    }
  }, [date]);

  useEffect(() => {
    void fetchPrompt({ data: { date } })
      .then((p) => {
        setPrompt(p);
        setOrder((current) => (current.length === p.cards.length ? current : p.cards.map((c) => c.key)));
      })
      .catch(() => setFailed(true));
  }, [fetchPrompt, date]);

  // The years only ever reach the browser once the round is over.
  useEffect(() => {
    if (phase !== "done" || reveal) return;
    void fetchReveal({ data: { date } })
      .then(setReveal)
      .catch(() => undefined);
  }, [phase, reveal, fetchReveal, date]);

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 500);
    setElapsed(Date.now() - startedAt);
    return () => window.clearInterval(id);
  }, [phase, startedAt]);

  const titleOf = useCallback(
    (key: string) => prompt?.cards.find((c) => c.key === key)?.title ?? "",
    [prompt],
  );

  const persist = useCallback(
    (next: Partial<Progress>) => {
      saveProgress<Progress>(TIMELINE_GAME_ID, date, {
        order,
        startedAt: startedAt ?? Date.now(),
        done: phase === "done",
        ...next,
      });
    },
    [date, order, startedAt, phase],
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= order.length || from === to) return;
      const next = order.slice();
      const [card] = next.splice(from, 1);
      next.splice(to, 0, card!);
      setOrder(next);
      persist({ order: next });
    },
    [order, persist],
  );

  const tap = useCallback(
    (key: string) => {
      if (selected === null) {
        setSelected(key);
        return;
      }
      if (selected === key) {
        setSelected(null);
        return;
      }
      const from = order.indexOf(selected);
      const to = order.indexOf(key);
      const next = order.slice();
      next[from] = key;
      next[to] = selected;
      setOrder(next);
      setSelected(null);
      persist({ order: next });
    },
    [selected, order, persist],
  );

  const start = useCallback(() => {
    const now = Date.now();
    setStartedAt(now);
    setPhase("playing");
    persist({ startedAt: now });
  }, [persist]);

  const submit = useCallback(async () => {
    if (!prompt || submitting) return;
    setSubmitting(true);
    const timeMs = startedAt ? Date.now() - startedAt : elapsed;
    try {
      const answer = await fetchReveal({ data: { date } });
      setReveal(answer);
      const score = scoreOrder(
        order,
        answer.solution.map((s) => s.key),
      );
      const finished: DailyResult = {
        date,
        number: prompt.number,
        clicks: 0,
        score,
        total: prompt.total,
        timeMs,
        gaveUp: false,
      };
      setResult(finished);
      setPhase("done");
      persist({ done: true });
      if (!recorded.current) {
        recorded.current = true;
        setStats(recordDaily(TIMELINE_GAME_ID, finished));
      }
    } catch {
      setSubmitting(false);
    }
  }, [prompt, submitting, startedAt, elapsed, fetchReveal, date, order, persist]);

  if (failed) {
    return (
      <div className="stage flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-2xl tracking-[0.1em] text-foreground">
          Today&apos;s timeline is unavailable
        </h1>
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
          The backend didn&apos;t answer. Refresh in a moment.
        </p>
        <DailyFooterLinks />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="stage flex min-h-screen items-center justify-center px-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const streak = stats ? currentStreak(stats, date) : 0;

  if (phase === "done" && result) {
    const solutionKeys = reveal?.solution.map((s) => s.key) ?? [];
    const marks = solutionKeys.length
      ? order.map((key, i) => (key === solutionKeys[i] ? "🟩" : "🟥")).join("")
      : "";
    const shareText = [
      `${SITE.name.toUpperCase()} TIMELINE #${result.number} — ${result.score ?? 0}/${result.total ?? TIMELINE_SIZE} — ${formatTime(result.timeMs)}`,
      ...(marks ? [marks] : []),
      ...(streak > 0 ? [`🔥 ${streak} day streak`] : []),
      "nircosi.com/daily/timeline",
    ].join("\n");

    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-8 sm:py-14">
        <ResultSurface className="text-center" label="Daily Timeline result">
          <DailyHeader label={`Daily Timeline #${result.number}`} date={date} accent="ink" />
          <h1 className="mt-8 font-display text-[clamp(2rem,7vw,3.2rem)] leading-none tracking-[0.06em] text-foreground">
            {result.score ?? 0}/{result.total ?? TIMELINE_SIZE}
          </h1>

          {reveal && (
            <ol className="mt-8 border border-border/70 text-left">
              {reveal.solution.map((card, i) => {
                const correct = order[i] === card.key;
                return (
                  <li
                    key={card.key}
                    className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
                  >
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${correct ? "bg-top10" : "bg-danger"}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {card.title}
                    </span>
                    <span className="shrink-0 font-display text-xs tabular-nums tracking-[0.1em] text-muted-foreground">
                      {card.year}
                    </span>
                    {!correct && (
                      <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 sm:inline">
                        you had {titleOf(order[i] ?? "") || "—"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat
              label="Correct"
              value={`${result.score ?? 0}/${result.total ?? TIMELINE_SIZE}`}
              accent
            />
            <Stat label="Time" value={formatTime(result.timeMs)} />
            <Stat label="Streak" value={String(streak)} />
          </div>

          <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Daily rankings coming soon
          </p>

          <ShareButton text={shareText} accent="ink" className="mt-8 w-full sm:w-auto" />
          <NextDailyNote />
          <DailyFooterLinks />
        </ResultSurface>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
        <DailyHeader label={`Daily Timeline #${prompt.number}`} date={date} accent="ink" />
        <h1 className="mt-6 font-display text-[clamp(2.2rem,9vw,4rem)] leading-none tracking-[0.08em] text-foreground">
          TIMELINE
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Put the six movies in release order, oldest to newest.
        </p>
        <button
          onClick={start}
          className={`mt-12 border px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] transition-colors duration-300 ${accentButton("ink")}`}
        >
          Play today
        </button>
        <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Timer starts when you begin · one submission
        </p>
        <DailyFooterLinks />
      </div>
    );
  }

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center">
          <DailyHeader label={`Daily Timeline #${prompt.number}`} date={date} accent="ink" />
        </div>

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>Oldest → newest</span>
          <span className="tabular-nums">{formatTime(elapsed)}</span>
        </div>

        <ol className="mt-3 border border-border/70">
          {order.map((key, i) => {
            const isSelected = selected === key;
            return (
              <li
                key={key}
                className={`flex items-center gap-2 border-b border-border/50 transition-colors last:border-b-0 ${
                  isSelected ? "bg-accent" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => tap(key)}
                  aria-pressed={isSelected}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left"
                >
                  <span className="w-5 shrink-0 font-display text-xs tabular-nums tracking-[0.1em] text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                    {titleOf(key)}
                  </span>
                </button>
                <span className="flex shrink-0 flex-col pr-2">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Move ${titleOf(key)} earlier`}
                    className="grid h-7 w-8 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === order.length - 1}
                    aria-label={`Move ${titleOf(key)} later`}
                    className="grid h-7 w-8 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Tap two titles to swap · arrows to nudge
        </p>

        <button
          onClick={() => void submit()}
          disabled={submitting}
          className={`mt-8 w-full border px-10 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] transition-colors disabled:opacity-50 ${accentButton("ink")}`}
        >
          {submitting ? "Checking…" : "Submit order"}
        </button>

        <DailyFooterLinks />
      </div>
    </div>
  );
}
