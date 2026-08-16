/**
 * The director loop.
 *
 * OFFERS -> CASTING -> BUDGET -> PREMIERE -> (AWARDS) -> OFFERS.
 * Everything for a cycle is resolved the moment the budget is locked;
 * the premiere screens only reveal what already happened.
 *
 * TRANSITION SAFETY
 * The run is a state machine, not browser history, and it only ever moves
 * forward. Two rules enforce that:
 *
 *  1. Every action declares the phases it is legal in. A late timer, a
 *     duplicated click or a callback fired by an already-unmounted screen
 *     is dropped instead of dragging the run back to an earlier screen.
 *  2. The whole in-flight turn is persisted (not just the career), so a
 *     remount or reload restores the exact screen the player was on
 *     instead of restarting the cycle at the offers board.
 *
 * The reducer is pure: persistence and history recording happen in effects,
 * which also makes it safe under React's double-invocation in development.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { createRng } from "../../core/rng";
import {
  applyAwards,
  applyFilm,
  applyPass,
  applyEventChoice,
  checkLegend,
  endCareer,
  endingChance,
  newCareer,
  runAwards,
  snapshot,
  type AwardsRun,
  type CycleEffects,
  type EventOutcome,
} from "./career";
import { CAREER_EVENTS, pickEvent, type CareerEvent, type EventChoice } from "./events";
import { computePressure, eventChance } from "./pressure";
import { generateCast } from "./casting";
import { presetCareer, type PresetId } from "./dev";
import { hashString } from "./names";
import type { TimeJump } from "./pacing";
import { generateOffers } from "./offers";
import { resolveFilm } from "./resolve";
import { clearRun, loadCareer, loadRun, recordCareer, saveCareer, saveRun, type SavedRun } from "./storage";
import type { Actor, Allocation, CareerSnapshot, DirectorCareer, FilmResult, Project } from "./types";

export type Phase =
  | "intro"
  | "offers"
  | "casting"
  | "budget"
  | "premiere"
  | "awards"
  | "transition"
  | "event"
  | "ending"
  | "legend";

interface Pending {
  film: FilmResult;
  effects: CycleEffects;
  awards: AwardsRun | null;
  careerAfter: DirectorCareer;
  jump: TimeJump | null;
}

export interface State {
  ready: boolean;
  phase: Phase;
  career: DirectorCareer;
  offers: Project[];
  project: Project | null;
  pool: Actor[];
  cast: Actor[];
  pending: Pending | null;
  snapshot: CareerSnapshot | null;
  resumed: boolean;
  jump: TimeJump | null;
  /** A career event waiting between films. */
  event: CareerEvent | null;
  /** Resolution of the chosen branch, shown before returning to offers. */
  eventOutcome: EventOutcome | null;
}

export type Action =
  | { type: "hydrate"; career: DirectorCareer | null; run: SavedRun | null }
  | { type: "begin" }
  | { type: "select_project"; project: Project }
  | { type: "pass" }
  | { type: "back_to_offers" }
  | { type: "confirm_cast"; cast: Actor[] }
  | { type: "confirm_budget"; alloc: Allocation }
  | { type: "premiere_done" }
  | { type: "awards_done" }
  | { type: "transition_done" }
  | { type: "choose_event"; choice: EventChoice }
  | { type: "event_done" }
  | { type: "restart" }
  | { type: "dev_preset"; preset: PresetId }
  | { type: "dev_end" }
  | { type: "dev_legend" };

/**
 * Which phases each action may act from. Anything arriving out of phase is
 * stale — a timer from a screen the player already left, a double click, a
 * promise resolving after the run moved on — and is ignored.
 */
const LEGAL: Record<Action["type"], Phase[] | "any"> = {
  hydrate: "any",
  begin: ["intro"],
  // Budget's Back re-enters casting through select_project.
  select_project: ["offers", "casting", "budget"],
  pass: ["offers"],
  back_to_offers: ["casting"],
  confirm_cast: ["casting"],
  confirm_budget: ["budget"],
  premiere_done: ["premiere"],
  awards_done: ["awards"],
  transition_done: ["transition"],
  choose_event: ["event"],
  event_done: ["event"],
  restart: "any",
  dev_preset: "any",
  dev_end: "any",
  dev_legend: "any",
};

