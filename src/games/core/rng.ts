/** Deterministic-friendly RNG (mulberry32). One stream per career. */

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pickWeighted<T>(rng: Rng, items: T[], weight: (item: T) => number): T {
  let total = 0;
  for (const item of items) total += Math.max(0, weight(item));
  if (total <= 0) return items[Math.floor(rng() * items.length)]!;
  let roll = rng() * total;
  for (const item of items) {
    roll -= Math.max(0, weight(item));
    if (roll <= 0) return item;
  }
  return items[items.length - 1]!;
}
