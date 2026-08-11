/**
 * Casting pool. Who takes your call is a function of money, studio and
 * how the town rates you — the cards themselves say where you stand.
 */

import { createRng } from "../../core/rng";
import { accessScore } from "./offers";
import { actorName, hashString, pick, range } from "./names";
import type { Actor, DirectorCareer, Project } from "./types";

interface StarBand {
  status: string;
  /** Salary as a share of the film's budget. */
  costPct: [number, number];
  costFloor: number;
  draw: [number, number];
  talent: [number, number];
  volatility: [number, number];
  notes: string[];
}

const BANDS: StarBand[] = [
  {
    status: "Unknown",
    costPct: [0.01, 0.04],
    costFloor: 2_000,
    draw: [1, 12],
    talent: [20, 92],
    volatility: [10, 45],
    notes: ["Nobody has seen them yet.", "Two student films and a commercial.", "Cheap. Hungry."],
  },
  {
    status: "Character actor",
    costPct: [0.02, 0.05],
    costFloor: 25_000,
    draw: [8, 28],
    talent: [55, 95],
    volatility: [8, 30],
    notes: ["Steals every scene they're in.", "Twenty years of small parts.", "Directors love them."],
  },
  {
    status: "Rising",
    costPct: [0.03, 0.07],
    costFloor: 80_000,
    draw: [25, 52],
    talent: [45, 85],
    volatility: [20, 55],
    notes: ["One breakout away.", "The town is starting to circle.", "Great reel, no track record."],
  },
  {
    status: "Name",
    costPct: [0.05, 0.11],
    costFloor: 600_000,
    draw: [45, 72],
    talent: [40, 82],
    volatility: [15, 50],
    notes: ["Opens a mid-size film.", "Reliable. Not exciting.", "Books constantly."],
  },
  {
    status: "Star",
    costPct: [0.07, 0.15],
    costFloor: 3_000_000,
    draw: [65, 88],
    talent: [35, 85],
    volatility: [20, 60],
    notes: ["Foreign buyers ask for them by name.", "Comes with an entourage.", "Poster sells itself."],
  },
  {
    status: "Global star",
    costPct: [0.09, 0.2],
    costFloor: 12_000_000,
    draw: [85, 99],
    talent: [30, 88],
    volatility: [25, 70],
    notes: ["Moves tickets in every territory.", "Approval over the script.", "Will not do reshoots."],
  },
  {
    status: "Prestige lead",
    costPct: [0.06, 0.13],
    costFloor: 1_500_000,
    draw: [40, 68],
    talent: [82, 99],
    volatility: [12, 48],
    notes: ["Two nominations already.", "Only works with material they respect.", "Awards bodies adore them."],
  },
  {
    status: "Faded",
    costPct: [0.02, 0.05],
    costFloor: 150_000,
    draw: [22, 46],
    talent: [45, 88],
    volatility: [40, 85],
    notes: ["Huge, once.", "Insurance bond required.", "Says this is the comeback."],
  },
];

function bandsFor(project: Project, access: number): StarBand[] {
  const b = project.budget;
  const out: StarBand[] = [BANDS[0]!, BANDS[1]!];
  if (b >= 1_500_000) out.push(BANDS[2]!, BANDS[7]!);
  if (b >= 12_000_000) out.push(BANDS[3]!);
  if (b >= 25_000_000 && (project.prestige >= 55 || access >= 55)) out.push(BANDS[6]!);
  if (b >= 45_000_000 && access >= 45) out.push(BANDS[4]!);
  if (b >= 120_000_000 && access >= 60) out.push(BANDS[5]!);
  return out;
}

function makeActor(band: StarBand, project: Project, r: () => number, i: number): Actor {
  const cost =
    Math.round(
      Math.max(band.costFloor, project.budget * range(r, band.costPct[0], band.costPct[1])) / 1_000,
    ) * 1_000;
  const name = actorName(r);
  return {
    id: `${project.id}-a${i}`,
    name,
    status: band.status,
    cost: Math.min(cost, Math.round(project.budget * 0.42)),
    draw: Math.round(range(r, band.draw[0], band.draw[1])),
    talent: Math.round(range(r, band.talent[0], band.talent[1])),
    fit: Math.round(range(r, 25, 98)),
    volatility: Math.round(range(r, band.volatility[0], band.volatility[1])),
    note: pick(r, band.notes),
  };
}

/** Six candidates. The player casts two: a lead and a second lead. */
export function generateCast(project: Project, c: DirectorCareer): Actor[] {
  const r = createRng((hashString(project.id) ^ (c.seed >>> 3)) >>> 0);
  const bands = bandsFor(project, accessScore(c));
  const out: Actor[] = [];
  for (let i = 0; i < 6; i++) {
    const band = bands[Math.floor(r() * bands.length)]!;
    out.push(makeActor(band, project, r, i));
  }
  // Guarantee at least one affordable option so the budget never deadlocks.
  out.sort((a, b) => a.cost - b.cost);
  const cheapest = out[0]!;
  const second = out[1]!;
  const cap = project.budget * 0.55;
  if (cheapest.cost + second.cost > cap) {
    cheapest.cost = Math.round(project.budget * 0.12);
    second.cost = Math.round(project.budget * 0.15);
  }
  return out.sort(() => 0);
}

export const CAST_SLOTS = 2;
