/**
 * HOLLYWOOD — the movie-production chain.
 *
 * Showcase and laboratory for the interaction system: one event becomes
 * a short interactive sequence (PICK screenplay → PICK co-star →
 * ALLOCATION budget → resolution) instead of a single card.
 *
 * Resolution deliberately does NOT reduce to "more budget = better":
 * the split's fit to the material, the co-star's profile, the player's
 * career state and seeded variance all interact, producing acclaimed
 * flops, trash hits, expensive disasters, cheap breakouts, cult films
 * and prestige successes. All titles and people are fictional.
 */

import { randInt } from "../../core/rng";
import { formatMoney } from "../scoring";
import type {
  CareerFlags,
  CareerStats,
  FilmRecord,
  GameEvent,
  PickItem,
  SequenceContext,
  SequenceResult,
} from "../types";

/* ------------------------------------------------------------------ */
/* Fictional material                                                   */
/* ------------------------------------------------------------------ */

const SCREENPLAYS: PickItem[] = [
  {
    id: "projectionist",
    title: "The Last Projectionist",
    subtitle: "Prestige drama",
    description:
      "An aging projectionist in a dying cinema hides the reels of a lost film. Small, quiet, and written with festivals in mind.",
    traits: [
      { label: "Genre", value: "Drama" },
      { label: "Scale", value: "Intimate" },
      { label: "Ceiling", value: "Awards", tone: "gold" },
    ],
    data: {
      quality: 82,
      commercial: 24,
      prestige: 92,
      risk: 30,
      baseBudget: 8_000_000,
      idealCast: 30,
      idealProd: 45,
      idealMkt: 25,
    },
  },
  {
    id: "speedway",
    title: "Midnight Speedway",
    subtitle: "Action thriller",
    description:
      "A getaway driver who only works after dark. Loud, fast, built for opening weekends everywhere on Earth.",
    traits: [
      { label: "Genre", value: "Action" },
      { label: "Scale", value: "Tentpole" },
      { label: "Ceiling", value: "Franchise", tone: "good" },
    ],
    data: {
      quality: 46,
      commercial: 90,
      prestige: 18,
      risk: 35,
      baseBudget: 46_000_000,
      idealCast: 25,
      idealProd: 40,
      idealMkt: 35,
    },
  },
  {
    id: "salt_static",
    title: "Salt & Static",
    subtitle: "Ambitious sci-fi",
    description:
      "A radio astronomer starts receiving broadcasts from her own future. Brilliant on page one; unreadable by page ninety. Could be either.",
    traits: [
      { label: "Genre", value: "Sci-fi" },
      { label: "Scale", value: "Ambitious" },
      { label: "Variance", value: "Extreme", tone: "bad" },
    ],
    data: {
      quality: 68,
      commercial: 52,
      prestige: 64,
      risk: 85,
      baseBudget: 22_000_000,
      idealCast: 25,
      idealProd: 50,
      idealMkt: 25,
    },
  },
];

const ACTORS: PickItem[] = [
  {
    id: "vivian",
    title: "Vivian Cross",
    subtitle: "Character actress · two nominations",
    description:
      "Critics adore her; opening weekends do not. She elevates everything she touches.",
    traits: [
      { label: "Craft", value: "Superb", tone: "gold" },
      { label: "Draw", value: "Modest" },
      { label: "Salary", value: "Fair" },
    ],
    data: { talent: 86, draw: 30, prestige: 82, costPct: 0.12 },
  },
  {
    id: "dash",
    title: "Dash Riker",
    subtitle: "Franchise star",
    description:
      "His face alone sells out Thursday previews. His range ends somewhere around page ten.",
    traits: [
      { label: "Craft", value: "Limited", tone: "bad" },
      { label: "Draw", value: "Enormous", tone: "good" },
      { label: "Salary", value: "Colossal", tone: "bad" },
    ],
    data: { talent: 44, draw: 92, prestige: 14, costPct: 0.38 },
  },
  {
    id: "alba",
    title: "Alba Reyes",
    subtitle: "Breakout indie star",
    description:
      "One great performance, one huge year. The trades call her 'the next one'. Ask again in three years.",
    traits: [
      { label: "Craft", value: "Strong", tone: "gold" },
      { label: "Draw", value: "Growing" },
      { label: "Salary", value: "Cheap", tone: "good" },
    ],
    data: { talent: 76, draw: 46, prestige: 60, costPct: 0.08 },
  },
  {
    id: "viper",
    title: "The Viper",
    subtitle: "Wrestler. Allegedly an actor.",
    description:
      "Nobody knows if he can act. Everybody knows who he is. The insurance alone is a line item.",
    traits: [
      { label: "Craft", value: "Unknown", tone: "bad" },
      { label: "Draw", value: "Big", tone: "good" },
      { label: "Chaos", value: "Guaranteed", tone: "bad" },
    ],
    data: { talent: 26, draw: 68, prestige: 6, costPct: 0.16 },
  },
];

