/**
 * CAREER EVENTS — the turns between films.
 *
 * These are the crises you can sometimes talk your way out of, and the
 * opportunities that only arrive once you have something to lose. Every
 * event is drawn from the career's live pressure, fires at most once per
 * run, and always resolves into a visible consequence.
 */

import type { DirectorCareer } from "./types";
import type { PressureFamily, PressureMap } from "./pressure";

export interface EventEffects {
  /** Flat dollars added to net worth. */
  money?: number;
  /** Share of positive net worth taken (0-1). Applied after `money`. */
  moneyPct?: number;
  reputation?: number;
  recognition?: number;
  studioTrust?: number;
  prestige?: number;
  momentum?: number;
  /** Tabloid / behaviour heat. Feeds scandal pressure. */
  instability?: number;
  /** Time this choice burns. */
  months?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  detail: string;
  tone?: "safe" | "bold" | "danger";
  /** Chance the choice goes wrong (0-1). */
  risk?: number;
  outcome: string;
  effects: EventEffects;
  failOutcome?: string;
  failEffects?: EventEffects;
}

export interface CareerEvent {
  id: string;
  family: PressureFamily;
  kind: "crisis" | "opportunity" | "life";
  tag: string;
  headline: string;
  situation: string;
  choices: EventChoice[];
  when: (c: DirectorCareer, p: PressureMap) => boolean;
  weight: (c: DirectorCareer, p: PressureMap) => number;
}

const money = (c: DirectorCareer) => c.money;
const films = (c: DirectorCareer) => c.films.length;

