import { createFileRoute } from "@tanstack/react-router";
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
import {
  isSurvivalDate,
  UPDOWN_GAME_ID,
  UPDOWN_PATH_LENGTH,
  UPDOWN_ROUNDS,
  type UpDownPrompt,
} from "@/games/updown/types";
import { loadUpDownPrompt } from "@/games/updown/path";
import { DailyRank } from "@/games/core/components/DailyRank";

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
          "How far can you go? One shared 100-movie box office path a day — did the next film make more or less worldwide? One mistake ends your run.",
      },
      { property: "og:title", content: `Daily Up & Down | ${SITE.name}` },
      {
        property: "og:description",
        content:
          "Box Office Rush — the same 100-movie path for everyone today. One mistake ends the run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Phase = "intro" | "playing" | "done";

interface Progress {
  index: number;
  streak: number;
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
  const survival = isSurvivalDate(date);
  const pathLength = survival ? UPDOWN_PATH_LENGTH : UPDOWN_ROUNDS;

  /**
   * The daily path is derived locally from the bundled catalogue: no server
   * function, no network, so the game always starts even if the backend or
   * the leaderboard is unavailable.
   */
  const [prompt, setPrompt] = useState<UpDownPrompt | null>(null);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [missed, setMissed] = useState(false);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const recorded = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    try {
      setPrompt(loadUpDownPrompt(date, pathLength));
    } catch {
      setFailed(true);
    }
  }, [date, pathLength]);

  useEffect(() => {
    // Cutover day: clear any local state written under the old 10-round rules.
    resetLegacyUpDown(date);
    setStats(loadDailyStats(UPDOWN_GAME_ID));
    const saved = loadProgress<Progress>(UPDOWN_GAME_ID, date);
    if (saved && !saved.done) {
      setIndex(saved.index);
      setStreak(saved.streak ?? saved.index);
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

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const finish = useCallback(
    (distance: number, startTime: number) => {
      const timeMs = Date.now() - startTime;
      const number = prompt?.number ?? 0;
      const finished: DailyResult = {
        date,
        number,
        clicks: 0,
        score: distance,
        total: pathLength,
        timeMs,
        gaveUp: false,
      };
      setResult(finished);
      setPhase("done");
      saveProgress<Progress>(UPDOWN_GAME_ID, date, {
        index: distance,
        streak: distance,
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
          correct: distance,
          total: pathLength,
          timeMs,
        });
      }
    },
    [date, prompt, pathLength],
  );

  const answer = useCallback(
    (saidMore: boolean) => {
      if (!prompt || locked || startedAt === null) return;
      const current = prompt.cards[index]!;
      const next = prompt.cards[index + 1]!;
      const correct = (next.grossM > current.grossM) === saidMore;
      setRevealed(true);
      setLocked(true);

      // Survival: the first mistake ends the run. Pre-cutover dates keep the
      // old fixed 10-round accuracy rules so submitted scores stay valid.
      if (!correct && survival) {
        setMissed(true);
        timer.current = window.setTimeout(() => finish(streak, startedAt), 900);
        return;
      }

      const nextStreak = correct ? streak + 1 : streak;
      setStreak(nextStreak);

      // Deliberately snappy: the run should never feel gated by animation.
      timer.current = window.setTimeout(() => {
        setRevealed(false);
        setLocked(false);
        if (index + 1 >= pathLength) {
          finish(nextStreak, startedAt);
        } else {
          setIndex(index + 1);
          saveProgress<Progress>(UPDOWN_GAME_ID, date, {
            index: index + 1,
            streak: nextStreak,
            startedAt,
            done: false,
          });
        }
      }, 380);
    },
    [prompt, locked, startedAt, index, streak, finish, date, pathLength, survival],
  );

  const start = useCallback(() => {
    const now = Date.now();
    setStartedAt(now);
    setIndex(0);
    setStreak(0);
    setMissed(false);
    setPhase("playing");
    saveProgress<Progress>(UPDOWN_GAME_ID, date, {
      index: 0,
      streak: 0,
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
          The daily path could not be built. Refresh in a moment.
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

  const dayStreak = stats ? currentStreak(stats, date) : 0;

  if (phase === "done" && result) {
    const distance = result.score ?? 0;
    const finishedPath = distance >= (result.total ?? pathLength);
    const shareText = [
      `${SITE.name.toUpperCase()} UP & DOWN #${result.number} — ${distance} straight · ${formatSeconds(result.timeMs)}`,
      ...(finishedPath ? ["🏁 Full path cleared"] : []),
      ...(dayStreak > 0 ? [`🔥 ${dayStreak} day streak`] : []),
    ].join("\n");

    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-8 sm:py-14">
        <ResultSurface className="text-center" label="Daily Up and Down result">
          <DailyHeader label={`Daily Up & Down #${result.number}`} date={date} accent="gold" />
          <h1 className="mt-8 font-display text-[clamp(2rem,7vw,3.2rem)] leading-none tracking-[0.06em] text-foreground">
            {distance} STRAIGHT
          </h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground tabular-nums">
            {formatSeconds(result.timeMs)}
          </p>

          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat label="Distance" value={`${distance}`} accent />
            <Stat label="Time" value={formatSeconds(result.timeMs)} />
            <Stat label="Streak" value={String(dayStreak)} />
          </div>

          <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Distance first · time only breaks ties
          </p>

          <ShareButton
            text={shareText}
            url="/daily/up-down"
            accent="gold"
            className="mt-8 w-full sm:w-auto"
          />

          <DailyRank
            game="updown"
            date={date}
            number={result.number}
            score={distance}
            timeMs={result.timeMs}
            meta={{ total: result.total ?? pathLength }}
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
          HOW FAR CAN YOU GO?
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {survival
            ? `Did the next film make MORE or LESS worldwide? One mistake ends your run. The same ${UPDOWN_PATH_LENGTH}-movie path for everyone today.`
            : "Ten films, one after another. Did the next film make MORE or LESS worldwide than the one on screen?"}
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

        <div className="mt-6 flex items-baseline justify-between">
          <p className="font-display text-2xl tracking-[0.08em] text-foreground tabular-nums">
            {streak} <span className="text-[11px] tracking-[0.24em] text-muted-foreground">STRAIGHT</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            One mistake ends it
          </p>
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
                revealed
                  ? `${missed ? "text-foreground" : "text-gold"} opacity-100`
                  : "select-none text-transparent opacity-0"
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
          {missed ? "Run over" : "Worldwide theatrical gross · distance beats speed"}
        </p>

        <DailyFooterLinks />
      </div>
    </div>
  );
}
