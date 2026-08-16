/**
 * The director loop.
 *
 * OFFERS -> CASTING -> BUDGET -> PREMIERE -> (AWARDS) -> OFFERS.
 * Everything for a cycle is resolved the moment the budget is locked;
 * the premiere screens only reveal what already happened.
 */

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { createRng } from "../../core/rng";
import {
  applyAwards,
  applyFilm,
  applyPass,
  applyEventChoice,
  careerFate,
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
import { pickEvent, type CareerEvent, type EventChoice } from "./events";
import { computePressure, eventChance } from "./pressure";
import { generateCast } from "./casting";
import { presetCareer, type PresetId } from "./dev";
import { hashString } from "./names";
import type { TimeJump } from "./pacing";
import { generateOffers } from "./offers";
import { resolveFilm } from "./resolve";
import { loadCareer, recordCareer, saveCareer } from "./storage";
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
  | { type: "hydrate"; career: DirectorCareer | null }
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
 * Between films: bank the state, then decide whether a career event
 * interrupts before the next slate of offers.
 */
function afterCycle(state: State, career: DirectorCareer, jump: TimeJump | null): State {
  saveCareer(career);
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
    const snap = snapshot(career);
    recordCareer(snap);
    saveCareer(null);
    return { ...state, career, phase: "legend", snapshot: snap, pending: null };
  }
  if (r() < endingChance(career)) {
    career = endCareer(career, r());
    const snap = snapshot(career);
    recordCareer(snap);
    saveCareer(null);
    return { ...state, career, phase: "ending", snapshot: snap, pending: null };
  }
  return afterCycle(state, career, pending.jump);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate": {
      if (action.career) return { ...startCycle(action.career), resumed: true };
      return { ...state, ready: true };
    }
    case "begin": {
      const career = newCareer(freshId());
      saveCareer(career);
      return startCycle(career);
    }
    case "select_project": {
      const pool = generateCast(action.project, state.career);
      return { ...state, phase: "casting", project: action.project, pool, cast: [] };
    }
    case "pass": {
      const { career, jump } = applyPass(state.career);
      const r = createRng((career.seed ^ hashString(`passend:${career.cycle}`)) >>> 0);
      if (r() < endingChance(career)) {
        const ended = endCareer(career, r());
        const snap = snapshot(ended);
        recordCareer(snap);
        saveCareer(null);
        return { ...state, career: ended, phase: "ending", snapshot: snap };
      }
      return afterCycle(state, career, jump);
    }
    case "back_to_offers":
      return { ...state, phase: "offers", project: null, pool: [], cast: [] };
    case "confirm_cast":
      return { ...state, phase: "budget", cast: action.cast };
    case "confirm_budget": {
      const project = state.project!;
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
      const event = state.event!;
      const r = createRng((state.career.seed ^ hashString(`ev:${event.id}:${state.career.cycle}`)) >>> 0);
      const outcome = applyEventChoice(state.career, event, action.choice, r());
      saveCareer(outcome.career);
      return { ...state, career: outcome.career, eventOutcome: outcome };
    }
    case "event_done":
      return { ...startCycle(state.career), phase: "offers" };
    case "restart": {
      const career = newCareer(freshId());
      saveCareer(career);
      return startCycle(career);
    }
    case "dev_preset": {
      const career = presetCareer(action.preset, freshId());
      saveCareer(career);
      return startCycle(career);
    }
    case "dev_end": {
      const career = endCareer(state.career, 0.5);
      const snap = snapshot(career);
      saveCareer(null);
      return { ...state, career, phase: "ending", snapshot: snap };
    }
    case "dev_legend": {
      const career = { ...state.career, legend: true, ended: true, fate: "You got out on top." };
      const snap = snapshot(career);
      saveCareer(null);
      return { ...state, career, phase: "legend", snapshot: snap };
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

export function useDirectorGame() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    dispatch({ type: "hydrate", career: loadCareer() });
  }, []);

  const filmography = useMemo(() => state.career.films, [state.career.films]);
  const act = useCallback((a: Action) => dispatch(a), []);

  return { state, dispatch: act, filmography };
}