export const CAREER_EVENTS: CareerEvent[] = [
  /* ---------------- financial ---------------- */
  {
    id: "fin-tax",
    family: "financial",
    kind: "crisis",
    tag: "Audit",
    headline: "The letter is from the IRS",
    situation:
      "Three years of loan-outs, per diems and a boat that was somehow a production expense. They would like a word.",
    when: (c) => films(c) >= 3,
    weight: (_c, p) => 1 + p.financial / 40,
    choices: [
      {
        id: "settle",
        label: "Settle quietly",
        detail: "Pay it, sign the NDA, never speak of the boat again.",
        tone: "safe",
        outcome: "The number hurts. Nobody ever hears about it.",
        effects: { moneyPct: 0.22, money: -120_000 },
      },
      {
        id: "fight",
        label: "Fight it",
        detail: "Your lawyer says the boat is defensible. Your lawyer is expensive.",
        tone: "bold",
        risk: 0.45,
        outcome: "You win on a technicality and dine out on the story for a year.",
        effects: { money: -180_000, momentum: 6 },
        failOutcome: "You lose, publicly, and the penalties are worse than the bill.",
        failEffects: { moneyPct: 0.4, money: -400_000, instability: 12, reputation: -4 },
      },
    ],
  },
  {
    id: "fin-manager",
    family: "financial",
    kind: "crisis",
    tag: "Betrayal",
    headline: "Your business manager has moved to a country without extradition",
    situation: "So has a meaningful portion of your net worth.",
    when: (c) => money(c) > 2_000_000,
    weight: (_c, p) => 0.7 + p.financial / 60,
    choices: [
      {
        id: "chase",
        label: "Hire investigators",
        detail: "Throw money at getting money back.",
        tone: "bold",
        risk: 0.55,
        outcome: "They find him. Most of it comes home.",
        effects: { moneyPct: -0.12, money: -250_000 },
        failOutcome: "Two years of invoices and no forwarding address.",
        failEffects: { moneyPct: 0.3, money: -300_000, months: 4 },
      },
      {
        id: "eat",
        label: "Eat the loss",
        detail: "Work is cheaper than litigation.",
        tone: "safe",
        outcome: "You write it off and go back to the desk with something to prove.",
        effects: { moneyPct: 0.25, momentum: 5 },
      },
    ],
  },

  /* ---------------- studio ---------------- */
  {
    id: "stu-notes",
    family: "studio",
    kind: "crisis",
    tag: "Notes",
    headline: "The studio wants a new third act",
    situation: "They tested it. The card said 'confusing'. They have a suggestion involving a helicopter.",
    when: (c) => films(c) >= 2,
    weight: (_c, p) => 1.2 + p.studio / 40,
    choices: [
      {
        id: "comply",
        label: "Shoot the helicopter",
        detail: "Keep the studio close.",
        tone: "safe",
        outcome: "The helicopter tests beautifully. You never watch that cut again.",
        effects: { studioTrust: 12, reputation: -5, prestige: -4, momentum: 4 },
      },
      {
        id: "refuse",
        label: "Refuse the note",
        detail: "It's your cut or nothing.",
        tone: "danger",
        risk: 0.5,
        outcome: "You win the standoff. The town notices someone finally said no.",
        effects: { reputation: 8, prestige: 6, studioTrust: -6, instability: 5 },
        failOutcome: "They recut it without you and remove your name from the trailer.",
        failEffects: { studioTrust: -20, reputation: -3, momentum: -18, instability: 10 },
      },
    ],
  },
  {
    id: "stu-regime",
    family: "studio",
    kind: "crisis",
    tag: "Regime change",
    headline: "Your champion has been walked out of the building",
    situation: "The new head of production inherited your project and does not love it.",
    when: (c) => films(c) >= 2,
    weight: (_c, p) => 1 + p.studio / 50,
    choices: [
      {
        id: "charm",
        label: "Charm the new regime",
        detail: "Dinner, flattery, a rewritten pitch.",
        tone: "safe",
        risk: 0.35,
        outcome: "They keep you on. Slightly cheaper, but on.",
        effects: { studioTrust: 8, months: 3 },
        failOutcome: "They pass, warmly, and the project dies in a drawer.",
        failEffects: { studioTrust: -8, momentum: -12, months: 7 },
      },
      {
        id: "walk",
        label: "Take it elsewhere",
        detail: "Someone in this town still has taste.",
        tone: "bold",
        risk: 0.5,
        outcome: "A rival buys it in a week. Your leverage doubles.",
        effects: { momentum: 14, studioTrust: -4, reputation: 4 },
        failOutcome: "Nobody bites. You spend a year in turnaround limbo.",
        failEffects: { momentum: -16, months: 10, studioTrust: -6 },
      },
    ],
  },

  /* ---------------- scandal ---------------- */
  {
    id: "sca-set",
    family: "scandal",
    kind: "crisis",
    tag: "On set",
    headline: "A crew member recorded you shouting",
    situation: "It is forty seconds long, it is on the internet, and you do sound exactly like that.",
    when: (c) => films(c) >= 2,
    weight: (c, p) => 0.8 + p.scandal / 35 + (c.recognition >= 55 ? 0.6 : 0),
    choices: [
      {
        id: "apologise",
        label: "Apologise properly",
        detail: "Statement, meeting, a real one.",
        tone: "safe",
        outcome: "The cycle passes in nine days. The clip stays, but so do you.",
        effects: { instability: -6, recognition: 3, reputation: -2, momentum: -4 },
      },
      {
        id: "double",
        label: "Say the set is not a democracy",
        detail: "Some people love a tyrant.",
        tone: "danger",
        risk: 0.55,
        outcome: "It becomes folklore. Actors start asking to work with you.",
        effects: { reputation: 6, recognition: 8, instability: 8 },
        failOutcome: "Three more people come forward with worse clips.",
        failEffects: { instability: 26, studioTrust: -14, reputation: -10 },
      },
    ],
  },
  {
    id: "sca-star",
    family: "scandal",
    kind: "crisis",
    tag: "Your lead",
    headline: "Your lead has been arrested at four in the morning",
    situation: "The film is nine days from a marketing launch nobody can move.",
    when: (c) => films(c) >= 3,
    weight: (_c, p) => 0.9 + p.scandal / 45,
    choices: [
      {
        id: "stand",
        label: "Stand by them",
        detail: "Loyalty is a currency here.",
        tone: "bold",
        risk: 0.45,
        outcome: "They get clean, thank you on a stage, and never forget it.",
        effects: { reputation: 8, instability: 4, momentum: 6 },
        failOutcome: "They relapse spectacularly and take the release with them.",
        failEffects: { instability: 18, studioTrust: -12, momentum: -20 },
      },
      {
        id: "cut",
        label: "Cut them out of the campaign",
        detail: "Protect the picture.",
        tone: "safe",
        outcome: "The film opens clean. The actor's agency remembers.",
        effects: { studioTrust: 8, reputation: -6, instability: -4 },
      },
    ],
  },
  {
    id: "sca-feud",
    family: "scandal",
    kind: "crisis",
    tag: "Feud",
    headline: "A rival called your last film 'furniture'",
    situation: "In print. With your name spelled correctly, which somehow makes it worse.",
    when: (c) => films(c) >= 3,
    weight: (c) => (c.recognition >= 40 ? 1.2 : 0.5),
    choices: [
      {
        id: "silent",
        label: "Say nothing",
        detail: "Let the work answer.",
        tone: "safe",
        outcome: "The story dies alone. Two directors quietly take your side.",
        effects: { reputation: 4, momentum: 2 },
      },
      {
        id: "war",
        label: "Go to war",
        detail: "You have a podcast booking and no impulse control.",
        tone: "danger",
        risk: 0.5,
        outcome: "You are extremely funny about it. The clip outperforms both films.",
        effects: { recognition: 10, momentum: 12, instability: 7 },
        failOutcome: "You come off unhinged and the quote follows you for a decade.",
        failEffects: { reputation: -9, instability: 16, studioTrust: -8 },
      },
    ],
  },

  /* ---------------- irrelevance ---------------- */
  {
    id: "irr-tv",
    family: "irrelevance",
    kind: "crisis",
    tag: "The offer nobody brags about",
    headline: "Eight episodes of a streaming procedural",
    situation: "The money is real. The credit is a footnote in someone else's show.",
    when: (c) => films(c) >= 3,
    weight: (_c, p) => 0.8 + p.irrelevance / 30,
    choices: [
      {
        id: "take",
        label: "Take the job",
        detail: "Rent is rent.",
        tone: "safe",
        outcome: "You direct it well. Nobody notices, and the account refills.",
        effects: { money: 900_000, months: 8, prestige: -5, studioTrust: 5, recognition: -2 },
      },
      {
        id: "pass",
        label: "Pass",
        detail: "You are a filmmaker, allegedly.",
        tone: "bold",
        outcome: "You keep the identity and lose the year.",
        effects: { months: 9, money: -60_000, prestige: 3, momentum: -8 },
      },
    ],
  },
  {
    id: "irr-teaching",
    family: "irrelevance",
    kind: "life",
    tag: "Faculty",
    headline: "A film school wants you to teach a masterclass",
    situation: "The invitation uses the phrase 'a career worth reflecting on', past tense.",
    when: (c) => films(c) >= 4,
    weight: (_c, p) => 0.6 + p.irrelevance / 40,
    choices: [
      {
        id: "teach",
        label: "Teach the term",
        detail: "Twenty-two students who have not seen your films.",
        tone: "safe",
        outcome: "One of them is genuinely brilliant. You feel old and useful.",
        effects: { money: 140_000, months: 6, reputation: 4, momentum: -4 },
      },
      {
        id: "decline",
        label: "Decline politely",
        detail: "Reflection is for people who are finished.",
        tone: "bold",
        outcome: "You go back to the desk and write something with teeth.",
        effects: { months: 2, prestige: 3, momentum: 5 },
      },
    ],
  },

  /* ---------------- excess ---------------- */
  {
    id: "exc-plane",
    family: "excess",
    kind: "life",
    tag: "Purchase",
    headline: "There is a plane for sale and you are being shown it",
    situation: "The broker keeps saying 'at your level'. It is working.",
    when: (c) => money(c) >= 25_000_000,
    weight: (_c, p) => 0.9 + p.excess / 40,
    choices: [
      {
        id: "buy",
        label: "Buy the plane",
        detail: "You have earned exactly this.",
        tone: "danger",
        outcome: "It is glorious. The running costs are a second mortgage with wings.",
        effects: { moneyPct: 0.3, recognition: 6, instability: 9, momentum: 4 },
      },
      {
        id: "decline",
        label: "Charter instead",
        detail: "Boring. Correct.",
        tone: "safe",
        outcome: "Your accountant sends a rare, warm email.",
        effects: { money: -400_000, instability: -4 },
      },
    ],
  },
  {
    id: "exc-vanity",
    family: "excess",
    kind: "crisis",
    tag: "The passion project",
    headline: "You want to make the four-hour one",
    situation: "No studio will pay for it. You have noticed that you could.",
    when: (c) => money(c) >= 20_000_000 && films(c) >= 5,
    weight: (_c, p) => 1 + p.obsession / 30,
    choices: [
      {
        id: "fund",
        label: "Fund it yourself",
        detail: "Every cent is yours. So is every frame.",
        tone: "danger",
        risk: 0.6,
        outcome: "It plays two festivals and is called a masterpiece by people who matter.",
        effects: { moneyPct: 0.45, prestige: 16, reputation: 12, recognition: 4 },
        failOutcome: "It never gets a distributor. The negative sits in a vault you rent.",
        failEffects: { moneyPct: 0.55, prestige: 4, momentum: -18, instability: 10, months: 9 },
      },
      {
        id: "shelve",
        label: "Shelve it",
        detail: "Again.",
        tone: "safe",
        outcome: "You put the script back in the drawer. It is not the first time.",
        effects: { momentum: -5, prestige: -2 },
      },
    ],
  },

  /* ---------------- obsession / burnout ---------------- */
  {
    id: "bur-health",
    family: "burnout",
    kind: "crisis",
    tag: "Health",
    headline: "You fainted at the monitor",
    situation: "The medic says the words 'sustained stress' and someone films it on a phone.",
    when: (c) => films(c) >= 5,
    weight: (_c, p) => 0.9 + p.burnout / 35,
    choices: [
      {
        id: "rest",
        label: "Take six months off",
        detail: "The industry will survive without you. Probably.",
        tone: "safe",
        outcome: "You come back slower, clearer, and slightly forgotten.",
        effects: { months: 7, recognition: -6, momentum: -8, instability: -10 },
      },
      {
        id: "push",
        label: "Finish the shoot",
        detail: "Twelve days left.",
        tone: "danger",
        risk: 0.4,
        outcome: "You finish it. The footage is the best you have ever shot.",
        effects: { prestige: 6, reputation: 5, instability: 8 },
        failOutcome: "You collapse again and the insurer takes the film away from you.",
        failEffects: { studioTrust: -16, instability: 20, momentum: -20, months: 5 },
      },
    ],
  },
  {
    id: "bur-family",
    family: "burnout",
    kind: "life",
    tag: "Home",
    headline: "You missed it again",
    situation: "A birthday, a recital, a funeral — the calendar has stopped pretending you attend things.",
    when: (c) => films(c) >= 4,
    weight: (_c, p) => 0.8 + p.burnout / 45,
    choices: [
      {
        id: "home",
        label: "Go home for a while",
        detail: "Turn the phone off.",
        tone: "safe",
        outcome: "Something repairs. The work waits, badly.",
        effects: { months: 5, momentum: -7, instability: -12 },
      },
      {
        id: "work",
        label: "Stay in the edit",
        detail: "You can fix a family later. You cannot fix a release date.",
        tone: "danger",
        outcome: "The cut gets sharper. The house gets quieter.",
        effects: { prestige: 4, instability: 11 },
      },
    ],
  },

  /* ---------------- opportunities ---------------- */
  {
    id: "opp-franchise",
    family: "studio",
    kind: "opportunity",
    tag: "Offer",
    headline: "They want you to run a franchise",
    situation: "Three films, guaranteed, with a merchandising department already hired.",
    when: (c) => c.studioTrust >= 55 && films(c) >= 3,
    weight: (c) => 1.4 + c.studioTrust / 60,
    choices: [
      {
        id: "sign",
        label: "Sign the three-picture deal",
        detail: "Generational money, borrowed taste.",
        tone: "bold",
        outcome: "The advance clears before you have read the outline.",
        effects: { money: 6_000_000, studioTrust: 14, prestige: -8, recognition: 8, instability: 4 },
      },
      {
        id: "one",
        label: "Commit to one film only",
        detail: "Keep the exit.",
        tone: "safe",
        outcome: "They agree, grudgingly, and the number is smaller.",
        effects: { money: 2_000_000, studioTrust: 6, prestige: -2 },
      },
      {
        id: "walk",
        label: "Turn it down",
        detail: "You did not come here for a universe.",
        tone: "danger",
        outcome: "Word gets around that you cannot be bought. Some people find that thrilling.",
        effects: { reputation: 9, prestige: 6, studioTrust: -10, momentum: 4 },
      },
    ],
  },
  {
    id: "opp-producer",
    family: "excess",
    kind: "opportunity",
    tag: "Offer",
    headline: "A financier wants to put your name on a production company",
    situation: "You pick the slate. They pick the terms.",
    when: (c) => c.reputation >= 45 && films(c) >= 4,
    weight: (c) => 1.1 + c.reputation / 70,
    choices: [
      {
        id: "yes",
        label: "Start the company",
        detail: "Overhead, an assistant, a logo you will regret.",
        tone: "bold",
        risk: 0.4,
        outcome: "Your first acquisition wins a festival. The slate has heat.",
        effects: { money: 1_400_000, studioTrust: 10, reputation: 6, prestige: 5 },
        failOutcome: "Two years of development and nothing shoots. You pay the overhead personally.",
        failEffects: { moneyPct: 0.18, money: -300_000, months: 8, momentum: -10 },
      },
      {
        id: "no",
        label: "Stay a director",
        detail: "One job is already too many.",
        tone: "safe",
        outcome: "You keep your weekends and your focus.",
        effects: { prestige: 2 },
      },
    ],
  },
  {
    id: "opp-retro",
    family: "irrelevance",
    kind: "opportunity",
    tag: "Honour",
    headline: "A cinematheque is programming a retrospective",
    situation: "Six of your films, restored, with you on stage between them.",
    when: (c) => films(c) >= 6 && c.prestige >= 35,
    weight: (c) => 0.9 + c.prestige / 80,
    choices: [
      {
        id: "attend",
        label: "Do the whole run",
        detail: "Every Q&A, every night.",
        tone: "safe",
        outcome: "A generation that missed them the first time shows up.",
        effects: { months: 2, prestige: 7, reputation: 5, recognition: 4 },
      },
      {
        id: "skip",
        label: "Send a video message",
        detail: "You are shooting.",
        tone: "bold",
        outcome: "The programmer is gracious about it in a way that stings.",
        effects: { prestige: 2, momentum: 2 },
      },
    ],
  },
  {
    id: "opp-comeback",
    family: "irrelevance",
    kind: "opportunity",
    tag: "Rescue",
    headline: "A film has lost its director four weeks in",
    situation: "Sets built, cast on payroll, studio bleeding. They need someone who will not ask questions.",
    when: (c, p) => films(c) >= 4 && p.irrelevance >= 30,
    weight: (_c, p) => 1.2 + p.irrelevance / 30,
    choices: [
      {
        id: "rescue",
        label: "Take over the shoot",
        detail: "Somebody else's movie, your problem.",
        tone: "bold",
        risk: 0.45,
        outcome: "You deliver on schedule. The town remembers you can actually do the job.",
        effects: { money: 1_100_000, studioTrust: 18, momentum: 16, months: 6 },
        failOutcome: "It is unsalvageable and your name is on it anyway.",
        failEffects: { money: 700_000, reputation: -8, studioTrust: -6, momentum: -12, months: 7 },
      },
      {
        id: "decline",
        label: "Decline",
        detail: "No credit worth having ever started this way.",
        tone: "safe",
        outcome: "The film comes out terribly. You were right, which pays nothing.",
        effects: { months: 3, prestige: 2 },
      },
    ],
  },
  {
    id: "opp-star",
    family: "excess",
    kind: "opportunity",
    tag: "Attachment",
    headline: "The biggest star in the world has read your script",
    situation: "They love it. They have four notes and a start date eighteen months away.",
    when: (c) => c.recognition >= 45,
    weight: (c) => 1.1 + c.recognition / 70,
    choices: [
      {
        id: "wait",
        label: "Wait for them",
        detail: "The film gets made at a completely different size.",
        tone: "bold",
        outcome: "The attachment triples the budget conversation overnight.",
        effects: { months: 12, studioTrust: 14, recognition: 6, momentum: 10 },
      },
      {
        id: "now",
        label: "Shoot it now with someone unknown",
        detail: "Momentum over wattage.",
        tone: "safe",
        outcome: "You cast a nobody who is, it turns out, extraordinary.",
        effects: { months: 1, prestige: 6, reputation: 4, studioTrust: -4 },
      },
    ],
  },
];

/** Events still available to this career, weighted by live pressure. */
export function eligibleEvents(c: DirectorCareer, p: PressureMap): CareerEvent[] {
  const seen = new Set(c.seenEvents ?? []);
  return CAREER_EVENTS.filter((e) => !seen.has(e.id) && e.when(c, p));
}

export function pickEvent(c: DirectorCareer, p: PressureMap, rand: number): CareerEvent | null {
  const pool = eligibleEvents(c, p);
  if (pool.length === 0) return null;
  const weights = pool.map((e) => Math.max(0.05, e.weight(c, p) * (1 + p[e.family] / 45)));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = rand * total;
  for (let i = 0; i < pool.length; i++) {
    t -= weights[i]!;
    if (t <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}
