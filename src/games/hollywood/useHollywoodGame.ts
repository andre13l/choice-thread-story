/**
 * HOLLYWOOD — game-loop state machine.
 *
 * The reducer mirrors the original route implementation exactly; it was
 * lifted out of src/routes/hollywood.tsx during the multi-game reorg so
 * the route file is thin wiring and screens are separate components.
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
import { computePercentile, computeScore, formatMoneyFull } from "./scoring";
import {
  loadCurrentCareer,
  recordCareer,
  saveCurrentCareer,
} from "./storage";
import type { CareerSummary, GameEvent, GameState, Outcome } from "./types";

export type Phase = "intro" | "character" | "event" | "reveal" | "ending" | "legend";

export interface OutcomeView {
  text: string;
  note?: string | undefined;
  lines: { label: string; negative: boolean }[];
  end?: "career" | "legend" | undefined;
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
    archetype: legend ? "LEGEND" : careerArchetypeFor(game),
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

// Local re-export keeps the reducer readable; behavior unchanged.
import { careerArchetype as careerArchetypeFor } from "./scoring";

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

export function useHollywoodGame() {
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

  return { state, dispatch };
}
