/**
 * Fictional world material for the director path. Every studio, actor and
 * title is invented; franchise archetypes are recognizable shapes, never
 * real properties.
 */

import type { Rng } from "../../core/rng";
import type { Genre } from "./types";

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(r: Rng, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)]!;
}

export function range(r: Rng, min: number, max: number): number {
  return min + r() * (max - min);
}

/** Roughly normal noise in [-1, 1]. */
export function noise(r: Rng): number {
  return (r() + r() + r()) / 1.5 - 1;
}

export const STUDIOS: Record<string, readonly string[]> = {
  "No-name outfit": [
    "Sunbelt Video",
    "Cormorant Releasing",
    "Ninth Street Tapes",
    "Vulcan Home Ent.",
    "Pacific Cassette",
  ],
  Independent: [
    "Paper Lantern",
    "Small Hours Films",
    "Duna Collective",
    "Ashgrove Pictures",
    "Rooftop & Sons",
  ],
  Boutique: [
    "Meridian Pictures",
    "Solstice Media",
    "The Foundry",
    "Cascadia Films",
    "Blue Lantern",
  ],
  "Mini-major": [
    "Northlight Pictures",
    "Vantage & Co.",
    "Blackpine Entertainment",
    "Halcyon Feature Group",
  ],
  "Major studio": [
    "Atlas Continental",
    "Regent Pictures",
    "Monarch Studios",
    "Titanic Bay Pictures",
    "Corvus Global",
  ],
  "Franchise unit": ["Monarch Tentpole Group", "Atlas Franchise Division", "Regent Global Event"],
  "Self-financed": ["Your own money"],
};

const FIRST = [
  "Marta", "Elias", "Doria", "Sol", "Ingrid", "Cassius", "Noa", "Theo", "Paloma", "Rufus",
  "Anouk", "Silas", "Vera", "Odessa", "Bram", "Celeste", "Junia", "Kaspar", "Lelia", "Otto",
  "Rana", "Dov", "Mireille", "Cyrus", "Wren", "Amadou", "Petra", "Hal", "Isolde", "Nico",
] as const;

const LAST = [
  "Kessler", "Marchetti", "Okonkwo", "Vane", "Lindqvist", "Barros", "Halloway", "Duval",
  "St Clair", "Mondragon", "Ashford", "Petrov", "Nakamura", "Quill", "Adeyemi", "Fontaine",
  "Rask", "Bellweather", "Ozturk", "Salcedo", "Ferreira", "Wynn", "Draper", "Costa",
] as const;

export function actorName(r: Rng): string {
  return `${pick(r, FIRST)} ${pick(r, LAST)}`;
}

const T_ADJ = [
  "Silent", "Crimson", "Hollow", "Electric", "Paper", "Midnight", "Golden", "Broken",
  "Velvet", "Concrete", "Burning", "Patient", "Feral", "Quiet", "Neon", "Iron", "Salt",
] as const;

const T_NOUN = [
  "Harbor", "Meridian", "Orchard", "Kingdom", "Signal", "Winter", "Parade", "Country",
  "Hour", "Divide", "Season", "River", "Covenant", "Skyline", "Machine", "Garden",
] as const;

const TITLE_POOLS: Partial<Record<string, readonly string[]>> = {
  adult: [
    "Backdoor Bookkeeping",
    "The Plumber Always Rings Twice",
    "Executive Suite 6",
    "Hot Tub Timeshare",
    "Nurse Practitioners III",
  ],
  musicvideo: [
    "GLASSJAW — 'Fever Pitch'",
    "SAINT VANITY — 'Nine Lives'",
    "The Molotovs — 'Hometown'",
    "KIRA V — 'Undertow'",
  ],
  stv: [
    "Kill Radius",
    "Steel Harvest 3",
    "Deadline: Bangkok",
    "Maximum Contact",
    "The Enforcer Protocol",
  ],
  lowhorror: [
    "The Weeping Room",
    "Feedbag",
    "Cabin Nine",
    "It Takes The Teeth",
    "Nightcrawl",
    "The Long Hallway",
  ],
  xmas: [
    "A Very Merry Rescue 2",
    "Santa's Second Shift",
    "Christmas at Copper Falls 3",
    "The Nutcracker Heist",
  ],
  commercial: [
    "BRAVADO Cologne — 60s spot",
    "NorthPeak Trucks — Super Bowl spot",
    "Halcyon Airlines — brand film",
  ],
  franchise: [
    "OVERDRIVE 7: Terminal Velocity",
    "OVERDRIVE 8: Full Throttle",
    "REDLINE: Global Pursuit",
    "APEX PREDATOR 4",
  ],
  cape: [
    "NIGHTGLASS",
    "The Vigil: Ascendant",
    "PARAGON",
    "Sentinel Six",
  ],
  animation: [
    "Wobble!",
    "The Very Small Kingdom",
    "Bramble & Bug",
    "Moon Farm",
  ],
  docu: [
    "Nobody Asked For This",
    "The Last Drive-In on Route 9",
    "Seventeen Winters",
  ],
};

export function projectTitle(r: Rng, archetype: string): string {
  const pool = TITLE_POOLS[archetype];
  if (pool) return pick(r, pool);
  const roll = r();
  if (roll < 0.5) return `The ${pick(r, T_ADJ)} ${pick(r, T_NOUN)}`;
  if (roll < 0.78) return `${pick(r, T_ADJ)} ${pick(r, T_NOUN)}`;
  return `${pick(r, T_NOUN)} ${pick(r, ["After Dark", "Rising", "at Dawn", "Country", "Blues"])}`;
}

export function studioFor(r: Rng, tier: string): string {
  return pick(r, STUDIOS[tier] ?? STUDIOS["Independent"]!);
}

/** Deterministic portrait hue for an actor card. */
export function portraitHue(name: string): number {
  return hashString(name) % 360;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("");
}

export const GENRE_ORDER: Genre[] = [
  "Drama",
  "Comedy",
  "Horror",
  "Thriller",
  "Action",
  "Sci-Fi",
  "Crime",
  "Romance",
  "Animation",
  "Documentary",
  "Musical",
  "Adult",
  "Music Video",
];
