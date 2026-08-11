/**
 * HOLLYWOOD — the downfall engine.
 *
 * Every non-legend path ends. When and how is computed here from the
 * accumulated shape of the career — exposure, ego, enemies, decay, age —
 * never from a flat timer. A reckless producer drifts toward financial
 * ruin; a bridge-burner toward isolation and blacklists; a fading star
 * toward irrelevance. The ending is selected from terminal events whose
 * family matches the career's dominant pressures, so the final chapter
 * reads as a consequence, not a kill switch.
 *
 * Some terminal events have survival branches: the career continues,
 * diminished, and the comeback arc begins. Nothing in this file is
 * player-facing.
 */

import { DOWNFALL, PACING } from "./config";
import { hardGatesOk } from "./engine";
import { pickWeighted, type Rng } from "../core/rng";
import type { DownfallFamily, GameEvent, GameState } from "./types";

/** Deterministic hard stops: extreme age, total ruin. */
function hardEndNow(s: GameState): boolean {
  return s.stats.age >= PACING.hardEndAge || s.stats.money < -40_000_000;
}

/** Probabilistic winding-down: burnout collapse and the soft age ramp. */
function softEndRoll(s: GameState, rng: Rng): boolean {
  const st = s.stats;
  if (st.burnout >= 100 && rng() < 0.5) return true;
  if (st.age >= PACING.softEndAge) {
    if (rng() < (st.age - PACING.softEndAge) / 14) return true;
  }
  return false;
}

/** The high-stakes tier: the career has something enormous to lose. */
function dangerTier(s: GameState): boolean {
  const st = s.stats;
  return (
    st.oscars >= 1 ||
    st.fame >= 60 ||
    st.peakMoney >= 20_000_000 ||
    st.age >= PACING.softEndAge
  );
}

/**
 * Per-family pressure, computed from how the player actually lived.
 * Reckless money feeds financial ruin; burned bridges feed isolation
 * and feuds; a curdling public image feeds scandal; time feeds the rest.
 */
export function downfallPressures(s: GameState): Record<DownfallFamily, number> {
  const st = s.stats;
  const f = s.flags;
  const fameDecay = Math.max(0, st.peakFame - st.fame);
  return {
    financial:
      st.financialRisk * 0.45 +
      Math.min(30, Math.max(0, st.money) / 3_000_000) +
      (f["productionCompany"] ? 10 : 0) +
      (f["betTheCompany"] ? 15 : 0) +
      (st.money < 0 ? 30 : 0),
    scandal: (100 - st.publicPerception) * 0.45 + st.fame * 0.2 + (f["scandalMarked"] ? 25 : 0),
    irrelevance: fameDecay * 0.9 + Math.max(0, st.age - 55) * 1.6 + (st.fame < 20 ? 12 : 0),
    isolation:
      st.ego * 0.4 +
      (100 - st.connections) * 0.35 +
      st.burnout * 0.2 +
      (f["blacklistedQuietly"] ? 15 : 0),
    feud:
      st.influence * 0.15 +
      (f["blacklistedQuietly"] ? 25 : 0) +
      (f["treatedAssistantBadly"] ? 15 : 0) +
      (f["companyBankrupt"] ? 10 : 0),
    accident:
      st.burnout * 0.45 +
      Math.max(0, st.age - 58) * 2.2 +
      st.riskTolerance * 0.2 +
      (100 - st.luck) * 0.1,
    studio:
      (f["productionCompany"] ? 18 : 0) +
      (f["companyCollapsing"] ? 45 : 0) +
      st.financialRisk * 0.25,
    legacy:
      st.legacy * 0.35 +
      st.culturalImpact * 0.2 +
      Math.max(0, st.age - 62) * 2.0 +
      (f["scandalMarked"] ? 10 : 0),
  };
}

function totalPressure(p: Record<DownfallFamily, number>): number {
  return Object.values(p).reduce((a, b) => a + b, 0);
}

/** A downfall event was shown recently; let the comeback breathe. */
function crisisOnCooldown(s: GameState): boolean {
  return Object.entries(s.familyTurns).some(
    ([fam, turn]) => fam.startsWith("downfall") && s.turn - turn < DOWNFALL.crisisCooldownTurns,
  );
}

/** The danger-tier per-turn roll, scaled by pressure and by age. */
function pressureTriggers(s: GameState, rng: Rng): boolean {
  if (!dangerTier(s)) return false;
  if (s.turn < DOWNFALL.minTurns) return false;
  const total = totalPressure(downfallPressures(s));
  let chance =
    DOWNFALL.baseChancePerTurn +
    Math.max(0, total - DOWNFALL.pressureFloor) * DOWNFALL.pressureScale;
  if (s.stats.age >= DOWNFALL.ageRampStart) {
    chance += (s.stats.age - DOWNFALL.ageRampStart) * DOWNFALL.ageRampPerYear;
  }
  return rng() < Math.min(DOWNFALL.maxChancePerTurn, chance);
}

/**
 * Should the career meet its ending now — and if so, which ending?
 * Returns null while the path continues. With `force`, skips all rolls
 * (dev tooling and pool-exhaustion fallback only).
 */
export function pickTerminalEvent(
  s: GameState,
  events: GameEvent[],
  rng: Rng,
  opts?: { force?: boolean },
): GameEvent | null {
  if (!opts?.force) {
    if (!hardEndNow(s)) {
      if (crisisOnCooldown(s)) return null;
      if (!softEndRoll(s, rng) && !pressureTriggers(s, rng)) return null;
    }
  }
  const pool = events.filter((e) => e.terminal && hardGatesOk(e, s));
  if (pool.length === 0) return null;
  const pressures = downfallPressures(s);
  return pickWeighted(rng, pool, (e) => {
    const p = e.downfallFamily ? pressures[e.downfallFamily] : 0;
    return 2 + Math.max(0, p);
  });
}
