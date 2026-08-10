/**
 * HOLLYWOOD — game-loop state machine.
 *
 * Ordinary events resolve through the QUICK CHOICE compatibility path
 * (choose -> resolveOption -> applyOutcome). Events with a `sequence`
 * drive a multi-step interaction context instead; finishing the last
 * step calls the sequence's resolver and lands on the same reveal
 * screen as any other outcome.
 */

import { useEffect, useReducer } from "react";
import {
  advanceTime,
  applyOutcome,
  checkEnd,
  createCareer,
  pickEvent,
  resolveOption,
} from "./engine";
import { hollywoodEvents } from "./content";
import {
  careerArchetype,
  computePercentile,
  computeScore,
  formatMoneyFull,
} from "./scoring";
import {
  loadCurrentCareer,
  recordCareer,
  saveCurrentCareer,
} from "./storage";
import type {
  CareerSummary,
  EventOption,
  GameEvent,
  GameState,
  Outcome,
  PickItem,
  SequenceContext,
} from "./types";

export type Phase = "intro" | "character" | "event" | "reveal" | "ending" | "legend";

export interface OutcomeView {
  text: string;
  note?: string | undefined;
  lines: { label: string; negative: boolean }[];
  end?: "career" | "legend" | undefined;
}

export interface SeqState {
  stepIndex: number;
  ctx: SequenceContext;
}

interface UiState {
  phase: Phase;
  game: GameState | null;
  event: GameEvent | null;
  outcome: OutcomeView | null;
  summary: CareerSummary | null;
  seq: SeqState | null;
}

type Action =
  | { type: "begin" }
  | { type: "resume"; game: GameState; event: GameEvent | null }
  | { type: "character_ok" }
  | { type: "choose"; index: number }
  | { type: "seq_pick"; item: PickItem }
  | { type: "seq_alloc"; values: Record<string, number> }
  | { type: "continue" }
  | { type: "restart" };

// NOTE: seeded deterministic runs (for server-side verification later)
// replace this in milestone M3. Kept as-is for M1 behavior parity.
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

function freshSeqCtx(game: GameState): SequenceContext {
  return { game, rng, picks: {}, pickItems: {}, allocations: {} };
}

function freshSeq(game: GameState, event: GameEvent | null): SeqState | null {
  return event?.sequence ? { stepIndex: 0, ctx: freshSeqCtx(game) } : null;
}

/** Final sequence step completed: resolve the chain into an outcome. */
function finishSequence(state: UiState, ctx: SequenceContext): UiState {
  const event = state.event;
  const game = state.game;
  if (!event?.sequence || !game) return state;
  const result = event.sequence.resolve(ctx);
  const synthetic: EventOption = {
    label: `Made “${result.film?.title ?? "a film"}”`,
    outcomes: [result.outcome],
  };
  const choice = { option: synthetic, outcome: result.outcome, success: true };
  let nextGame = applyOutcome(game, event, choice);
  if (result.film) {
    nextGame = { ...nextGame, films: [...(nextGame.films ?? []), result.film] };
  }
  const outcome = buildOutcomeView(result.outcome, game);
  return { ...state, phase: "reveal", game: nextGame, outcome, seq: null };
}

function reducer(state: UiState, action: Action): UiState {
  switch (action.type) {
    case "begin": {
      const game = createCareer(Date.now() % 2147483647);
      return { phase: "character", game, event: null, outcome: null, summary: null, seq: null };
    }
    case "resume":
      return {
        phase: action.event ? "event" : "intro",
        game: action.game,
        event: action.event,
        outcome: null,
        summary: null,
        seq: freshSeq(action.game, action.event),
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
      return { ...state, phase: "event", game, event, seq: freshSeq(game, event) };
    }
    case "choose": {
      if (!state.game || !state.event || state.event.sequence) return state;
      const option = state.event.options?.[action.index];
      if (!option) return state;
      const choice = resolveOption(state.game, option, rng, state.event.id);
      let game = applyOutcome(state.game, state.event, choice);
      if (state.event.id === "legend_gamble" && !choice.success) {
        game = { ...game, legendFailed: true };
      }
      const outcome = buildOutcomeView(choice.outcome, state.game);
      return { ...state, phase: "reveal", game, outcome };
    }
    case "seq_pick": {
      const sequence = state.event?.sequence;
      if (!state.seq || !sequence) return state;
      const step = sequence.steps[state.seq.stepIndex];
      if (!step || step.kind !== "pick") return state;
      const ctx: SequenceContext = {
        ...state.seq.ctx,
        picks: { ...state.seq.ctx.picks, [step.id]: action.item.id },
        pickItems: { ...state.seq.ctx.pickItems, [step.id]: action.item },
      };
      const nextIndex = state.seq.stepIndex + 1;
      if (nextIndex >= sequence.steps.length) return finishSequence(state, ctx);
      return { ...state, seq: { stepIndex: nextIndex, ctx } };
    }
    case "seq_alloc": {
      const sequence = state.event?.sequence;
      if (!state.seq || !sequence) return state;
      const step = sequence.steps[state.seq.stepIndex];
      if (!step || step.kind !== "allocation") return state;
      const ctx: SequenceContext = {
        ...state.seq.ctx,
        allocations: { ...state.seq.ctx.allocations, [step.id]: action.values },
      };
      const nextIndex = state.seq.stepIndex + 1;
      if (nextIndex >= sequence.steps.length) return finishSequence(state, ctx);
      return { ...state, seq: { stepIndex: nextIndex, ctx } };
    }
    case "continue": {
      if (!state.game) return state;
      if (state.outcome?.end === "legend") {
        const summary = finalizeCareer(state.game, true);
        recordCareer(summary);
        return { ...state, phase: "legend", summary, seq: null };
      }
      if (state.outcome?.end === "career" || checkEnd(state.game, rng) === "career") {
        const summary = finalizeCareer(state.game, false);
        recordCareer(summary);
        return { ...state, phase: "ending", summary, seq: null };
      }
      let game = advanceTime(state.game, rng);
      const event = pickEvent(game, hollywoodEvents, rng);
      if (!event) {
        const summary = finalizeCareer(game, false);
        recordCareer(summary);
        return { ...state, phase: "ending", game, summary, seq: null };
      }
      game = {
        ...game,
        recentEventIds: [...game.recentEventIds, event.id].slice(-4),
        queuedEventId: null,
      };
      saveCurrentCareer({ game, eventId: event.id });
      return { ...state, phase: "event", game, event, outcome: null, seq: freshSeq(game, event) };
    }
    case "restart":
      saveCurrentCareer(null);
      return { phase: "intro", game: null, event: null, outcome: null, summary: null, seq: null };
    default:
      return state;
  }
}

export function useHollywoodGame() {
  const [state, dispatch] = useReducer(reducer, {
    phase: "intro",
    game: null,
    event: null,
    outcome: null,
    summary: null,
    seq: null,
  });

  // Resume an interrupted path (decision points only; an interrupted
  // sequence restarts from its first step).
  useEffect(() => {
    const saved = loadCurrentCareer();
    if (saved) {
      const event = saved.eventId
        ? (hollywoodEvents.find((e) => e.id === saved.eventId) ?? null)
        : null;
      dispatch({ type: "resume", game: saved.game, event });
    }
  }, []);

  return { state, dispatch };
}