function freshId(): number {
  return Math.floor(Math.random() * 2_000_000_000);
}

function startCycle(career: DirectorCareer): State {
  return {
    ready: true,
    phase: "offers",
    career,
    offers: generateOffers(career),
    project: null,
    pool: [],
    cast: [],
    pending: null,
    snapshot: null,
    resumed: false,
    jump: null,
    event: null,
    eventOutcome: null,
  };
}

/**
 * Between films: decide whether a career event interrupts before the next
 * slate of offers. Pure — persistence happens in an effect.
 */
function afterCycle(career: DirectorCareer, jump: TimeJump | null): State {
  const r = createRng((career.seed ^ hashString(`event:${career.cycle}`)) >>> 0);
  const event = r() < eventChance(career) ? pickEvent(career, computePressure(career), r()) : null;
  const next = { ...startCycle(career), event };
  if (jump) return { ...next, phase: "transition" as const, jump };
  if (event) return { ...next, phase: "event" as const };
  return next;
}

function finalize(state: State): State {
  const pending = state.pending;
  if (!pending) return state;
  let career = pending.careerAfter;

  const r = createRng((career.seed ^ hashString(`end:${career.cycle}`)) >>> 0);
  if (checkLegend(career, r())) {
    career = { ...career, legend: true, ended: true, fate: "You got out on top. Almost nobody does." };
    return { ...state, career, phase: "legend", snapshot: snapshot(career), pending: null };
  }
  if (r() < endingChance(career)) {
    career = endCareer(career, r());
    return { ...state, career, phase: "ending", snapshot: snapshot(career), pending: null };
  }
  return afterCycle(career, pending.jump);
}

/** Rebuild live state from a persisted run. Unknown shapes fall back safely. */
function restore(run: SavedRun): State {
  const event = run.eventId ? (CAREER_EVENTS.find((e) => e.id === run.eventId) ?? null) : null;
  const phase = run.phase as Phase;
  const base: State = {
    ready: true,
    phase,
    career: run.career,
    offers: (run.offers as Project[]) ?? [],
    project: (run.project as Project | null) ?? null,
    pool: (run.pool as Actor[]) ?? [],
    cast: (run.cast as Actor[]) ?? [],
    pending: (run.pending as Pending | null) ?? null,
    snapshot: null,
    resumed: true,
    jump: (run.jump as TimeJump | null) ?? null,
    event,
    eventOutcome: (run.eventOutcome as EventOutcome | null) ?? null,
  };
  // Any phase whose payload didn't survive drops back to a coherent board.
  const needsProject = phase === "casting" || phase === "budget";
  const broken =
    (needsProject && !base.project) ||
    (phase === "premiere" && !base.pending) ||
    (phase === "awards" && !base.pending?.awards) ||
    (phase === "transition" && !base.jump) ||
    (phase === "event" && !base.event) ||
    phase === "ending" ||
    phase === "legend" ||
    phase === "intro";
  if (broken) return { ...startCycle(run.career), resumed: true };
  if (base.offers.length === 0) base.offers = generateOffers(run.career);
  return base;
}

