/**
 * Project offers. The offer screen IS the story: what reaches the
 * director's desk encodes the whole career state without a word of prose.
 */

import { createRng } from "../../core/rng";
import { hashString, noise, pick, projectTitle, range, studioFor } from "./names";
import type { DirectorCareer, Genre, Project, StudioTier } from "./types";

export interface Archetype {
  id: string;
  label: string;
  genres: Genre[];
  tier: StudioTier;
  /** Access window this offer can appear in. */
  access: [number, number];
  budget: [number, number];
  /** Director fee as a share of budget, clamped by floor. */
  feePct: [number, number];
  feeFloor?: number;
  commercial: [number, number];
  prestige: [number, number];
  risk: [number, number];
  franchise?: boolean;
  selfFinanced?: boolean;
  lowStatus?: boolean;
  weight?: number;
  loglines: string[];
  requirement?: string;
  statusLabel: string;
  /** Only offered once the director has fallen from a high budget peak. */
  declineOnly?: boolean;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "adult",
    label: "Adult feature",
    genres: ["Adult"],
    tier: "No-name outfit",
    access: [0, 14],
    budget: [60_000, 180_000],
    feePct: [0.06, 0.1],
    feeFloor: 4_000,
    commercial: [8, 20],
    prestige: [0, 3],
    risk: [40, 60],
    lowStatus: true,
    loglines: [
      "Three days, one condo, no questions about the script.",
      "They need someone who can call 'action' and keep a schedule.",
    ],
    statusLabel: "Nobody will ever see your name on it",
  },
  {
    id: "musicvideo",
    label: "Music video",
    genres: ["Music Video"],
    tier: "No-name outfit",
    access: [0, 26],
    budget: [40_000, 400_000],
    feePct: [0.08, 0.14],
    feeFloor: 5_000,
    commercial: [10, 35],
    prestige: [2, 20],
    risk: [30, 55],
    lowStatus: true,
    loglines: ["A label wants something loud, cheap and shot in one night."],
    statusLabel: "One night shoot",
  },
  {
    id: "commercial",
    label: "Commercial work",
    genres: ["Drama"],
    tier: "No-name outfit",
    access: [0, 55],
    budget: [200_000, 3_000_000],
    feePct: [0.1, 0.16],
    feeFloor: 20_000,
    commercial: [5, 15],
    prestige: [0, 8],
    risk: [10, 25],
    lowStatus: true,
    weight: 0.7,
    loglines: ["Good money. Nobody in the industry will call it a film."],
    statusLabel: "Paid work, not a credit",
  },
  {
    id: "stv",
    label: "Straight-to-video action",
    genres: ["Action"],
    tier: "No-name outfit",
    access: [0, 34],
    budget: [400_000, 2_500_000],
    feePct: [0.05, 0.09],
    feeFloor: 15_000,
    commercial: [15, 32],
    prestige: [2, 10],
    risk: [45, 70],
    lowStatus: true,
    loglines: ["Twenty-two shooting days in Sofia. The fights are already storyboarded."],
    statusLabel: "Video shelf",
  },
  {
    id: "microindie",
    label: "Micro-budget indie",
    genres: ["Drama", "Romance"],
    tier: "Independent",
    access: [0, 40],
    budget: [150_000, 1_800_000],
    feePct: [0.04, 0.08],
    feeFloor: 8_000,
    commercial: [8, 26],
    prestige: [35, 72],
    risk: [50, 75],
    loglines: ["No money, real script, festival hopes."],
    statusLabel: "Festival gamble",
  },
  {
    id: "lowhorror",
    label: "Low-budget horror",
    genres: ["Horror"],
    tier: "Independent",
    access: [0, 55],
    budget: [700_000, 6_000_000],
    feePct: [0.05, 0.09],
    feeFloor: 25_000,
    commercial: [30, 62],
    prestige: [8, 34],
    risk: [55, 80],
    loglines: ["Cheap, mean, and the kind of thing that occasionally explodes."],
    statusLabel: "High upside, no safety net",
  },
  {
    id: "docu",
    label: "Documentary",
    genres: ["Documentary"],
    tier: "Independent",
    access: [0, 60],
    budget: [300_000, 4_000_000],
    feePct: [0.06, 0.1],
    feeFloor: 15_000,
    commercial: [6, 20],
    prestige: [45, 85],
    risk: [30, 50],
    weight: 0.6,
    loglines: ["Two years of access nobody else got."],
    statusLabel: "Critics only",
  },
  {
    id: "indiedrama",
    label: "Independent drama",
    genres: ["Drama", "Crime"],
    tier: "Boutique",
    access: [18, 78],
    budget: [3_000_000, 18_000_000],
    feePct: [0.05, 0.09],
    feeFloor: 120_000,
    commercial: [18, 45],
    prestige: [55, 90],
    risk: [40, 62],
    loglines: ["The script has been passed around for years. Everyone respects it."],
    statusLabel: "Awards adjacent",
  },
  {
    id: "genrethriller",
    label: "Genre thriller",
    genres: ["Thriller", "Crime"],
    tier: "Boutique",
    access: [22, 82],
    budget: [8_000_000, 40_000_000],
    feePct: [0.04, 0.08],
    feeFloor: 300_000,
    commercial: [45, 72],
    prestige: [30, 60],
    risk: [40, 60],
    loglines: ["A clean, nasty hook and a hard release date."],
    statusLabel: "Solid studio bet",
  },
  {
    id: "studiocomedy",
    label: "Studio comedy",
    genres: ["Comedy"],
    tier: "Mini-major",
    access: [26, 85],
    budget: [15_000_000, 55_000_000],
    feePct: [0.035, 0.07],
    feeFloor: 500_000,
    commercial: [50, 78],
    prestige: [12, 38],
    risk: [35, 55],
    loglines: ["Broad, loud, built around whoever you can get."],
    statusLabel: "Wide release",
  },
  {
    id: "prestige",
    label: "Prestige drama",
    genres: ["Drama", "Musical"],
    tier: "Mini-major",
    access: [40, 100],
    budget: [20_000_000, 75_000_000],
    feePct: [0.04, 0.07],
    feeFloor: 900_000,
    commercial: [28, 55],
    prestige: [72, 98],
    risk: [45, 68],
    loglines: ["Fall release. They are saying the word 'Academy' out loud."],
    statusLabel: "Awards play",
  },
  {
    id: "animation",
    label: "Animated feature",
    genres: ["Animation"],
    tier: "Major studio",
    access: [45, 100],
    budget: [70_000_000, 150_000_000],
    feePct: [0.025, 0.05],
    feeFloor: 1_800_000,
    commercial: [65, 90],
    prestige: [30, 62],
    risk: [30, 48],
    weight: 0.7,
    loglines: ["Four years of work. Merchandise decks already exist."],
    statusLabel: "Family tentpole",
  },
  {
    id: "midaction",
    label: "Studio action",
    genres: ["Action", "Sci-Fi"],
    tier: "Major studio",
    access: [48, 100],
    budget: [80_000_000, 170_000_000],
    feePct: [0.025, 0.05],
    feeFloor: 2_000_000,
    commercial: [68, 88],
    prestige: [15, 45],
    risk: [45, 65],
    loglines: ["Two summer dates are being held for it."],
    statusLabel: "Summer window",
  },
  {
    id: "cape",
    label: "Superhero event",
    genres: ["Action", "Sci-Fi"],
    tier: "Franchise unit",
    access: [62, 100],
    budget: [180_000_000, 260_000_000],
    feePct: [0.02, 0.04],
    feeFloor: 4_000_000,
    commercial: [80, 96],
    prestige: [8, 32],
    risk: [50, 72],
    franchise: true,
    requirement: "Cast must clear the franchise's global-appeal bar.",
    loglines: ["Six executives, one release date, and a universe to protect."],
    statusLabel: "Global event",
  },
  {
    id: "franchise",
    label: "Franchise sequel",
    genres: ["Action"],
    tier: "Franchise unit",
    access: [70, 100],
    budget: [220_000_000, 340_000_000],
    feePct: [0.02, 0.035],
    feeFloor: 6_000_000,
    commercial: [88, 99],
    prestige: [3, 18],
    risk: [40, 62],
    franchise: true,
    loglines: ["Cars. Physics as a suggestion. Nine territories already pre-sold."],
    statusLabel: "Worldwide machine",
  },
  {
    id: "xmas",
    label: "Holiday sequel",
    genres: ["Comedy", "Romance"],
    tier: "Boutique",
    access: [8, 55],
    budget: [6_000_000, 16_000_000],
    feePct: [0.04, 0.07],
    feeFloor: 150_000,
    commercial: [28, 48],
    prestige: [2, 12],
    risk: [25, 40],
    declineOnly: true,
    lowStatus: true,
    loglines: ["Streaming needs it delivered by September."],
    statusLabel: "They came to you third",
  },
  {
    id: "passion",
    label: "Self-financed passion project",
    genres: ["Drama", "Sci-Fi", "Crime"],
    tier: "Self-financed",
    access: [0, 100],
    budget: [1_000_000, 60_000_000],
    feePct: [0, 0],
    feeFloor: 0,
    commercial: [15, 55],
    prestige: [60, 98],
    risk: [70, 92],
    selfFinanced: true,
    weight: 0.55,
    loglines: ["Nobody will pay for it. You could."],
    statusLabel: "Your money on the line",
  },
];

