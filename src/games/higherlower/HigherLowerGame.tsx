import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createRng } from "@/games/core/rng";
import { SITE } from "@/config/site";
import {
  ALL_METRICS,
  answer,
  formatMetricValue,
  metricLabel,
  startRun,
  type Guess,
  type Metric,
  type RunState,
} from "./engine";
import { loadBest, recordRound, saveBestIfHigher } from "./storage";

type Phase = "select" | "playing" | "reveal" | "gameover";

interface GameState {
  phase: Phase;
  metric: Metric;
  run: RunState | null;
  revealGuess: Guess | null;
  best: number;
  rngSeed: number;
}

type Action =
  | { type: "select_mode"; metric: Metric }
  | { type: "guess"; guess: Guess }
  | { type: "settle" }
  | { type: "restart_same" }
  | { type: "change_mode" };

function makeRng(seed: number) {
  return createRng(seed);
}

function init(): GameState {
  return { phase: "select", metric: "boxOffice", run: null, revealGuess: null, best: 0, rngSeed: Date.now() };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "select_mode": {
      const seed = Date.now() ^ Math.floor(Math.random() * 1e9);
      const rng = makeRng(seed);
      const run = startRun(action.metric, rng);
      return {
        phase: "playing",
        metric: action.metric,
        run,
        revealGuess: null,
        best: loadBest(action.metric),
        rngSeed: seed,
      };
    }
    case "guess": {
      if (!state.run || state.phase !== "playing") return state;
      return { ...state, phase: "reveal", revealGuess: action.guess };
    }
    case "settle": {
      if (!state.run || !state.revealGuess) return state;
      const rng = makeRng(state.rngSeed + state.run.streak + 1);
      const nextRun = answer(state.run, state.revealGuess, rng);
      recordRound();
      if (nextRun.gameOver) {
        const best = saveBestIfHigher(state.metric, nextRun.streak);
        return { ...state, run: nextRun, phase: "gameover", best, revealGuess: null };
      }
      return { ...state, run: nextRun, phase: "playing", revealGuess: null, rngSeed: state.rngSeed + 1 };
    }
    case "restart_same": {
      const seed = Date.now() ^ Math.floor(Math.random() * 1e9);
      const rng = makeRng(seed);
      const run = startRun(state.metric, rng);
      return { ...state, run, phase: "playing", revealGuess: null, rngSeed: seed };
    }
    case "change_mode":
      return { ...init(), best: state.best };
    default:
      return state;
  }
}

