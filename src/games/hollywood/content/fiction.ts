/**
 * HOLLYWOOD — fictional world material for repeatable events.
 *
 * Repeatable events (gigs, auditions, role offers) re-enter the pool by
 * design; to keep the player from perceiving "the same question again",
 * their copy is regenerated per occurrence from seeded name/title pools.
 * Deterministic given (careerId, eventId, occurrence), so a resumed save
 * renders the same variant it was saved with. All people, titles, studios
 * and products are fictional.
 */

import { createRng, type Rng } from "../../core/rng";
import type { GameState } from "../types";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** How many times this event has already appeared in this career. */
export function occurrenceOf(s: GameState, eventId: string): number {
  let n = 0;
  for (const h of s.history) if (h.eventId === eventId) n++;
  return n;
}

/** Deterministic rng for this event's next appearance. */
export function variantRng(s: GameState, eventId: string): Rng {
  return createRng(((s.careerId ^ hashString(eventId)) >>> 0) + occurrenceOf(s, eventId) * 7919);
}

function pick<T>(r: Rng, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)]!;
}

const FIRST = [
  "Marta", "Elias", "Doria", "Sol", "Ingrid", "Cassius", "Noa", "Theo",
  "Paloma", "Rufus", "Anouk", "Silas", "Vera", "Odessa", "Bram", "Celeste",
] as const;
const LAST = [
  "Kessler", "Marchetti", "Okonkwo", "Vane", "Lindqvist", "Barros", "Halloway",
  "Duval", "St Clair", "Mondragon", "Ashford", "Petrov", "Nakamura", "Quill",
] as const;

/** A fictional director / producer / industry figure. */
export function personName(r: Rng): string {
  return `${pick(r, FIRST)} ${pick(r, LAST)}`;
}

const TITLE_A = [
  "Silent", "Crimson", "Hollow", "Electric", "Paper", "Midnight", "Golden",
  "Broken", "Velvet", "Concrete", "Burning", "Patient", "Feral", "Quiet", "Neon",
] as const;
const TITLE_B = [
  "Harbor", "Meridian", "Orchard", "Kingdom", "Signal", "Winter", "Parade",
  "Country", "Hour", "Divide", "Season", "River", "Covenant", "Skyline",
] as const;

/** A fictional film title. */
export function filmTitle(r: Rng): string {
  const roll = r();
  if (roll < 0.55) return `The ${pick(r, TITLE_A)} ${pick(r, TITLE_B)}`;
  if (roll < 0.8) return `${pick(r, TITLE_A)} ${pick(r, TITLE_B)}`;
  return `${pick(r, TITLE_B)} ${pick(r, ["After Dark", "Rising", "at Dawn", "Forever"])}`;
}

const STUDIOS = [
  "Meridian Pictures", "Cascadia Films", "Blue Lantern Studios", "Vantage & Co.",
  "Northlight Pictures", "The Foundry", "Solstice Media", "Blackpine Entertainment",
] as const;

export function studioName(r: Rng): string {
  return pick(r, STUDIOS);
}

const PRODUCTIONS = [
  "a network hospital drama", "a syndicated cop show", "a streaming courtroom series",
  "a cable legal thriller", "a daytime soap", "a prestige miniseries about the 70s",
  "a true-crime reenactment show", "a network sitcom in its ninth season",
] as const;

/** What an extra is booked on. */
export function productionName(r: Rng): string {
  return pick(r, PRODUCTIONS);
}

const PRODUCTS = [
  "a regional mattress empire", "a discount furniture chain", "an off-brand energy drink",
  "a personal-injury law firm", "a cable-only cooking gadget", "a timeshare resort in the desert",
  "a pickup-truck dealership", "a Medicare hotline", "a local casino", "a meal-kit startup",
] as const;

export function productName(r: Rng): string {
  return pick(r, PRODUCTS);
}

const HOSTS = [
  "a super-agent", "a studio chairman", "a pop star's manager", "a streaming executive",
  "an heiress turned producer", "a director coming off a flop", "a retired studio head",
] as const;

export function partyHost(r: Rng): string {
  return pick(r, HOSTS);
}

const SHOWS = [
  "Harbor Point", "The Long Afternoon", "Mercy & Main", "Sullivan Street",
  "Cedar County", "The Clearing", "All Our Tomorrows",
] as const;

/** A fictional soap/daytime show. */
export function showName(r: Rng): string {
  return pick(r, SHOWS);
}

const TROUPES = [
  "The Velcro Shoes", "Midnight Suggestion", "The Farm System",
  "Yes Andromeda", "The Callbacks", "Public Property",
] as const;

export function troupeName(r: Rng): string {
  return pick(r, TROUPES);
}

const STUNTS = [
  "a 'simple' fall off a second-story roof", "a stair fall in a grocery store",
  "a bar-fight launch through a breakaway table", "a car-hit roll over a hood",
  "a full-body burn for three seconds", "a wire pull through a candy-glass window",
] as const;

export function stuntGig(r: Rng): string {
  return pick(r, STUNTS);
}

const WEB_PREMISES = [
  "a sitcom about failed actors", "a mockumentary about a low-stakes cult",
  "a drama shot entirely in one kitchen", "a horror series filmed on phones",
  "a cooking show where nobody can cook",
] as const;

export function webPremise(r: Rng): string {
  return pick(r, WEB_PREMISES);
}

const CAR_DEATHS = [
  "on the 101", "in the Valley in August", "outside an audition in Burbank",
  "on Laurel Canyon at midnight", "in the studio lot's visitor parking",
] as const;

export function carDeath(r: Rng): string {
  return pick(r, CAR_DEATHS);
}

const INFO_PRODUCTS = [
  "a fitness device", "a kitchen gadget", "a hair-restoration system",
  "a meditation headset", "a mattress that folds into a chair",
] as const;

export function infoProduct(r: Rng): string {
  return pick(r, INFO_PRODUCTS);
}

const PLAYS = [
  "a Beckett one-act", "an experimental piece staged in total darkness",
  "a three-hander about a family selling the farm", "a two-person play about a divorce, acted backwards",
  "a new work by a playwright nobody has read yet",
] as const;

export function playTitle(r: Rng): string {
  return pick(r, PLAYS);
}