/** How much the industry will let you touch. 0-100. */
export function accessScore(c: DirectorCareer): number {
  const base =
    c.studioTrust * 0.34 + c.recognition * 0.3 + c.reputation * 0.26 + c.prestige * 0.1;
  return Math.max(0, Math.min(100, base + c.momentum * 0.12 - c.idleCycles * 3));
}

export type Tier =
  | "Unknown"
  | "Emerging"
  | "Working director"
  | "Studio director"
  | "Acclaimed auteur"
  | "A-list"
  | "Mogul"
  | "Fading"
  | "Collapsed";

export function directorTier(c: DirectorCareer): Tier {
  const a = accessScore(c);
  const fell = c.peak.budget >= 60_000_000 && a < 42;
  if (fell && a < 22) return "Collapsed";
  if (fell) return "Fading";
  if (a >= 82 && c.recognition >= 78 && c.money >= 60_000_000) return "Mogul";
  if (a >= 78) return "A-list";
  if (a >= 60 && c.reputation >= c.recognition + 10) return "Acclaimed auteur";
  if (a >= 55) return "Studio director";
  if (a >= 30) return "Working director";
  if (a >= 12) return "Emerging";
  return "Unknown";
}

function clampBudget(a: Archetype, access: number, r: () => number): number {
  const [lo, hi] = a.budget;
  // Position inside the archetype's band scales with how far past its
  // entry gate the director stands.
  const span = Math.max(1, a.access[1] - a.access[0]);
  const t = Math.max(0, Math.min(1, (access - a.access[0]) / span));
  const centre = lo + (hi - lo) * (0.25 + t * 0.7);
  const v = centre * range(r, 0.85, 1.18);
  return Math.round(Math.max(lo, Math.min(hi, v)) / 10_000) * 10_000;
}