/* ------------------------------------------------------------------ */
/* Budget math — deterministic given ctx, so the UI and the resolver    */
/* always agree on the numbers. Variance lives in the box office.       */
/* ------------------------------------------------------------------ */

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function computeBudget(base: number, g: CareerStats): number {
  const scale = 0.72 + g.fame / 130 + g.connections / 240 + g.reputation / 400;
  return Math.max(2_000_000, Math.round((base * scale) / 100_000) * 100_000);
}

function actorFee(budget: number, costPct: number): number {
  return Math.round((budget * costPct) / 100_000) * 100_000;
}

function chainNumbers(ctx: SequenceContext) {
  const sp = ctx.pickItems["screenplay"];
  const co = ctx.pickItems["costar"];
  const g = ctx.game.stats;
  const budget = sp ? computeBudget(num(sp.data?.["baseBudget"]), g) : 0;
  const fee = co && budget > 0 ? actorFee(budget, num(co.data?.["costPct"])) : 0;
  return { sp, co, budget, fee, remaining: Math.max(0, budget - fee) };
}

/* ------------------------------------------------------------------ */
/* Resolution                                                           */
/* ------------------------------------------------------------------ */

function criticsPhrase(critics: number): string {
  if (critics >= 90) return "a masterpiece";
  if (critics >= 80) return "essential viewing";
  if (critics >= 70) return "genuinely good";
  if (critics >= 55) return "flawed but alive";
  if (critics >= 40) return "a mixed bag";
  if (critics >= 25) return "a mess";
  return "a catastrophe";
}

