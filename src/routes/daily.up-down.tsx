import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SITE } from "@/config/site";
import {
  DailyFooterLinks,
  DailyHeader,
  NextDailyNote,
  ResultSurface,
  ShareButton,
  Stat,
  accentButton,
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
import { recordRankable } from "@/games/core/rankable";
import { UPDOWN_GAME_ID, UPDOWN_ROUNDS, type UpDownPrompt } from "@/games/updown/types";
import { getDailyUpDown } from "@/lib/updown.functions";

export const Route = createFileRoute("/daily/up-down")({
  component: DailyUpDownPage,
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search["date"] === "string" ? (search["date"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Daily Up & Down — Box Office Rush | ${SITE.name}` },
      {
        name: "description",
        content:
          "Ten rounds against the clock: did the next film make more or less worldwide than the last? A new frozen sequence every midnight UTC, identical for every player.",
      },
      { property: "og:title", content: `Daily Up & Down | ${SITE.name}` },
      {
        property: "og:description",
        content: "Box Office Rush — ten timed rounds of more or less, same films for everyone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Phase = "intro" | "playing" | "done";

interface Progress {
  index: number;
  marks: boolean[];
  startedAt: number;
  done: boolean;
}

/** "$1.01B" / "$482.5M" — one compact reading of a worldwide gross. */
export function formatGross(millions: number): string {
  return millions >= 1000
    ? `$${(millions / 1000).toFixed(2)}B`
    : `$${millions.toFixed(1)}M`;
}

export function formatSeconds(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(2)}s`;
}

function DailyUpDownPage() {
  const search = Route.useSearch();
  const today = useMemo(() => todayUTC(), []);
  const date = search.date && /^\d{4}-\d{2}-\d{2}$/.test(search.date) ? search.date : today;
  const fetchPrompt = useServerFn(getDailyUpDown);

  const [prompt, setPrompt] = useState<UpDownPrompt | null>(null);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<boolean[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const recorded = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setStats(loadDailyStats(UPDOWN_GAME_ID));
    const saved = loadProgress<Progress>(UPDOWN_GAME_ID, date);
    if (saved && !saved.done) {
      setIndex(saved.index);
      setMarks(saved.marks ?? []);
      setStartedAt(saved.startedAt);
      setPhase("playing");
    }
    const existing = resultFor(UPDOWN_GAME_ID, date);
    if (existing) {
      setResult(existing);
      recorded.current = true;
      setPhase("done");
    }
  }, [date]);

  useEffect(() => {
    void fetchPrompt({ data: { date } })
      .then(setPrompt)
      .catch(() => setFailed(true));
  }, [fetchPrompt, date]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const finish = useCallback(
    (finalMarks: boolean[], startTime: number) => {
      const correct = finalMarks.filter(Boolean).length;
      const timeMs = Date.now() - startTime;
      const number = prompt?.number ?? 0;
      const finished: DailyResult = {
        date,
        number,
        clicks: 0,
        score: correct,
        total: UPDOWN_ROUNDS,
        timeMs,
        gaveUp: false,
      };
      setResult(finished);
      setPhase("done");
      saveProgress<Progress>(UPDOWN_GAME_ID, date, {
        index: UPDOWN_ROUNDS,
        marks: finalMarks,
        startedAt: startTime,
        done: true,
      });
      if (!recorded.current) {
        recorded.current = true;
        setStats(recordDaily(UPDOWN_GAME_ID, finished));
        recordRankable({
          gameId: UPDOWN_GAME_ID,
          date,
          number,
          correct,
          total: UPDOWN_ROUNDS,
          timeMs,
        });
      }
    },
    [date, prompt],
  );

  const answer = useCallback(
    (saidMore: boolean) => {
      if (!prompt || locked || startedAt === null) return;
      const current = prompt.cards[index]!;
      const next = prompt.cards[index + 1]!;
      const correct = (next.grossM > current.grossM) === saidMore;
      const nextMarks = [...marks, correct];
      setMarks(nextMarks);
      setRevealed(true);
      setLocked(true);
      timer.current = window.setTimeout(() => {
        setRevealed(false);
        setLocked(false);
        if (index + 1 >= UPDOWN_ROUNDS) {
          finish(nextMarks, startedAt);
        } else {
          setIndex(index + 1);
          saveProgress<Progress>(UPDOWN_GAME_ID, date, {
            index: index + 1,
            marks: nextMarks,
            startedAt,
            done: false,
          });
        }
      }, 650);
    },
    [prompt, locked, startedAt, index, marks, finish, date],
  );

  const start = useCallback(() => {
    const now = Date.now();
    setStartedAt(now);
    setIndex(0);
    setMarks([]);
    setPhase("playing");
    saveProgress<Progress>(UPDOWN_GAME_ID, date, {
      index: 0,
      marks: [],
      startedAt: now,
      done: false,
    });
  }, [date]);

  if (failed) {
    return (
      <div className="stage flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-2xl tracking-[0.1em] text-foreground">
          Today&apos;s Up &amp; Down is unavailable
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
    const grid = marks.length
      ? marks.map((m) => (m ? "🟩" : "🟥")).join("")
      : "";
    const shareText = [
      `${SITE.name.toUpperCase()} UP & DOWN #${result.number} — ${result.score ?? 0}/${result.total ?? UPDOWN_ROUNDS} — ${formatSeconds(result.timeMs)}`,
      ...(grid ? [grid] : []),
      ...(streak > 0 ? [`🔥 ${streak} day streak`] : []),
    ].join("\n");

    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-8 sm:py-14">
        <ResultSurface className="text-center" label="Daily Up and Down result">
          <DailyHeader label={`Daily Up & Down #${result.number}`} date={date} accent="gold" />
          <h1 className="mt-8 font-display text-[clamp(2rem,7vw,3.2rem)] leading-none tracking-[0.06em] text-foreground">
            {result.score ?? 0}/{result.total ?? UPDOWN_ROUNDS}
          </h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground tabular-nums">
            {formatSeconds(result.timeMs)}
          </p>

          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat label="Correct" value={`${result.score ?? 0}/${result.total ?? UPDOWN_ROUNDS}`} accent />
            <Stat label="Time" value={formatSeconds(result.timeMs)} />
            <Stat label="Streak" value={String(streak)} />
          </div>

          <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Accuracy first · time only breaks ties
          </p>

          <ShareButton
            text={shareText}
            url="/daily/up-down"
            accent="gold"
            className="mt-8 w-full sm:w-auto"
          />
          <NextDailyNote />
          <DailyFooterLinks />
        </ResultSurface>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
        <DailyHeader label={`Daily Up & Down #${prompt.number}`} date={date} accent="gold" />
        <h1 className="mt-6 font-display text-[clamp(2.2rem,9vw,4rem)] leading-none tracking-[0.08em] text-foreground">
          BOX OFFICE RUSH
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Ten films, one after another. Did the next film make MORE or LESS worldwide than the one
          on screen? Same ten for everyone today — the clock is the tiebreaker.
        </p>
        <button
          onClick={start}
          className={`mt-12 border px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] transition-colors duration-300 ${accentButton("gold")}`}
        >
          Start
        </button>
        <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Timer starts when you press start
        </p>
        <DailyFooterLinks />
      </div>
    );
  }

  const current = prompt.cards[index]!;
  const next = prompt.cards[index + 1]!;

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <DailyHeader label={`Daily Up & Down #${prompt.number}`} date={date} accent="gold" />
        </div>

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="tabular-nums">
            Round {index + 1}/{UPDOWN_ROUNDS}
          </span>
          <span aria-label="Answers so far" className="tracking-normal">
            {marks.map((m, i) => (
              <span key={i}>{m ? "🟩" : "🟥"}</span>
            ))}
          </span>
        </div>

        <div className="mt-4 border border-border/70">
          <div className="px-5 py-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
              On screen
            </p>
            <p className="mt-3 text-base leading-snug text-foreground">
              {current.title}{" "}
              <span className="text-muted-foreground tabular-nums">({current.year})</span>
            </p>
            <p className="mt-2 font-display text-2xl tracking-[0.06em] text-gold tabular-nums">
              {formatGross(current.grossM)}
            </p>
          </div>

          <div className="border-t border-border/70 px-5 py-6 text-center">
            <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
              Next film
            </p>
            <p className="mt-3 text-base leading-snug text-foreground">
              {next.title}{" "}
              <span className="text-muted-foreground tabular-nums">({next.year})</span>
            </p>
            <p
              className={`mt-2 font-display text-2xl tracking-[0.06em] tabular-nums transition-opacity duration-150 ${
                revealed ? "text-gold opacity-100" : "select-none text-transparent opacity-0"
              }`}
              aria-hidden={!revealed}
            >
              {revealed ? formatGross(next.grossM) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(true)}
            disabled={locked}
            className={`border px-6 py-4 text-[12px] font-medium uppercase tracking-[0.24em] transition-colors disabled:opacity-40 ${accentButton("gold")}`}
          >
            More
          </button>
          <button
            onClick={() => answer(false)}
            disabled={locked}
            className="border border-foreground bg-transparent px-6 py-4 text-[12px] font-medium uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
          >
            Less
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          Worldwide theatrical gross · accuracy first, time breaks ties
        </p>

        <DailyFooterLinks />
      </div>
    </div>
  );
}