function buildProject(a: Archetype, c: DirectorCareer, r: () => number, i: number): Project {
  const access = accessScore(c);
  const budget = clampBudget(a, access, r);
  const fee = Math.max(a.feeFloor ?? 0, Math.round(budget * range(r, a.feePct[0], a.feePct[1])));
  const genre = pick(r, a.genres);
  const stake = a.selfFinanced
    ? Math.round(Math.min(budget, Math.max(50_000, c.money * range(r, 0.4, 0.85))) / 10_000) * 10_000
    : 0;
  const project: Project = {
    id: `${c.careerId}-${c.cycle}-${i}-${a.id}`,
    archetype: a.id,
    title: projectTitle(r, a.id),
    genre,
    studio: studioFor(r, a.tier),
    studioTier: a.tier,
    budget: a.selfFinanced ? stake : budget,
    fee: a.selfFinanced ? 0 : fee,
    commercial: Math.round(range(r, a.commercial[0], a.commercial[1])),
    prestige: Math.round(range(r, a.prestige[0], a.prestige[1])),
    risk: Math.round(range(r, a.risk[0], a.risk[1])),
    logline: pick(r, a.loglines),
    statusLabel: a.statusLabel,
  };
  if (a.franchise) project.franchise = true;
  if (a.lowStatus) project.lowStatus = true;
  if (a.requirement) project.requirement = a.requirement;
  if (a.selfFinanced) {
    project.selfFinanced = true;
    project.personalStake = stake;
  }
  return project;
}

/**
 * Three offers, seeded by (career, cycle) so a resumed run sees the same
 * desk. Windows are soft: one slot may reach slightly above the current
 * access level, which is where comebacks come from.
 */
export function generateOffers(c: DirectorCareer): Project[] {
  const r = createRng((c.seed ^ hashString(`offers:${c.cycle}`)) >>> 0);
  const access = accessScore(c);
  const fell = c.peak.budget >= 60_000_000 && access < 45;

  const eligible = (stretch: number) =>
    ARCHETYPES.filter((a) => {
      if (a.declineOnly && !fell) return false;
      if (a.selfFinanced && c.money < 250_000) return false;
      if (a.lowStatus && access > a.access[1]) return false;
      return access + stretch >= a.access[0] && access <= a.access[1] + 25;
    });

  const chosen: Archetype[] = [];
  const stretches = [0, 0, 14];
  for (const stretch of stretches) {
    const pool = eligible(stretch).filter((a) => !chosen.includes(a));
    if (pool.length === 0) continue;
    let total = 0;
    const weights = pool.map((a) => {
      // Prefer archetypes whose band is centred near current access.
      const centre = (a.access[0] + a.access[1]) / 2;
      const closeness = 1 / (1 + Math.abs(access - centre) / 22);
      const w = (a.weight ?? 1) * closeness;
      total += w;
      return w;
    });
    let roll = r() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) {
        idx = i;
        break;
      }
    }
    chosen.push(pool[idx]!);
  }
  while (chosen.length < 3) {
    const fallback = ARCHETYPES.filter((a) => !a.declineOnly && !a.selfFinanced);
    chosen.push(pick(r, fallback));
  }
  return chosen.map((a, i) => buildProject(a, c, r, i));
}

/** Small drift so identical projects don't feel machine-made. */
export function offerFlavourSeed(p: Project): number {
  return hashString(p.id);
}

export { noise };