function resolveMovie(ctx: SequenceContext): SequenceResult {
  const { sp, co, budget } = chainNumbers(ctx);
  const g = ctx.game.stats;
  const rng = ctx.rng;
  const alloc = ctx.allocations["budget"] ?? { cast: 34, production: 33, marketing: 33 };
  const d = (k: string) => num(sp?.data?.[k]);
  const a = (k: string) => num(co?.data?.[k]);

  const title = sp?.title ?? "Untitled";
  const coName = co?.title ?? "an unknown";

  // How closely the split matches what this material actually needs.
  const fit = Math.max(
    0,
    Math.min(
      100,
      100 -
        (Math.abs(num(alloc["cast"]) - d("idealCast")) +
          Math.abs(num(alloc["production"]) - d("idealProd")) +
          Math.abs(num(alloc["marketing"]) - d("idealMkt"))) /
          2,
    ),
  );

  // Critical reception: material, cast craft, the player's own weight,
  // allocation fit — and a chaos band scaled by the project's risk.
  const material = d("quality") * 0.45 + a("talent") * 0.25 + g.talent * 0.2 + g.reputation * 0.1;
  const chaos = (rng() * 2 - 1) * (10 + d("risk") * 0.22 + (100 - a("talent")) * 0.04);
  const critics = Math.max(2, Math.min(99, Math.round(material * 0.72 + fit * 0.28 + chaos)));

  // Box office: appeal, marketing reach, word of mouth, luck.
  const appeal = d("commercial") * 0.42 + a("draw") * 0.33 + g.fame * 0.25;
  const reach = 0.35 + (num(alloc["marketing"]) / 100) * 0.75;
  let multiplier = (0.25 + (appeal / 100) * 2.6) * reach * (0.7 + rng() * 0.6);
  if (critics >= 80 && budget <= 15_000_000) multiplier *= 2.4; // festival wildfire
  else if (critics >= 72) multiplier *= 1.3;
  else if (critics >= 60) multiplier *= 1.12;
  else if (critics <= 32) multiplier *= 0.85;
  multiplier *= 0.75 + fit / 400;
  multiplier *= 0.92 + g.luck / 500;

  const gross = Math.round((budget * multiplier) / 100_000) * 100_000;
  const ratio = budget > 0 ? gross / budget : 0;
  const prestige = d("prestige");

  // The verdict. Order matters — first match wins.
  let kind: string;
  if (critics >= 86 && ratio >= 1.6 && prestige >= 55) kind = "phenomenon";
  else if (ratio < 0.4 && budget >= 18_000_000) kind = "disaster";
  else if (ratio >= 2.0 && budget <= 15_000_000) kind = "breakout";
  else if (critics <= 40 && ratio >= 1.5) kind = "trash_hit";
  else if (critics >= 74 && ratio < 0.8) kind = "acclaimed_unseen";
  else if (critics >= 55 && critics < 74 && ratio < 0.75 && prestige >= 55) kind = "cult";
  else if (critics >= 70 && ratio >= 1.0) kind = "prestige";
  else if (ratio >= 1.3) kind = "solid_hit";
  else if (ratio >= 0.8) kind = "modest";
  else kind = "flop";

  let text: string;
  let note: string | undefined;
  const fx: Partial<CareerStats> = {};
  switch (kind) {
    case "phenomenon":
      text = `“${title}” doesn't just land — it detonates. Critics call it ${criticsPhrase(critics)}. Lines around the block, ${formatMoney(gross)} and counting. ${coName} tells the press it's the best work they've ever been part of.`;
      note = "Something just shifted. Permanently.";
      Object.assign(fx, {
        fame: 16, reputation: 12, industryRespect: 14, culturalImpact: 12,
        connections: 10, influence: 8, legacy: 6, ego: 8, publicPerception: 15,
      });
      break;
    case "disaster":
      text = `“${title}” opens on a Friday and is gone by the third weekend. ${formatMoney(gross)} against ${formatMoney(budget)} spent. The trades write the autopsy. ${coName} is "unavailable for comment". Soon, so are you.`;
      note = "Everyone in town watched this happen.";
      Object.assign(fx, {
        fame: -6, reputation: -10, industryRespect: -8, connections: -5,
        publicPerception: -12, financialRisk: 15, ego: -6,
      });
      break;
    case "breakout":
      text = `Made for ${formatMoney(budget)}, “${title}” catches fire — word of mouth does what marketing never could. ${formatMoney(gross)} and climbing. Everyone in town suddenly claims they saw it coming.`;
      note = "You are no longer a maybe.";
      Object.assign(fx, {
        fame: 15, reputation: 6, connections: 8, industryRespect: 5,
        publicPerception: 10, culturalImpact: 4, ego: 6,
      });
      break;
    case "trash_hit":
      text = `The critics are vicious — “${criticsPhrase(critics)}” is one of the kinder reviews. The audience does not care. “${title}” makes ${formatMoney(gross)}, and a sequel is discussed before the second weekend. You pretend not to hear the word "sellout".`;
      note = "Rich is its own kind of review.";
      Object.assign(fx, {
        fame: 14, reputation: -7, industryRespect: -4, connections: 6,
        publicPerception: 8, ego: 6, culturalImpact: 2,
      });
      break;
    case "acclaimed_unseen":
      text = `The reviews for “${title}” are the kind actors frame — critics call it ${criticsPhrase(critics)}. Almost nobody sees it: ${formatMoney(gross)} against ${formatMoney(budget)}. But in the rooms where careers are decided, your name now means something.`;
      note = "Hollywood is starting to take you seriously.";
      Object.assign(fx, {
        fame: 3, reputation: 12, industryRespect: 10, culturalImpact: 6,
        connections: 4, legacy: 3, publicPerception: 2,
      });
      break;
    case "cult":
      text = `“${title}” dies quietly in theaters — ${formatMoney(gross)} against ${formatMoney(budget)}. Then the midnight screenings start. Film students find it. The posters multiply in dorm rooms. Something underground is happening.`;
      note = "Some films are slow poison.";
      Object.assign(fx, {
        fame: 2, reputation: 8, culturalImpact: 10, legacy: 4,
        industryRespect: 4, connections: 3,
      });
      break;
    case "prestige":
      text = `“${title}” is the kind of success that ages well. Critics call it ${criticsPhrase(critics)}; it earns a respectable ${formatMoney(gross)}. Festival directors call. Come award season, your name is on a list.`;
      note = "Respect compounds quietly.";
      Object.assign(fx, {
        fame: 6, reputation: 10, industryRespect: 12, legacy: 4,
        connections: 5, culturalImpact: 5,
      });
      break;
    case "solid_hit":
      text = `“${title}” delivers — ${formatMoney(gross)} at the box office, reviews calling it ${criticsPhrase(critics)}. Nobody calls it art. Everybody returns your calls.`;
      Object.assign(fx, {
        fame: 9, connections: 5, reputation: 3, publicPerception: 6, influence: 3,
      });
      break;
    case "modest":
      text = `“${title}” comes and goes without scandal — ${formatMoney(gross)} against ${formatMoney(budget)}, critics calling it ${criticsPhrase(critics)}. Working careers are built out of films like this.`;
      Object.assign(fx, { fame: 3, connections: 2, reputation: 2 });
      break;
    default:
      text = `“${title}” sinks without much noise — ${formatMoney(gross)} against ${formatMoney(budget)}. Not a catastrophe. Just a film nobody needed. The phone stays quiet for a while.`;
      Object.assign(fx, {
        fame: -3, reputation: -3, connections: -2, publicPerception: -4,
      });
  }

  // The player gets paid either way — salary, plus backend on a hit.
  const salary =
    Math.round((budget * Math.min(0.06, 0.004 + (g.fame / 100) * 0.05)) / 100_000) * 100_000;
  let money = salary;
  if (ratio > 1.2) {
    money += Math.round(((gross - budget) * (0.05 + (g.influence / 100) * 0.05)) / 100_000) * 100_000;
  }
  // Established players co-finance. A disaster reaches their own pocket.
  let moneyPct: number | undefined;
  if (kind === "disaster" && g.fame >= 45) moneyPct = -(0.12 + rng() * 0.14);

  // Award season.
  let awardsDelta = 0;
  let oscarsDelta = 0;
  let respectBonus = 0;
  if (critics >= 78) awardsDelta += 1;
  if (critics >= 85 && prestige >= 60 && rng() < 0.18 + g.reputation / 400) {
    oscarsDelta = 1;
    awardsDelta += 1;
    respectBonus = 8;
  }

  // Common consequences of making a film at all.
  fx.movies = 1;
  fx.leadingRoles = 1;
  fx.burnout = (fx.burnout ?? 0) + randInt(rng, 6, 12);
  if (ratio >= 1.2) fx.successfulMovies = 1;
  if (ratio < 0.8) fx.failedMovies = 1;
  if (awardsDelta) fx.awards = (fx.awards ?? 0) + awardsDelta;
  if (oscarsDelta) fx.oscars = (fx.oscars ?? 0) + oscarsDelta;
  if (respectBonus) fx.industryRespect = (fx.industryRespect ?? 0) + respectBonus;

  // Concise memory. Flags feed eligibility today; the film record is the
  // seed for future callbacks (sequel, cult revival, reunion, fallout).
  const legendary = kind === "phenomenon" && g.reputation >= 45 && rng() < 0.5;
  const flags: CareerFlags = {
    madeAMovie: true,
    lastFilmTitle: title,
    lastFilmKind: kind,
  };
  if (kind === "trash_hit") flags["sequelInterest"] = true;
  if (kind === "cult") flags["cultClassic"] = true;
  if (kind === "disaster") flags["filmDisaster"] = true;
  if (legendary) flags["legendaryFilm"] = true;

  const film: FilmRecord = {
    title,
    screenplayId: sp?.id ?? "unknown",
    coStarId: co?.id ?? "unknown",
    coStar: coName,
    ageAtRelease: g.age,
    budget,
    gross,
    critics,
    kind,
    cult: kind === "cult",
    sequelInterest: kind === "trash_hit" || (kind === "solid_hit" && ratio >= 2),
    awards: awardsDelta,
    oscars: oscarsDelta,
  };

  return {
    outcome: {
      text,
      ...(note !== undefined ? { note } : {}),
      effects: fx,
      money,
      ...(moneyPct !== undefined ? { moneyPct } : {}),
      flags,
    },
    film,
  };
}

