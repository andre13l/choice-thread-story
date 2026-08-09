import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
  advanceTime,
  applyOutcome,
  characterFlavor,
  checkEnd,
  createCareer,
  pickEvent,
  resolveOption,
} from "@/game/engine";
import { hollywoodEvents } from "@/game/events";
import {
  careerArchetype,
  computePercentile,
  computeScore,
  formatMoney,
  formatMoneyFull,
  formatPercentile,
  shareText,
} from "@/game/scoring";
import {
  loadCount,
  loadCurrentCareer,
  recordCareer,
  saveCurrentCareer,
} from "@/game/storage";
import type { CareerSummary, GameEvent, GameState, Outcome } from "@/game/types";

export const Route = createFileRoute("/hollywood")({
  head: () => ({
    meta: [
      { title: "HOLLYWOOD — PATHS" },
      {
        name: "description",
        content:
          "Everyone comes to Hollywood wanting to make it. A short, replayable career simulation where every choice changes your path. How far can you make it?",
      },
      { property: "og:title", content: "HOLLYWOOD — PATHS" },
      {
        property: "og:description",
        content: "Everyone comes here wanting to make it. Let's see what happens to you.",
      },
    ],
  }),
  component: HollywoodPage,
});

/* ------------------------------------------------------------------ */

type Phase = "intro" | "character" | "event" | "reveal" | "ending" | "legend";

interface OutcomeView {
  text: string;
  note?: string;
  lines: { label: string; negative: boolean }[];
  end?: "career" | "legend";
}

interface UiState {
  phase: Phase;
  game: GameState | null;
  event: GameEvent | null;
  outcome: OutcomeView | null;
  summary: CareerSummary | null;
}

type Action =
  | { type: "begin" }
  | { type: "resume"; game: GameState; event: GameEvent | null }
  | { type: "character_ok" }
  | { type: "choose"; index: number }
  | { type: "continue" }
  | { type: "restart" };

const rng = Math.random;

const VISIBLE_STATS = ["fame", "connections", "reputation", "oscars", "awards"] as const;
const STAT_LABELS: Record<(typeof VISIBLE_STATS)[number], string> = {
  fame: "Fame",
  connections: "Connections",
  reputation: "Reputation",
  oscars: "Oscar",
  awards: "Award",
};

function buildOutcomeView(outcome: Outcome, game: GameState): OutcomeView {
  const lines: { label: string; negative: boolean }[] = [];
  let moneyDelta = outcome.money ?? 0;
  if (outcome.moneyPct) moneyDelta += Math.round(game.stats.money * outcome.moneyPct);
  if (moneyDelta !== 0) {
    lines.push({
      label: `${moneyDelta > 0 ? "+" : ""}${formatMoneyFull(moneyDelta)}`,
      negative: moneyDelta < 0,
    });
  }
  if (outcome.effects) {
    for (const key of VISIBLE_STATS) {
      const v = outcome.effects[key];
      if (v) {
        const label = STAT_LABELS[key];
        lines.push({
          label: `${v > 0 ? "+" : ""}${v} ${v !== 1 && v !== -1 && (key === "oscars" || key === "awards") ? `${label}s` : label}`,
          negative: v < 0,
        });
      }
    }
  }
  return { text: outcome.text, note: outcome.note, lines, end: outcome.end };
}

function finalizeCareer(game: GameState, legend: boolean): CareerSummary {
  const score = computeScore(game.stats);
  const percentile = computePercentile(score);
  return {
    careerId: game.careerId,
    date: new Date().toISOString(),
    score,
    percentile,
    archetype: legend ? "LEGEND" : careerArchetype(game),
    legend,
    age: game.stats.age,
    movies: game.stats.movies,
    leadingRoles: game.stats.leadingRoles,
    oscars: game.stats.oscars,
    awards: game.stats.awards,
    careerEarnings: game.stats.careerEarnings,
    peakMoney: game.stats.peakMoney,
    finalMoney: game.stats.money,
    peakFame: game.stats.peakFame,
  };
}