function reducer(state: State, action: Action): State {
  const legal = LEGAL[action.type];
  if (legal !== "any" && !legal.includes(state.phase)) return state;

  switch (action.type) {
    case "hydrate": {
      if (state.ready) return state; // Hydration is a one-time event.
      if (action.run) return restore(action.run);
      if (action.career) return { ...startCycle(action.career), resumed: true };
      return { ...state, ready: true };
    }
    case "begin":
      return startCycle(newCareer(freshId()));
    case "select_project": {
      const pool = generateCast(action.project, state.career);
      return { ...state, phase: "casting", project: action.project, pool, cast: [] };
    }
    case "pass": {
      const { career, jump } = applyPass(state.career);
      const r = createRng((career.seed ^ hashString(`passend:${career.cycle}`)) >>> 0);
      if (r() < endingChance(career)) {
        const ended = endCareer(career, r());
        return { ...state, career: ended, phase: "ending", snapshot: snapshot(ended) };
      }
      return afterCycle(career, jump);
    }
    case "back_to_offers":
      return { ...state, phase: "offers", project: null, pool: [], cast: [] };
    case "confirm_cast":
      return { ...state, phase: "budget", cast: action.cast };
    case "confirm_budget": {
      const project = state.project;
      if (!project) return state;
      const film = resolveFilm({ project, cast: state.cast, alloc: action.alloc, career: state.career });
      const { career: afterFilm, effects, jump } = applyFilm(state.career, film);
      const awards = runAwards(film, afterFilm);
      const careerAfter = awards ? applyAwards(afterFilm, awards) : afterFilm;
      return { ...state, phase: "premiere", pending: { film, effects, awards, careerAfter, jump } };
    }
    case "premiere_done": {
      if (state.pending?.awards) return { ...state, phase: "awards" };
      return finalize(state);
    }
    case "awards_done":
      return finalize(state);
    case "transition_done":
      return { ...state, phase: state.event ? "event" : "offers", jump: null };
    case "choose_event": {
      const event = state.event;
      // A branch is chosen exactly once; a second tap resolves nothing.
      if (!event || state.eventOutcome) return state;
      const r = createRng((state.career.seed ^ hashString(`ev:${event.id}:${state.career.cycle}`)) >>> 0);
      const outcome = applyEventChoice(state.career, event, action.choice, r());
      return { ...state, career: outcome.career, eventOutcome: outcome };
    }
    case "event_done":
      if (!state.eventOutcome) return state;
      return startCycle(state.career);
    case "restart":
      return startCycle(newCareer(freshId()));
    case "dev_preset":
      return startCycle(presetCareer(action.preset, freshId()));
    case "dev_end": {
      const career = endCareer(state.career, 0.5);
      return { ...state, career, phase: "ending", snapshot: snapshot(career) };
    }
    case "dev_legend": {
      const career = { ...state.career, legend: true, ended: true, fate: "You got out on top." };
      return { ...state, career, phase: "legend", snapshot: snapshot(career) };
    }
    default:
      return state;
  }
}

const INITIAL: State = {
  ready: false,
  phase: "intro",
  career: newCareer(1),
  offers: [],
  project: null,
  pool: [],
  cast: [],
  pending: null,
  snapshot: null,
  resumed: false,
  jump: null,
  event: null,
  eventOutcome: null,
};

function toSaved(state: State): SavedRun {
  return {
    v: 2,
    career: state.career,
    phase: state.phase,
    offers: state.offers,
    project: state.project,
    pool: state.pool,
    cast: state.cast,
    pending: state.pending,
    jump: state.jump,
    eventId: state.event?.id ?? null,
    eventOutcome: state.eventOutcome,
  };
}

export function useDirectorGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const hydrated = useRef(false);
  const recorded = useRef<number | null>(null);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    dispatch({ type: "hydrate", career: loadCareer(), run: loadRun() });
  }, []);

  /** Persist the whole in-flight turn, never inside the reducer. */
  useEffect(() => {
    if (!state.ready) return;
    if (state.phase === "intro" || state.career.ended) {
      clearRun();
      saveCareer(null);
      return;
    }
    saveCareer(state.career);
    saveRun(toSaved(state));
  }, [state]);

  /** A finished career is banked exactly once. */
  useEffect(() => {
    const snap = state.snapshot;
    if (!snap || recorded.current === snap.careerId) return;
    recorded.current = snap.careerId;
    recordCareer(snap);
  }, [state.snapshot]);

  const filmography = useMemo(() => state.career.films, [state.career.films]);
  const act = useCallback((a: Action) => dispatch(a), []);

  return { state, dispatch: act, filmography };
}