export function HigherLowerGame() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  const handleGuess = useCallback(
    (guess: Guess) => {
      dispatch({ type: "guess", guess });
    },
    [],
  );

  useEffect(() => {
    if (state.phase !== "reveal") return;
    const timer = window.setTimeout(() => dispatch({ type: "settle" }), 800);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (state.phase === "playing") {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          handleGuess("higher");
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          handleGuess("lower");
        }
      } else if (state.phase === "gameover" && e.key === "Enter") {
        e.preventDefault();
        dispatch({ type: "restart_same" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, handleGuess]);

  if (state.phase === "select") {
    return <ModeSelect onSelect={(metric) => dispatch({ type: "select_mode", metric })} />;
  }

  if (!state.run) return null;

  if (state.phase === "gameover") {
    return (
      <GameOver
        metric={state.metric}
        streak={state.run.streak}
        best={state.best}
        onPlayAgain={() => dispatch({ type: "restart_same" })}
        onChangeMode={() => dispatch({ type: "change_mode" })}
      />
    );
  }

  return (
    <PlayScreen
      metric={state.metric}
      run={state.run}
      revealing={state.phase === "reveal"}
      revealGuess={state.revealGuess}
      onGuess={handleGuess}
    />
  );
}

function ModeSelect({ onSelect }: { onSelect: (metric: Metric) => void }) {
  // Personal bests live in localStorage, so they can only be read after
  // hydration — reading during render makes SSR and client markup disagree.
  const [bests, setBests] = useState<Map<Metric, number>>(() => new Map());
  useEffect(() => {
    const map = new Map<Metric, number>();
    for (const m of ALL_METRICS) map.set(m, loadBest(m));
    setBests(map);
  }, []);

  const cardMeta: Record<Metric, { title: string; hint: string }> = {
    boxOffice: { title: "Box office", hint: "Worldwide gross" },
    budget: { title: "Budget", hint: "Production budget" },
    runtime: { title: "Runtime", hint: "Minutes on screen" },
    year: { title: "Year", hint: "Release year" },
  };

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        {SITE.name}
      </p>
      <div className="mt-8 h-px w-16 bg-gold/70" />
      <h1 className="mt-6 font-display text-[clamp(2.5rem,10vw,5rem)] leading-none tracking-[0.05em] text-foreground">
        HIGHER / LOWER
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
        How well do you know the movies? Guess whether the next film is higher or lower — build a streak.
      </p>

      <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {ALL_METRICS.map((metric) => {
          const isDefault = metric === "boxOffice";
          const best = bests.get(metric) ?? 0;
          return (
            <button
              key={metric}
              onClick={() => onSelect(metric)}
              className={`group flex flex-col items-start border p-5 text-left transition-all duration-200 ${
                isDefault
                  ? "border-gold/40 bg-card/50 backdrop-blur-sm"
                  : "border-border/80 bg-card/50 backdrop-blur-sm hover:border-foreground/50"
              }`}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                {metricLabel(metric)}
              </p>
              <h2 className="mt-2 font-display text-2xl text-foreground">{cardMeta[metric].title}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{cardMeta[metric].hint}</p>
              <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>Best</span>
                <span className={best > 0 ? "font-display text-base text-gold" : "font-display text-base text-foreground/60"}>
                  {best > 0 ? best : "—"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Link
        to="/"
        className="mt-14 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        All games
      </Link>
    </div>
  );
}

function FilmCard({
  title,
  metric,
  valueLabel,
  reveal,
  danger,
  align,
}: {
  title: string;
  metric: Metric;
  valueLabel: string | null;
  reveal: boolean;
  danger: boolean;
  align: "known" | "next";
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center border border-border/80 bg-card/50 px-4 py-8 text-center backdrop-blur-sm sm:px-6 sm:py-10 ${
        align === "next" ? "anim-fade-in" : ""
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
        {align === "known" ? "Known" : "Next"}
      </p>
      <h2 className="mt-3 font-display text-lg leading-snug text-foreground sm:text-xl">{title}</h2>
      <div className="mt-6 flex h-12 items-center justify-center">
        {valueLabel !== null ? (
          <span
            className={`font-display text-[clamp(1.75rem,5vw,2.5rem)] leading-none ${
              danger ? "text-danger" : reveal ? "text-gold" : "text-foreground"
            }`}
          >
            {valueLabel}
          </span>
        ) : (
          <span className="font-display text-[clamp(1.75rem,5vw,2.5rem)] leading-none text-muted-foreground/40">
            ?
          </span>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{metricLabel(metric)}</p>
    </div>
  );
}

function PlayScreen({
  metric,
  run,
  revealing,
  revealGuess,
  onGuess,
}: {
  metric: Metric;
  run: RunState;
  revealing: boolean;
  revealGuess: Guess | null;
  onGuess: (guess: Guess) => void;
}) {
  const knownValue = formatMetricValue(metric, run.known);
  const nextValue = formatMetricValue(metric, run.next);
  const wrong = revealing && run.lastResult === null; // reveal before settle never sets lastResult yet
  const knownVal = run.known;
  const nextVal = run.next;
  const willBeCorrect = (() => {
    if (!revealGuess) return null;
    const actuallyHigher =
      metricValueOf(nextVal, metric) > metricValueOf(knownVal, metric);
    return revealGuess === "higher" ? actuallyHigher : !actuallyHigher;
  })();

  return (
    <div className="stage flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-14">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <Link
          to="/"
          className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          All games
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Streak
          </span>
          <span className="font-display text-2xl text-gold">{run.streak}</span>
        </div>
      </div>

      <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        {metricLabel(metric)}
      </p>

      <div className="mt-6 flex w-full max-w-3xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <FilmCard
          title={run.known.title}
          metric={metric}
          valueLabel={knownValue}
          reveal={false}
          danger={false}
          align="known"
        />
        <div className="flex shrink-0 items-center justify-center py-2 sm:py-0">
          <span className="font-display text-sm tracking-[0.3em] text-muted-foreground">VS</span>
        </div>
        <FilmCard
          key={run.next.id}
          title={run.next.title}
          metric={metric}
          valueLabel={revealing ? nextValue : null}
          reveal={revealing && willBeCorrect === true}
          danger={revealing && willBeCorrect === false}
          align="next"
        />
      </div>

      <div className="mt-10 flex w-full max-w-md gap-3">
        <button
          disabled={revealing}
          onClick={() => onGuess("higher")}
          className="flex flex-1 flex-col items-center gap-2 border border-foreground bg-foreground py-5 text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[12px] font-medium uppercase tracking-[0.3em]">Higher</span>
        </button>
        <button
          disabled={revealing}
          onClick={() => onGuess("lower")}
          className="flex flex-1 flex-col items-center gap-2 border border-foreground bg-foreground py-5 text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowDown className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[12px] font-medium uppercase tracking-[0.3em]">Lower</span>
        </button>
      </div>
      {wrong && null}
    </div>
  );
}

function metricValueOf(movie: RunState["known"], metric: Metric): number {
  switch (metric) {
    case "boxOffice":
      return movie.boxOfficeM;
    case "budget":
      return movie.budgetM;
    case "runtime":
      return movie.runtimeMin;
    case "year":
      return movie.year;
  }
}

function GameOver({
  metric,
  streak,
  best,
  onPlayAgain,
  onChangeMode,
}: {
  metric: Metric;
  streak: number;
  best: number;
  onPlayAgain: () => void;
  onChangeMode: () => void;
}) {
  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-danger">Wrong guess</p>
      <div className="mt-8 h-px w-16 bg-danger/50" />
      <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        Final streak
      </p>
      <h1 className="mt-3 font-display text-[clamp(4rem,16vw,7rem)] leading-none text-foreground">
        <span className="sr-only">Game over — final streak: </span>
        {streak}
      </h1>
      <p className="mt-6 text-[13px] uppercase tracking-[0.2em] text-muted-foreground">
        Personal best · {metricLabel(metric)}
      </p>
      <p className="mt-1 font-display text-2xl text-gold">{Math.max(best, streak)}</p>
      <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
        Global leaderboards — soon
      </p>

      <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
        <button
          onClick={onPlayAgain}
          className="flex items-center gap-2 border border-foreground bg-foreground px-10 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Play again
        </button>
        <button
          onClick={onChangeMode}
          className="border border-border/80 px-10 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-muted-foreground transition-colors duration-300 hover:border-foreground/50 hover:text-foreground"
        >
          Change mode
        </button>
      </div>

      <Link
        to="/"
        className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        All games
      </Link>
    </div>
  );
}