function reducer(state: UiState, action: Action): UiState {
  switch (action.type) {
    case "begin": {
      const game = createCareer(Date.now() % 2147483647);
      return { phase: "character", game, event: null, outcome: null, summary: null };
    }
    case "resume":
      return {
        phase: action.event ? "event" : "intro",
        game: action.game,
        event: action.event,
        outcome: null,
        summary: null,
      };
    case "character_ok": {
      if (!state.game) return state;
      const event = pickEvent(state.game, hollywoodEvents, rng);
      if (!event) return state;
      const game = {
        ...state.game,
        recentEventIds: [...state.game.recentEventIds, event.id].slice(-4),
        queuedEventId: null,
      };
      saveCurrentCareer({ game, eventId: event.id });
      return { ...state, phase: "event", game, event };
    }
    case "choose": {
      if (!state.game || !state.event) return state;
      const option = state.event.options[action.index];
      if (!option) return state;
      const choice = resolveOption(state.game, option, rng, state.event.id);
      let game = applyOutcome(state.game, state.event, choice);
      if (state.event.id === "legend_gamble" && !choice.success) {
        game = { ...game, legendFailed: true };
      }
      const outcome = buildOutcomeView(choice.outcome, state.game);
      return { ...state, phase: "reveal", game, outcome };
    }
    case "continue": {
      if (!state.game) return state;
      if (state.outcome?.end === "legend") {
        const summary = finalizeCareer(state.game, true);
        recordCareer(summary);
        return { ...state, phase: "legend", summary };
      }
      if (state.outcome?.end === "career" || checkEnd(state.game, rng) === "career") {
        const summary = finalizeCareer(state.game, false);
        recordCareer(summary);
        return { ...state, phase: "ending", summary };
      }
      let game = advanceTime(state.game, rng);
      const event = pickEvent(game, hollywoodEvents, rng);
      if (!event) {
        const summary = finalizeCareer(game, false);
        recordCareer(summary);
        return { ...state, phase: "ending", game, summary };
      }
      game = {
        ...game,
        recentEventIds: [...game.recentEventIds, event.id].slice(-4),
        queuedEventId: null,
      };
      saveCurrentCareer({ game, eventId: event.id });
      return { ...state, phase: "event", game, event, outcome: null };
    }
    case "restart":
      saveCurrentCareer(null);
      return { phase: "intro", game: null, event: null, outcome: null, summary: null };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */

function HollywoodPage() {
  const [state, dispatch] = useReducer(reducer, {
    phase: "intro",
    game: null,
    event: null,
    outcome: null,
    summary: null,
  });

  // Resume an interrupted path (decision points only).
  useEffect(() => {
    const saved = loadCurrentCareer();
    if (saved) {
      const event = saved.eventId
        ? (hollywoodEvents.find((e) => e.id === saved.eventId) ?? null)
        : null;
      dispatch({ type: "resume", game: saved.game, event });
    }
  }, []);

  return (
    <main className="min-h-screen">
      {state.phase === "intro" && <Intro onBegin={() => dispatch({ type: "begin" })} />}
      {state.phase === "character" && state.game && (
        <CharacterIntro game={state.game} onContinue={() => dispatch({ type: "character_ok" })} />
      )}
      {state.phase === "event" && state.game && state.event && (
        <EventScreen
          key={state.game.turn}
          game={state.game}
          event={state.event}
          onChoose={(index) => dispatch({ type: "choose", index })}
        />
      )}
      {state.phase === "reveal" && state.game && state.outcome && (
        <RevealScreen
          game={state.game}
          outcome={state.outcome}
          onContinue={() => dispatch({ type: "continue" })}
        />
      )}
      {state.phase === "ending" && state.summary && (
        <EndingScreen summary={state.summary} onRestart={() => dispatch({ type: "restart" })} />
      )}
      {state.phase === "legend" && state.summary && (
        <LegendSequence summary={state.summary} onRestart={() => dispatch({ type: "restart" })} />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Intro                                                               */
/* ------------------------------------------------------------------ */

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="anim-fade-up flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        Paths
      </p>
      <h1 className="mt-6 font-serif text-[clamp(3.5rem,12vw,7rem)] leading-none tracking-[0.08em] text-foreground">
        HOLLYWOOD
      </h1>
      <p className="mt-8 max-w-sm text-base leading-relaxed text-muted-foreground">
        Everyone comes here wanting to make it.
        <br />
        Let's see what happens to you.
      </p>
      <button
        onClick={onBegin}
        className="mt-14 border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
      >
        Begin
      </button>
      <Link
        to="/"
        className="mt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Back to paths
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Character generation                                                */
/* ------------------------------------------------------------------ */

function CharacterIntro({ game, onContinue }: { game: GameState; onContinue: () => void }) {
  const s = game.stats;
  return (
    <div className="anim-fade-up flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Los Angeles
        </p>
        <h2 className="mt-6 font-serif text-6xl text-foreground">You are 18.</h2>
        <p className="mt-6 font-serif text-lg italic leading-relaxed text-muted-foreground">
          {characterFlavor(s)}
        </p>

        <div className="mt-10 grid grid-cols-3 divide-x divide-border border border-border bg-card">
          <div className="px-4 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Money
            </p>
            <p className="mt-2 font-serif text-xl text-foreground">{formatMoney(s.money)}</p>
          </div>
          <div className="px-4 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Fame
            </p>
            <p className="mt-2 font-serif text-xl text-foreground">{Math.round(s.fame)}</p>
          </div>
          <div className="px-4 py-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Connections
            </p>
            <p className="mt-2 font-serif text-xl text-foreground">{Math.round(s.connections)}</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="mt-12 border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
        >
          Step off the bus
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Persistent subtle header                                            */
/* ------------------------------------------------------------------ */

function StatHeader({ game }: { game: GameState }) {
  const s = game.stats;
  return (
    <div className="flex items-center justify-center gap-6 pt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
      <span>Age {s.age}</span>
      <span className="text-border">·</span>
      <span>{formatMoney(s.money)}</span>
      <span className="text-border">·</span>
      <span>Fame {Math.round(s.fame)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Event                                                               */
/* ------------------------------------------------------------------ */

function EventScreen({
  game,
  event,
  onChoose,
}: {
  game: GameState;
  event: GameEvent;
  onChoose: (index: number) => void;
}) {
  const text = typeof event.text === "function" ? event.text(game) : event.text;
  return (
    <div className="flex min-h-screen flex-col">
      <StatHeader game={game} />
      <div className="anim-fade-up flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {(event.place ?? "Los Angeles").toUpperCase()} — Age {game.stats.age}
          </p>
          <p className="mt-6 font-serif text-[clamp(1.35rem,3.2vw,1.75rem)] leading-snug text-foreground">
            {text}
          </p>

          <div className="mt-12 flex flex-col gap-3">
            {event.options.map((option, i) => (
              <button
                key={i}
                onClick={() => onChoose(i)}
                className="group flex items-baseline justify-between gap-6 border border-border bg-card px-6 py-4 text-left transition-all duration-200 hover:border-foreground"
              >
                <span className="text-[15px] font-medium text-foreground">{option.label}</span>
                {option.hint && (
                  <span
                    className={`shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] ${
                      option.danger ? "text-danger" : "text-muted-foreground"
                    }`}
                  >
                    {option.hint}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal                                                              */
/* ------------------------------------------------------------------ */

function RevealScreen({
  game,
  outcome,
  onContinue,
}: {
  game: GameState;
  outcome: OutcomeView;
  onContinue: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StatHeader game={game} />
      <div className="anim-fade-up flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl text-center">
          <p className="font-serif text-[clamp(1.35rem,3.2vw,1.75rem)] leading-snug text-foreground">
            {outcome.text}
          </p>
          {outcome.note && (
            <p className="mt-4 font-serif text-base italic text-muted-foreground">{outcome.note}</p>
          )}
          {outcome.lines.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {outcome.lines.map((line, i) => (
                <span
                  key={i}
                  className={`text-[12px] font-medium uppercase tracking-[0.18em] ${
                    line.negative ? "text-danger" : "text-muted-foreground"
                  }`}
                >
                  {line.label}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={onContinue}
            className="mt-12 border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ending                                                              */
/* ------------------------------------------------------------------ */

function EndingScreen({
  summary,
  onRestart,
}: {
  summary: CareerSummary;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const lived = useMemo(() => loadCount(), []);

  const rows: [string, string][] = [
    ["Movies", String(summary.movies)],
    ["Leading roles", String(summary.leadingRoles)],
    ["Oscars", String(summary.oscars)],
    ["Career earnings", formatMoneyFull(summary.careerEarnings)],
    ["Peak net worth", formatMoneyFull(summary.peakMoney)],
    ["Final net worth", formatMoneyFull(summary.finalMoney)],
    ["Peak fame", String(Math.round(summary.peakFame))],
  ];

  const onShare = async () => {
    const text = shareText({
      score: summary.score,
      percentile: summary.percentile,
      movies: summary.movies,
      oscars: summary.oscars,
      peakMoney: summary.peakMoney,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="anim-fade-up flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Your path
        </p>
        <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-muted-foreground">
          Age {summary.age}
        </p>
        <h2 className="mt-3 font-serif text-[clamp(2.5rem,8vw,3.5rem)] leading-tight text-foreground">
          {summary.archetype}
        </h2>

        <div className="mt-10 divide-y divide-border border border-border bg-card text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between px-5 py-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </span>
              <span className="font-serif text-lg text-foreground">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Career score
          </p>
          <p className="mt-2 font-serif text-[clamp(3rem,10vw,4.5rem)] leading-none text-foreground">
            {summary.score.toLocaleString("en-US")}
          </p>
          <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {formatPercentile(summary.percentile)}
          </p>
          {lived > 1 && (
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {lived} paths lived
            </p>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={onRestart}
            className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
          >
            Live another path
          </button>
          <button
            onClick={onShare}
            className="border border-border px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:border-foreground"
          >
            {copied ? "Copied" : "Share"}
          </button>
          <Link
            to="/"
            className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            All paths
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The hidden sequence. No labels, no explanation — just the moment.   */
/* ------------------------------------------------------------------ */

const LEGEND_STEPS = [
  { text: "Wait.", duration: 2200, final: false },
  { text: "This path isn't over.", duration: 2600, final: false },
  { text: "You've done something almost nobody ever does.", duration: 3200, final: false },
] as const;

function LegendSequence({
  summary,
  onRestart,
}: {
  summary: CareerSummary;
  onRestart: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= LEGEND_STEPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), LEGEND_STEPS[step]!.duration);
    return () => clearTimeout(t);
  }, [step]);

  const finale = step >= LEGEND_STEPS.length;

  return (
    <div className="legend-screen fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center">
      {!finale && (
        <p key={step} className="anim-legend-text font-serif text-2xl tracking-wide md:text-3xl">
          {LEGEND_STEPS[step]!.text}
        </p>
      )}
      {finale && (
        <div className="anim-fade-in flex flex-col items-center">
          <h1 className="font-serif text-[clamp(5rem,18vw,11rem)] leading-none tracking-[0.12em]">
            LEGEND
          </h1>
          <p className="mt-8 font-serif text-xl italic opacity-80">You made it.</p>
          <p className="mt-10 text-[11px] uppercase tracking-[0.3em] opacity-50">
            Career score — {summary.score.toLocaleString("en-US")}
          </p>
          <button
            onClick={onRestart}
            className="mt-14 border border-current px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] opacity-80 transition-opacity duration-300 hover:opacity-100"
          >
            Live another path
          </button>
        </div>
      )}
    </div>
  );
}