/* ------------------------------------------------------------------ */
/* The event                                                            */
/* ------------------------------------------------------------------ */

const movieGreenlight: GameEvent = {
  id: "movie_greenlight",
  place: "Los Angeles",
  text: (s) =>
    s.stats.movies === 0
      ? "A producer you barely know slides a folder across the table. “You'd carry it,” she says. Three screenplays, one greenlight — your first real film, and a say in how it gets made."
      : "The folder lands on the table again. Three screenplays, one greenlight. They want you to carry it — and they'll let you shape how it gets made.",
  minAge: 20,
  maxAge: 72,
  minStats: { fame: 6 },
  // Reachable in an ordinary healthy career; the rich-cadence boost in
  // pickEvent makes it surge after a run of quick choices.
  weight: (s) => (s.stats.fame >= 70 ? 6 : 9),
  repeatable: true,
  family: "production",
  tags: ["movie", "production", "chain"],
  sequence: {
    steps: [
      {
        kind: "pick",
        id: "screenplay",
        kicker: "The Screenplay",
        place: "The folder",
        prompt: "Three screenplays. You can only make one.",
        confirmVerb: "Greenlight",
        items: SCREENPLAYS,
      },
      {
        kind: "pick",
        id: "costar",
        kicker: "The Co-Star",
        place: "Casting",
        prompt: (ctx) =>
          `“${ctx.pickItems["screenplay"]?.title ?? "The film"}” needs a name opposite yours. Who do you call?`,
        confirmVerb: "Cast",
        items: ACTORS,
      },
      {
        kind: "allocation",
        id: "budget",
        kicker: "The Budget",
        place: "The spreadsheet",
        prompt: (ctx) =>
          `${formatMoney(chainNumbers(ctx).remaining)} left to spend. Every dollar goes somewhere — and no dollar goes everywhere.`,
        note: (ctx) => {
          const { co, budget, fee } = chainNumbers(ctx);
          return `Greenlight ${formatMoney(budget)} — ${co?.title ?? "Your co-star"} takes ${formatMoney(fee)} up front.`;
        },
        total: (ctx) => chainNumbers(ctx).remaining,
        categories: [
          {
            id: "cast",
            label: "Cast",
            description: "The ensemble around the two of you.",
            min: 5,
          },
          {
            id: "production",
            label: "Production",
            description: "Crew, locations, shooting days. What actually ends up on screen.",
            min: 5,
          },
          {
            id: "marketing",
            label: "Marketing",
            description: "Trailers, posters, festival buys. Being seen at all.",
            min: 5,
          },
        ],
      },
    ],
    resolve: resolveMovie,
  },
};

export const movieChainEvents: GameEvent[] = [movieGreenlight];
