/**
 * HOLLYWOOD — the post-Oscar layer.
 *
 * The first Oscar is a door, not a finish line. Everything here is gated
 * on `oscars >= 1`: bigger fees, prestige gambles, self-funded films,
 * company ownership, ego pressure, scandal at scale — and the decline /
 * downfall / comeback arcs that make a towering career feel losable.
 *
 * None of it is guaranteed or scheduled. Downfall emerges from choices,
 * hidden attributes and variance over time; `downfall` flags feed
 * comeback events instead of ending the run.
 */

import type { EventSequence, GameEvent } from "../types";
import { filmTitle, personName, studioName, variantRng } from "./fiction";

const VANITIES = [
  "a vineyard with unpronounceable soil",
  "a jet you would use six times a year",
  "a private island with staff you haven't met",
  "a sports franchise you don't fully understand",
  "a castle in a country whose language you don't speak",
] as const;

export const postOscarEvents: GameEvent[] = [
  /* ---------------------------------------------------------------- */
  /* The transition: the morning after the first Oscar.               */
  /* ---------------------------------------------------------------- */
  {
    id: "post_oscar_door",
    place: "The morning after",
    text: "The statue is on the kitchen table because you couldn't decide where it goes. Outside, the town has already recalculated your fee, your power and your margin for error. Everything is bigger now. Including the drop.",
    minStats: { oscars: 1 },
    weight: 30,
    once: true,
    family: "oscar_after",
    tags: ["awards", "transition"],
    options: [
      {
        label: "Step into it",
        outcomes: [
          {
            text: "From here, every room expects more of you — and pays accordingly. The higher floors have thinner air and weaker railings.",
            note: "The town only knows one direction. It measures everything else from there.",
            effects: { influence: 6, ego: 4 },
            flags: { postOscar: true },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Bigger fees, bigger targets.                                     */
  /* ---------------------------------------------------------------- */
  {
    id: "mega_fee_call",
    place: "Your agent",
    presentation: "call",
    text: (s) => {
      const r = variantRng(s, "mega_fee_call");
      return `It's ${studioName(r)}. They want you for ${filmTitle(r)} — the big one. Twenty million upfront. Your agent is already talking about the sequel.`;
    },
    minStats: { oscars: 1, fame: 40 },
    weight: 7,
    repeatable: true,
    family: "mega_offers",
    tags: ["money", "blockbuster"],
    options: [
      {
        label: "Take the role",
        hint: "$20M",
        chance: 0.7,
        modifiers: { luck: 0.2, reputation: 0.1 },
        outcomes: [
          {
            text: "Four months of green screens and green juices. The movie prints money; nobody remembers your scenes. The money remembers you.",
            money: 20_000_000,
            effects: { fame: 6, burnout: 8, reputation: -2, movies: 1, successfulMovies: 1 },
          },
          {
            text: "The movie opens to a shrug and a meme. Your face is on the poster, so the flop belongs to you.",
            money: 20_000_000,
            effects: { fame: -4, reputation: -6, publicPerception: -8, failedMovies: 1, movies: 1 },
          },
        ],
      },
      {
        label: "Pass",
        outcomes: [
          {
            text: "Your agent goes quiet for a week. The role goes to someone cheaper and younger.",
            effects: { reputation: 3, ego: -2 },
          },
        ],
      },
    ],
  },
  {
    id: "auteur_offer",
    place: "Los Angeles",
    text: (s) => {
      const r = variantRng(s, "auteur_offer");
      return `${personName(r)} wants you for something difficult. No money in it, a four-month shoot, and everyone who has read the script says it's either genius or unwatchable.`;
    },
    minStats: { oscars: 1, talent: 45 },
    weight: 6,
    repeatable: true,
    family: "prestige",
    tags: ["awards", "risk", "lead"],
    options: [
      {
        label: "Commit completely",
        hint: "Dangerous",
        danger: true,
        chance: 0.48,
        modifiers: { talent: 0.3, luck: 0.15, burnout: -0.2 },
        outcomes: [
          {
            text: "The film premieres and the room stands for eleven minutes. The word that rhymes with 'Schmoscar' is spoken again — louder this time.",
            effects: {
              industryRespect: 14,
              reputation: 12,
              legacy: 8,
              burnout: 15,
              culturalImpact: 6,
              movies: 1,
              leadingRoles: 1,
              successfulMovies: 1,
            },
            flags: { oscarBuzz: true },
          },
          {
            text: "It was unwatchable. The standing ovation was for the catering. You gave it four months you'll never get back.",
            effects: { burnout: 22, reputation: -6, failedMovies: 1, movies: 1, leadingRoles: 1 },
          },
        ],
      },
      {
        label: "Pass on it",
        outcomes: [
          {
            text: "Someone braver takes the part. You don't ask how it went.",
            effects: { burnout: -4, ego: -2 },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Self-funded film: the biggest single bet in the game.            */
  /* ---------------------------------------------------------------- */
  {
    id: "self_funded_film",
    place: "Your own money",
    text: (s) => {
      const r = variantRng(s, "self_funded_film");
      return `Nobody will make ${filmTitle(r)}. You've shown the script to everyone; everyone has passed. You keep reading it at night. Making it yourself would cost about ten million.`;
    },
    minStats: { oscars: 1, money: 10_000_000 },
    weight: 6,
    repeatable: true,
    family: "selffund",
    tags: ["risk", "money", "lead"],
    options: [
      {
        label: "Fund it yourself",
        hint: "All in",
        danger: true,
        chance: 0.35,
        modifiers: { talent: 0.25, luck: 0.2, industryRespect: 0.1 },
        outcomes: [
          {
            text: "You bet on yourself and the bet lands. The film finds its audience, and the town has to recalculate what you are.",
            note: "Ownership is the only fee that compounds.",
            moneyPct: 0.3,
            effects: {
              successfulMovies: 1,
              movies: 1,
              culturalImpact: 10,
              industryRespect: 10,
              legacy: 8,
              reputation: 8,
            },
            flags: { selfFundedHit: true },
          },
          {
            text: "The film opens empty. Ten million dollars of your own money, gone in a weekend. The town smells blood.",
            money: -10_000_000,
            effects: { failedMovies: 1, movies: 1, publicPerception: -6, ego: -5 },
            flags: { downfall: true },
          },
        ],
      },
      {
        label: "Shelve it",
        outcomes: [
          {
            text: "The script goes in a drawer. Some nights you still think about it.",
            effects: { burnout: -3, ego: -2 },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Company ownership.                                               */
  /* ---------------------------------------------------------------- */
  {
    id: "production_company",
    place: "Los Angeles",
    text: "Every major star eventually faces the same fork: keep selling your time, or start owning the product. A company of your own — development, overhead, staff — would cost about $10M before it earns a dollar.",
    minStats: { oscars: 1, money: 20_000_000 },
    weight: 6,
    once: true,
    family: "company",
    tags: ["money", "power"],
    options: [
      {
        label: "Found the company",
        hint: "-$10M",
        danger: true,
        outcomes: [
          {
            text: "The letterhead arrives. You are no longer just talent — you are an employer, a buyer, a target.",
            money: -10_000_000,
            effects: { influence: 12, financialRisk: 15, connections: 6 },
            flags: { productionCompany: true },
          },
        ],
      },
      {
        label: "Stay for hire",
        outcomes: [
          {
            text: "You keep your freedom and your weekends. Someone else owns the shelves.",
            effects: { financialRisk: -3 },
          },
        ],
      },
    ],
  },
  {
    id: "company_slate",
    place: "Your company",
    text: (s) => {
      const r = variantRng(s, "company_slate");
      return `A slate decision lands on your desk. ${personName(r)} is attached, the script is ${filmTitle(r)}, and the numbers only work if the film works.`;
    },
    requiresFlags: { productionCompany: true },
    weight: 7,
    repeatable: true,
    family: "company",
    tags: ["money", "power", "risk"],
    options: [
      {
        label: "Greenlight it",
        hint: "50%",
        chance: 0.5,
        modifiers: { influence: 0.2, luck: 0.2 },
        outcomes: [
          {
            text: "The film over-performs. Your company is suddenly real, and the town returns your calls faster.",
            money: 12_000_000,
            effects: { influence: 5, industryRespect: 3 },
          },
          {
            text: "The film dies on arrival. The overhead doesn't. Being the boss means the losses have your name on them.",
            money: -9_000_000,
            effects: { reputation: -4, publicPerception: -4 },
          },
        ],
      },
      {
        label: "Pass",
        outcomes: [
          {
            text: "Discipline is a strategy too. The slate stays lean.",
            effects: { financialRisk: -2 },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Ego and scandal at scale.                                        */
  /* ---------------------------------------------------------------- */
  {
    id: "ego_spiral",
    place: "On set",
    text: "A story is going around: you fired a cinematographer mid-take, or made an assistant fly back for the right water, or refused to leave the trailer. Depending on who tells it, you're a perfectionist or a monster.",
    minStats: { oscars: 1, ego: 65 },
    weight: 6,
    repeatable: true,
    family: "ego",
    tags: ["ego", "reputation"],
    options: [
      {
        label: "Get ahead of it — apologize",
        outcomes: [
          {
            text: "You buy the crew a very expensive lunch and mean it. The story deflates.",
            money: -100_000,
            effects: { ego: -6, reputation: 4, publicPerception: 5 },
          },
        ],
      },
      {
        label: "Let them talk",
        hint: "Risky",
        danger: true,
        chance: 0.4,
        modifiers: { fame: 0.15, luck: 0.2 },
        outcomes: [
          {
            text: "The story becomes legend. Difficult geniuses are a genre, and you just joined it.",
            effects: { culturalImpact: 8, fame: 6, ego: 8 },
          },
          {
            text: "The story hardens into reputation. Good people stop wanting to work with you.",
            effects: { publicPerception: -14, connections: -10, reputation: -6 },
            flags: { downfall: true },
          },
        ],
      },
    ],
  },
  {
    id: "scandal_call",
    place: "A journalist",
    presentation: "call",
    text: "She's calling as a courtesy: tomorrow's story involves you, a hotel suite, and a version of events that is roughly half true. She's giving you a chance to comment.",
    minStats: { oscars: 1, fame: 55 },
    weight: 5,
    repeatable: true,
    family: "scandal",
    tags: ["scandal", "reputation"],
    options: [
      {
        label: "Lawyer up",
        hint: "-$2M",
        chance: 0.6,
        modifiers: { connections: 0.2 },
        outcomes: [
          {
            text: "The story dies quietly in a lawyer's outbox. It cost you two million and a favor.",
            money: -2_000_000,
          },
          {
            text: "The story runs anyway, now with 'no comment' appended. Half true is true enough.",
            money: -2_000_000,
            effects: { publicPerception: -10, reputation: -3 },
          },
        ],
      },
      {
        label: "Give the quote",
        hint: "Risky",
        danger: true,
        chance: 0.5,
        modifiers: { ego: 0.1, luck: 0.15 },
        outcomes: [
          {
            text: "You disarm it with honesty and one very good joke. The piece makes you sound human.",
            effects: { publicPerception: 5 },
          },
          {
            text: "The quote makes it worse. The quote always makes it worse.",
            effects: { publicPerception: -12, reputation: -4 },
          },
        ],
      },
    ],
  },
  {
    id: "rival_call",
    place: "An old rival",
    presentation: "call",
    text: "It's her. Twenty years of competing for the same parts, the same covers, the same table at the same restaurant. She says she's calling to bury the hatchet. Her voice suggests the hatchet is still in her hand.",
    minStats: { oscars: 1, fame: 50 },
    weight: 4,
    once: true,
    family: "ego",
    tags: ["ego", "relationships"],
    options: [
      {
        label: "Make peace",
        outcomes: [
          {
            text: "Lunch happens. It's genuinely nice. Twenty years of rivalry dissolve into one long conversation about the old days.",
            effects: { connections: 6, ego: -3, publicPerception: 2 },
          },
        ],
      },
      {
        label: "Hang up",
        chance: 0.5,
        outcomes: [
          {
            text: "You hang up. She tells everyone. Somehow it plays well — people respect a grudge held properly.",
            effects: { ego: 5 },
          },
          {
            text: "You hang up. She tells everyone. The story writes itself: bitter, declining, alone.",
            effects: { publicPerception: -6, reputation: -3 },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Money: taxes, vanity, legacy.                                    */
  /* ---------------------------------------------------------------- */
  {
    id: "tax_audit",
    place: "Certified letters",
    text: "Your accountants were 'aggressive'. The government would like to discuss several years of aggressive. The letters are getting shorter and more formal.",
    minStats: { oscars: 1, money: 5_000_000 },
    weight: 4,
    repeatable: true,
    family: "money",
    tags: ["money", "risk"],
    options: [
      {
        label: "Settle quietly",
        hint: "Expensive",
        danger: true,
        outcomes: [
          {
            text: "You write the check. It hurts. It also ends.",
            moneyPct: -0.12,
            effects: { publicPerception: -2 },
          },
        ],
      },
      {
        label: "Fight it",
        chance: 0.45,
        modifiers: { luck: 0.25 },
        outcomes: [
          {
            text: "Your lawyers prove the errors were the accountants'. You escape with a fine and a new accounting firm.",
            money: -500_000,
            effects: { reputation: -2 },
          },
          {
            text: "The judgment is brutal, and public. The headline has your name and a number with many zeros.",
            moneyPct: -0.22,
            effects: { publicPerception: -8, reputation: -4 },
          },
        ],
      },
    ],
  },
  {
    id: "vanity_purchase",
    place: "A private viewing",
    text: (s) => {
      const r = variantRng(s, "vanity_purchase");
      const item = VANITIES[Math.floor(r() * VANITIES.length)]!;
      return `You are being shown ${item}. The number is $25M. Your business manager is very carefully not looking at you.`;
    },
    minStats: { money: 25_000_000 },
    weight: 4,
    repeatable: true,
    family: "money",
    tags: ["money", "ego"],
    options: [
      {
        label: "Buy it",
        hint: "-$25M",
        danger: true,
        outcomes: [
          {
            text: "It's yours. The maintenance arrives monthly, forever.",
            money: -25_000_000,
            effects: { ego: 8, financialRisk: 8, publicPerception: 3 },
          },
        ],
      },
      {
        label: "Walk away",
        outcomes: [
          {
            text: "You keep the money, and the mystery of what it would have felt like.",
            effects: { financialRisk: -3, ego: -2 },
          },
        ],
      },
    ],
  },
  {
    id: "legacy_foundation",
    place: "Your lawyer's office",
    text: "Your lawyer floats an idea usually reserved for the dead: a foundation in your name. Scholarships, restorations, a theater with your name above the door.",
    minStats: { oscars: 1, money: 40_000_000 },
    weight: 4,
    once: true,
    family: "money",
    tags: ["money", "legacy"],
    options: [
      {
        label: "Endow it",
        hint: "-$15M",
        outcomes: [
          {
            text: "Fifteen million becomes a name on a building and a hundred scholarships a year. It will outlast the films.",
            money: -15_000_000,
            effects: { legacy: 12, culturalImpact: 8, publicPerception: 10 },
          },
        ],
      },
      {
        label: "Not yet",
        outcomes: [
          {
            text: "Later, you say. Everyone says later.",
            effects: { ego: 2 },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Decline and comeback — the arc that makes height meaningful.     */
  /* ---------------------------------------------------------------- */
  {
    id: "phone_slows",
    place: "Los Angeles",
    text: "The calls have slowed. Not stopped — slowed. The parts going to people your age are mentors, judges, grandparents. The industry has started speaking about you in the past tense.",
    minStats: { oscars: 1 },
    maxStats: { fame: 55 },
    weight: 9,
    repeatable: true,
    family: "decline",
    tags: ["decline", "risk"],
    options: [
      {
        label: "Reinvent yourself",
        chance: 0.4,
        modifiers: { talent: 0.25, luck: 0.2 },
        outcomes: [
          {
            text: "You take a role nobody expected — smaller, stranger, better. The reviews use the word 'revelation'.",
            effects: { fame: 10, reputation: 8, industryRespect: 6, movies: 1, successfulMovies: 1 },
            flags: { comeback: true },
          },
          {
            text: "The reinvention reads as desperation. The town looks away politely.",
            effects: { fame: -6, burnout: 10, publicPerception: -4 },
          },
        ],
      },
      {
        label: "Retreat gracefully",
        outcomes: [
          {
            text: "You buy beautiful things and learn to cook. The phone stays quiet, but so do you.",
            effects: { reputation: 3, burnout: -8, fame: -4 },
          },
        ],
      },
      {
        label: "Rage at the dying light",
        hint: "Dangerous",
        danger: true,
        outcomes: [
          {
            text: "You give interviews. You name names. It feels magnificent for about a week.",
            effects: { ego: 8, publicPerception: -8, connections: -6 },
          },
        ],
      },
    ],
  },
  {
    id: "comeback_role",
    place: "A small production office",
    text: (s) => {
      const r = variantRng(s, "comeback_role");
      return `A young director named ${personName(r)} wants you — specifically you, specifically now, because of what you used to be and what it might still mean. The pay is nothing. The risk is everything.`;
    },
    requiresFlags: { downfall: true },
    weight: 14,
    repeatable: true,
    family: "comeback",
    tags: ["comeback", "risk", "lead"],
    options: [
      {
        label: "Take the role",
        chance: 0.45,
        modifiers: { talent: 0.3, luck: 0.2 },
        outcomes: [
          {
            text: "The performance lands like a thunderclap. 'Welcome back,' the reviews say, as if you never left. You did. But now you're not gone.",
            note: "The town loves a second act almost as much as it loves a collapse.",
            effects: {
              fame: 12,
              reputation: 10,
              industryRespect: 6,
              movies: 1,
              successfulMovies: 1,
              leadingRoles: 1,
            },
            flags: { downfall: false, comeback: true },
          },
          {
            text: "The comeback that wasn't. The reviews are kind, which is worse.",
            effects: { fame: -8, publicPerception: -5, burnout: 12 },
          },
        ],
      },
      {
        label: "Decline",
        outcomes: [
          {
            text: "You're not ready to find out what's left. Maybe next year.",
            effects: { burnout: -5, ego: -3 },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* The contract fork — a one-step sequence using the CONTRACT pick  */
  /* treatment. Three deals, three different shapes of risk.          */
  /* ---------------------------------------------------------------- */
  {
    id: "studio_contracts",
    place: "The negotiation",
    text: "Three deals land on the same Friday. Your agent calls it a good problem. It doesn't feel like a problem; it feels like a fork.",
    minStats: { oscars: 1, fame: 45 },
    weight: 7,
    once: true,
    family: "mega_offers",
    tags: ["money", "contract", "lead"],
    sequence: contractSequence(),
  },
];

function contractSequence(): EventSequence {
  return {
    steps: [
      {
        kind: "pick",
        id: "contract",
        kicker: "The offers",
        variant: "contract",
        prompt: "Three memos. Sign one.",
        items: [
          {
            id: "upfront",
            subtitle: "Meridian Pictures",
            title: "Silent Parade",
            description:
              "Franchise sequel. Six-month shoot, two continents, a lot of wire work. The fee is the point.",
            traits: [
              { label: "Fee", value: "$24M upfront", tone: "gold" },
              { label: "Backend", value: "None" },
              { label: "Creative control", value: "None" },
            ],
          },
          {
            id: "backend",
            subtitle: "Northlight Pictures",
            title: "The Burning Divide",
            description:
              "Original thriller from a hot writer. Small fee, real backend. You'd be betting on the audience.",
            traits: [
              { label: "Fee", value: "$6M" },
              { label: "Backend", value: "12% of gross", tone: "gold" },
              { label: "Creative control", value: "Casting say" },
            ],
          },
          {
            id: "prestige",
            subtitle: "The Foundry",
            title: "Paper Winter",
            description:
              "An auteur, a glacier, a role actors would kill for. Scale pay. Awards are the only currency.",
            traits: [
              { label: "Fee", value: "$1M (scale)" },
              { label: "Backend", value: "None" },
              { label: "Creative control", value: "Full partner", tone: "gold" },
            ],
          },
        ],
      },
    ],
    resolve: (ctx) => {
      const pick = ctx.picks["contract"] ?? "upfront";
      const roll = ctx.rng();
      const age = ctx.game.stats.age + 1;

      if (pick === "backend") {
        const hit = roll < 0.42;
        if (hit) {
          const backend = Math.round((18 + ctx.rng() * 40)) * 1_000_000;
          return {
            outcome: {
              text: "The thriller opens huge and legs out for months. The backend points turn out to be worth more than any fee you've ever taken.",
              note: "You bet on the audience. The audience showed up.",
              money: 6_000_000 + backend,
              effects: { fame: 8, successfulMovies: 1, movies: 1, financialRisk: 5 },
            },
            film: {
              title: "The Burning Divide",
              screenplayId: "external",
              coStarId: "ensemble",
              coStar: "Ensemble cast",
              ageAtRelease: age,
              budget: 45_000_000,
              gross: 300_000_000,
              critics: 74,
              kind: "sleeper_hit",
            },
          };
        }
        return {
          outcome: {
            text: "Twelve percent of nothing is nothing. The movie vanishes in two weeks, and the 'smart money' move becomes a cautionary story your agent tells other clients.",
            money: 6_000_000,
            effects: { failedMovies: 1, movies: 1, publicPerception: -4, ego: -4 },
          },
          film: {
            title: "The Burning Divide",
            screenplayId: "external",
            coStarId: "ensemble",
            coStar: "Ensemble cast",
            ageAtRelease: age,
            budget: 45_000_000,
            gross: 38_000_000,
            critics: 52,
            kind: "vanished",
          },
        };
      }

      if (pick === "prestige") {
        const triumph = roll < 0.5;
        if (triumph) {
          return {
            outcome: {
              text: "The glacier shoot breaks you down to nothing and builds something else. Critics run out of superlatives. The whispers start again.",
              money: 1_000_000,
              effects: {
                reputation: 14,
                industryRespect: 12,
                legacy: 8,
                burnout: 14,
                successfulMovies: 1,
                movies: 1,
                leadingRoles: 1,
              },
              flags: { oscarBuzz: true },
            },
            film: {
              title: "Paper Winter",
              screenplayId: "external",
              coStarId: "ensemble",
              coStar: "Ensemble cast",
              ageAtRelease: age,
              budget: 30_000_000,
              gross: 60_000_000,
              critics: 92,
              kind: "prestige",
            },
          };
        }
        return {
          outcome: {
            text: "Beautiful, glacial, unwatched. The craft was real; the audience wasn't.",
            money: 1_000_000,
            effects: { reputation: 4, burnout: 10, movies: 1, leadingRoles: 1, failedMovies: 1 },
          },
          film: {
            title: "Paper Winter",
            screenplayId: "external",
            coStarId: "ensemble",
            coStar: "Ensemble cast",
            ageAtRelease: age,
            budget: 30_000_000,
            gross: 12_000_000,
            critics: 68,
            kind: "quiet",
          },
        };
      }

      // upfront — franchise money, franchise risk
      const hit = roll < 0.55;
      if (hit) {
        return {
          outcome: {
            text: "Six months, two continents, one enormous paycheck. The film does exactly what it was engineered to do, and your bank account sends a thank-you note.",
            money: 24_000_000,
            effects: { fame: 6, burnout: 10, movies: 1, successfulMovies: 1 },
          },
          film: {
            title: "Silent Parade",
            screenplayId: "studio",
            coStarId: "ensemble",
            coStar: "Ensemble cast",
            ageAtRelease: age,
            budget: 190_000_000,
            gross: 680_000_000,
            critics: 58,
            kind: "workhorse",
          },
        };
      }
      return {
        outcome: {
          text: "The franchise is out of steam. The check clears; the reviews don't. You are the face of something people are tired of.",
          money: 24_000_000,
          effects: { reputation: -5, publicPerception: -5, movies: 1, failedMovies: 1 },
        },
        film: {
          title: "Silent Parade",
          screenplayId: "studio",
          coStarId: "ensemble",
          coStar: "Ensemble cast",
          ageAtRelease: age,
          budget: 190_000_000,
          gross: 210_000_000,
          critics: 34,
          kind: "franchise_flop",
        },
      };
    },
  };
}

