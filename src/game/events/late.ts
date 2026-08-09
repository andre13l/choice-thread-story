/**
 * PATHS — HOLLYWOOD content pack, part 3: the top of the mountain.
 * Power, production companies, catastrophic risk, collapse chains,
 * late-career memory — and the hidden final events, which read as
 * ordinary (if strange) career situations.
 */

import type { GameEvent } from "../types";

export const lateEvents: GameEvent[] = [
  {
    id: "production_company",
    place: "Los Angeles",
    text: "Your agent floats the idea: your own production company. Real overhead, real power, real risk. You'd stop asking for work and start creating it.",
    minStats: { fame: 50, money: 12_000_000 },
    weight: 7,
    once: true,
    tags: ["business", "power", "pivotal"],
    options: [
      {
        label: "Start the company",
        hint: "$5M to launch",
        outcomes: [
          {
            text: "You lease offices, hire four believers, and put your name on the door in small letters. It feels like the beginning of something — or the wager of a lifetime.",
            money: -5_000_000,
            effects: { influence: 12, industryRespect: 8, financialRisk: 15, ego: 4 },
            flags: { productionCompany: true },
          },
        ],
      },
      {
        label: "Stay an actor for hire",
        hint: "Safe",
        outcomes: [
          {
            text: "You keep showing up, doing the work, cashing the checks. Other people own the machines.",
            effects: { financialRisk: -5 },
          },
        ],
      },
    ],
  },
  {
    id: "finance_180m",
    place: "Los Angeles",
    text: "Your production company receives a script from an unknown director. Every major studio rejected it. Budget required: $180M. Reading it at 3 a.m., you understand why they're all wrong. You think.",
    requiresFlags: { productionCompany: true },
    minStats: { money: 60_000_000 },
    weight: 8,
    once: true,
    tags: ["finance", "risk", "pivotal", "memory"],
    options: [
      {
        label: "Finance it yourself",
        hint: "Extremely risky",
        danger: true,
        chance: 0.22,
        modifiers: { talent: 0.2, luck: 0.3, industryRespect: 0.15, financialRisk: -0.15 },
        setFlags: { betTheCompany: true },
        outcomes: [
          {
            text: "It becomes one of the greatest movies ever made. Critics run out of adjectives. Audiences see it four times. Your company is now a studio.",
            money: 220_000_000,
            effects: { legacy: 20, culturalImpact: 22, industryRespect: 18, influence: 15, successfulMovies: 1, movies: 1, fame: 8 },
            flags: { legendaryFilm: true, survivedDisaster: true },
          },
          {
            text: "It opens to silence. $150M gone. The company is bleeding. The trades are already writing the obituary — yours.",
            money: -150_000_000,
            effects: { failedMovies: 1, industryRespect: -10, influence: -8, financialRisk: 30, burnout: 15 },
            flags: { companyCollapsing: true },
            forceEventId: "company_collapse_1",
          },
        ],
      },
      {
        label: "Find outside investors",
        hint: "Difficult",
        chance: 0.45,
        modifiers: { influence: 0.3, connections: 0.2, luck: 0.15 },
        outcomes: [
          {
            text: "You raise the money and keep 30% of the upside. If it works, you win smaller. If it fails, you survive.",
            effects: { influence: 5, financialRisk: 5 },
            flags: { financedWithInvestors: true },
          },
          {
            text: "Every fund in town has 'notes'. The script dies in a drawer. You wonder about it sometimes.",
            effects: { burnout: 4 },
          },
        ],
      },
      {
        label: "Walk away",
        hint: "Safe",
        outcomes: [
          {
            text: "You pass. The script circulates for years, a ghost. You never find out what it would have been. That's the deal you made.",
            effects: { financialRisk: -5, ego: -2 },
          },
        ],
      },
    ],
  },
  {
    id: "company_collapse_1",
    place: "Los Angeles",
    text: "The bomb's fallout spreads. Your slate of upcoming films loses financing. Payroll is due in nine days. Your CFO has started using the word 'options' in a tone you don't like.",
    weight: 100,
    once: true,
    tags: ["collapse", "chain"],
    options: [
      {
        label: "Sell everything you own to save it",
        hint: "All in",
        danger: true,
        chance: 0.35,
        modifiers: { luck: 0.3, influence: 0.2 },
        outcomes: [
          {
            text: "The mansion, the cars, the art — all liquefied into payroll. The next film hits. The company survives. You own almost nothing except the company. Somehow, it's enough.",
            moneyPct: -0.6,
            effects: { industryRespect: 10, influence: 5, burnout: 15 },
            flags: { savedCompany: true, survivedDisaster: true },
          },
          {
            text: "It's not enough. It was never going to be enough. The accountants take over the conference room.",
            moneyPct: -0.75,
            effects: { burnout: 20, influence: -10 },
            forceEventId: "company_bankrupt",
          },
        ],
      },
      {
        label: "Let it go bankrupt",
        hint: "Surgical",
        outcomes: [
          {
            text: "You let it die. Lawyers carve up what's left. Your name is in headlines next to the word 'collapse' for a month.",
            moneyPct: -0.4,
            effects: { industryRespect: -12, fame: -8, influence: -15, financialRisk: 10 },
            flags: { companyBankrupt: true },
          },
        ],
      },
    ],
  },
  {
    id: "company_bankrupt",
    place: "Los Angeles",
    text: "Bankruptcy court, seventh floor. Fluorescent lights. The company that had your name on the door is now Exhibit C. The debt follows you out of the building.",
    weight: 100,
    once: true,
    tags: ["collapse", "chain"],
    options: [
      {
        label: "Take any role to pay debts",
        hint: "Humbling",
        outcomes: [
          {
            text: "You act in things you'd have laughed at once. The checks go straight to creditors. Slowly, the hole gets shallower. Your ego does not survive; you do.",
            money: 2_000_000,
            effects: { movies: 2, failedMovies: 1, burnout: 15, reputation: -5, industryRespect: 4 },
            flags: { debtPaying: true, survivedDisaster: true },
          },
        ],
      },
      {
        label: "Fight the creditors in court",
        hint: "Risky",
        danger: true,
        chance: 0.4,
        modifiers: { luck: 0.3, influence: 0.15 },
        outcomes: [
          {
            text: "Your lawyers are better than their lawyers. The debt settles for cents on the dollar. You limp away, technically standing.",
            moneyPct: 0.5,
            effects: { burnout: 10, industryRespect: -5 },
            flags: { survivedDisaster: true },
          },
          {
            text: "The court is unimpressed. The judgment lands like a piano. Everything you have is now theirs.",
            moneyPct: -0.9,
            effects: { fame: -10, burnout: 20 },
            flags: { totalRuin: true },
          },
        ],
      },
    ],
  },
  {
    id: "directorial_debut",
    place: "Los Angeles",
    text: "You want to direct. Everyone wants to direct. But you have the money, the relationships, and a script you've carried for a decade.",
    minStats: { fame: 55, money: 8_000_000, age: 40 },
    weight: 6,
    once: true,
    tags: ["directing", "risk", "pivotal"],
    options: [
      {
        label: "Direct it",
        hint: "Very risky",
        danger: true,
        chance: 0.35,
        modifiers: { talent: 0.3, industryRespect: 0.2, luck: 0.2 },
        outcomes: [
          {
            text: "You turn out to have the eye. Critics call it 'a director's film' — the highest compliment there is. Actors start calling you.",
            money: 4_000_000,
            effects: { reputation: 12, industryRespect: 14, legacy: 12, influence: 10, culturalImpact: 8, successfulMovies: 1, movies: 1 },
            flags: { directorAcclaimed: true, legendaryFilm: true },
          },
          {
            text: "Directing is forty decisions an hour, and it shows. The film is a beautiful, expensive mess. Acting suddenly seems relaxing.",
            money: -3_000_000,
            effects: { reputation: -4, failedMovies: 1, movies: 1, burnout: 15, industryRespect: -5 },
            flags: { directorFlop: true },
          },
        ],
      },
      {
        label: "Keep it in the drawer",
        hint: "Safe",
        outcomes: [
          { text: "The script stays with you, a road not taken. Everyone needs one of those.", effects: {} },
        ],
      },
    ],
  },
  {
    id: "award_campaign_late",
    place: "Los Angeles",
    text: "Your latest performance has the town talking. Another campaign season: the lunches, the panels, the whispering. You've done this dance before.",
    minStats: { reputation: 55, fame: 45, awards: 1 },
    weight: 6,
    tags: ["awards", "oscar"],
    options: [
      {
        label: "Campaign",
        hint: "35%",
        chance: 0.35,
        modifiers: { reputation: 0.25, industryRespect: 0.25, luck: 0.2, legacy: 0.1 },
        outcomes: [
          {
            text: "Another envelope, another name: yours. The standing ovation has a different quality now — respect settling into history.",
            effects: { oscars: 1, awards: 1, industryRespect: 12, legacy: 12, fame: 8, reputation: 5 },
          },
          {
            text: "Nominated again. You are now 'always nominated', which is its own kind of career.",
            effects: { awards: 1, industryRespect: 5, reputation: 3, burnout: 8 },
          },
        ],
      },
      {
        label: "Stay home",
        hint: "12%",
        chance: 0.12,
        modifiers: { luck: 0.3, legacy: 0.15 },
        outcomes: [
          {
            text: "You win anyway. Accepting by video from your kitchen becomes the season's most charming moment.",
            effects: { oscars: 1, awards: 1, industryRespect: 12, legacy: 10, publicPerception: 6 },
          },
          {
            text: "The voters reward presence. You were absent. Fair enough.",
            effects: { burnout: -4 },
          },
        ],
      },
    ],
  },
  {
    id: "assistant_returns_powerful",
    place: "Los Angeles",
    text: "A meeting at a major studio. The new head of production walks in — and it's the assistant you screamed at, all those years ago. She remembers everything. She says she's 'looking forward to working together'.",
    requiresFlags: { treatedAssistantBadly: true },
    minAge: 42,
    weight: 10,
    once: true,
    tags: ["memory", "consequence"],
    options: [
      {
        label: "Apologize sincerely",
        hint: "Uncertain",
        chance: 0.45,
        modifiers: { publicPerception: 0.15, luck: 0.25, ego: -0.2 },
        outcomes: [
          {
            text: "She listens. A long pause. 'I waited twelve years to hear that.' She greenlights your film anyway. Some debts can actually be paid.",
            money: 1_500_000,
            effects: { industryRespect: 4, movies: 1, ego: -6 },
            flags: { assistantForgave: true },
          },
          {
            text: "She smiles politely. Your projects keep almost getting made. Almost is a very expensive word.",
            effects: { industryRespect: -6, influence: -5, ego: -5 },
            flags: { blacklistedQuietly: true },
          },
        ],
      },
      {
        label: "Pretend nothing happened",
        hint: "Risky",
        danger: true,
        outcomes: [
          {
            text: "She lets you finish your pitch, thanks you warmly, and passes. Then passes on the next three. Doors close quietly all over town.",
            effects: { industryRespect: -8, influence: -8, connections: -5 },
            flags: { blacklistedQuietly: true },
          },
        ],
      },
    ],
  },
  {
    id: "assistant_returns_loyal",
    place: "Los Angeles",
    text: "The assistant you once took time to teach now runs production at a major studio. She calls you directly: 'I have something. First call goes to you. It always will.'",
    requiresFlags: { treatedAssistantWell: true },
    minAge: 42,
    weight: 9,
    once: true,
    tags: ["memory", "reward"],
    options: [
      {
        label: "Take the meeting",
        hint: "Loyalty compounds",
        outcomes: [
          {
            text: "It's a perfect role in a prestige picture. Kindness, it turns out, was an investment with a very long term.",
            money: 2_500_000,
            effects: { movies: 1, successfulMovies: 1, reputation: 6, industryRespect: 6, leadingRoles: 1, fame: 6 },
          },
        ],
      },
    ],
  },
  {
    id: "tax_trouble",
    place: "Los Angeles",
    text: "A letter from the IRS. Your former accountant had 'aggressive strategies'. The word 'audit' appears. So does a number with many digits.",
    minStats: { money: 10_000_000 },
    weight: 5,
    once: true,
    tags: ["money", "disaster"],
    options: [
      {
        label: "Settle quietly",
        hint: "Expensive",
        outcomes: [
          {
            text: "You write a check that makes your hand shake. It buys silence and sleep. Money well spent, you tell yourself, repeatedly.",
            moneyPct: -0.22,
            effects: { burnout: 8 },
          },
        ],
      },
      {
        label: "Fight it",
        hint: "Very risky",
        danger: true,
        chance: 0.35,
        modifiers: { luck: 0.35, influence: 0.1 },
        outcomes: [
          {
            text: "Your new accountants dismantle the case. You owe a fraction. You frame the letter, weirdly.",
            moneyPct: -0.05,
            effects: { burnout: 10 },
          },
          {
            text: "You lose. Penalties stack. It's in the news for a week, which is worse than the money. Almost.",
            moneyPct: -0.4,
            effects: { publicPerception: -8, fame: -4, burnout: 12 },
            flags: { scandalMarked: true },
          },
        ],
      },
    ],
  },
  {
    id: "divorce_settlement",
    place: "Los Angeles",
    text: "The marriage is over. The lawyers are not. California is a community property state, and you have quite a lot of community property.",
    requiresFlags: { publicCouple: true },
    minStats: { money: 5_000_000 },
    weight: 7,
    once: true,
    tags: ["money", "life", "disaster"],
    options: [
      {
        label: "Settle generously and fast",
        hint: "Half",
        outcomes: [
          {
            text: "You sign. Half of everything, gone in a signature. The statement says 'amicable'. It nearly is.",
            moneyPct: -0.45,
            effects: { publicPerception: 3, burnout: 12, ego: -4 },
          },
        ],
      },
      {
        label: "Fight for every dollar",
        hint: "Ugly",
        danger: true,
        chance: 0.5,
        modifiers: { luck: 0.3 },
        outcomes: [
          {
            text: "You keep 65%. The tabloids keep the rest of you. The mud sticks to everyone.",
            moneyPct: -0.35,
            effects: { publicPerception: -12, reputation: -3, burnout: 15 },
            flags: { scandalMarked: true },
          },
          {
            text: "Eighteen months of depositions. You lose more than the generous offer would have cost, plus yourself for a while.",
            moneyPct: -0.55,
            effects: { publicPerception: -15, burnout: 20, fame: -3 },
            flags: { scandalMarked: true },
          },
        ],
      },
    ],
  },
  {
    id: "studio_feud",
    place: "Los Angeles",
    text: "A studio chief has re-cut your film over your objections. The contract lets him. Your name is on the poster. His fingerprints are on the film.",
    minStats: { fame: 55, influence: 20 },
    weight: 5,
    once: true,
    tags: ["conflict", "studio"],
    options: [
      {
        label: "Go to war publicly",
        hint: "Dangerous",
        danger: true,
        chance: 0.4,
        modifiers: { influence: 0.3, industryRespect: 0.2, luck: 0.15 },
        outcomes: [
          {
            text: "The town takes sides, and surprisingly takes yours. The director's cut releases to acclaim. You've won a war nobody wins.",
            effects: { industryRespect: 10, influence: 8, reputation: 6, ego: 5 },
            flags: { beatTheStudio: true },
          },
          {
            text: "He makes one phone call. Then another. Suddenly your projects 'aren't right' for every studio in town.",
            effects: { influence: -12, industryRespect: -6, connections: -8, fame: -5 },
            flags: { blacklistedQuietly: true },
          },
        ],
      },
      {
        label: "Take your name off it",
        hint: "Principled",
        outcomes: [
          {
            text: "The film comes out directed by 'Alan Smithee'. Insiders know why. Your silence says more than a press conference would.",
            effects: { industryRespect: 5, reputation: 3, money: -500_000 },
          },
        ],
      },
    ],
  },
  {
    id: "grandfather_roles",
    place: "Los Angeles",
    text: "The scripts arriving now all say 'wise elder'. You are being offered other people's grandfathers. The town has quietly re-filed you.",
    minStats: { fame: 40 },
    minAge: 55,
    weight: 6,
    tags: ["aging", "career"],
    options: [
      {
        label: "Take the elder statesman roles",
        hint: "Graceful",
        outcomes: [
          {
            text: "You bring forty years of weight to fifteen minutes of screen time. You become everyone's favorite part of movies you barely carry.",
            money: 900_000,
            effects: { reputation: 5, industryRespect: 5, movies: 1, legacy: 5, fame: 2 },
          },
        ],
      },
      {
        label: "Fight for leads",
        hint: "Uphill",
        danger: true,
        chance: 0.3,
        modifiers: { fame: 0.2, reputation: 0.2, luck: 0.2 },
        outcomes: [
          {
            text: "A brave director casts you as the lead, age and all. It works. The trades rediscover you like a comet.",
            money: 2_000_000,
            effects: { leadingRoles: 1, movies: 1, successfulMovies: 1, fame: 8, reputation: 8, legacy: 6 },
          },
          {
            text: "The meetings go politely nowhere. You are 'a legend', which is what they call you when the leads stop coming.",
            effects: { ego: -5, burnout: 6 },
          },
        ],
      },
    ],
  },
  {
    id: "late_great_role",
    place: "Los Angeles",
    text: "A screenplay lands that only someone with your years could play. A fading legend playing a fading legend. It cuts close. That's exactly why it might matter.",
    minStats: { reputation: 45, age: 58 },
    weight: 6,
    once: true,
    tags: ["comeback", "awards", "pivotal"],
    options: [
      {
        label: "Play him",
        hint: "Exposed",
        chance: 0.5,
        modifiers: { talent: 0.3, reputation: 0.2, luck: 0.15, burnout: -0.15 },
        outcomes: [
          {
            text: "You put your whole life in front of the camera — the regrets, the vanity, all of it. They say it's the performance of the decade.",
            money: 1_800_000,
            effects: { oscars: 1, awards: 1, reputation: 12, legacy: 14, industryRespect: 10, culturalImpact: 8, leadingRoles: 1, movies: 1, successfulMovies: 1, fame: 8 },
            flags: { lateMasterpiece: true },
          },
          {
            text: "The film is too quiet for the moment. It finds its audience years later, on a streaming service, at 1 a.m. People write you letters.",
            money: 900_000,
            effects: { reputation: 6, legacy: 6, movies: 1, leadingRoles: 1, culturalImpact: 5 },
          },
        ],
      },
      {
        label: "Too close to home",
        hint: "Safe",
        outcomes: [
          { text: "Some mirrors you don't buy. Someone else plays him. You don't watch it.", effects: { ego: -2 } },
        ],
      },
    ],
  },
  {
    id: "lifetime_achievement",
    place: "Los Angeles",
    text: "The Academy wants to give you an honorary award 'for a lifetime of indelible work'. You know what they mean. They mean the eulogy has begun.",
    minStats: { legacy: 40, age: 60 },
    weight: 5,
    once: true,
    tags: ["awards", "legacy"],
    options: [
      {
        label: "Accept",
        hint: "A summing-up",
        outcomes: [
          {
            text: "Forty years of clips play on a giant screen. You watch your own face age across four decades in three minutes. The room stands for a long time.",
            effects: { legacy: 15, industryRespect: 10, awards: 1, publicPerception: 6, fame: 4 },
          },
        ],
      },
      {
        label: "Decline — you're not done",
        hint: "Defiant",
        outcomes: [
          {
            text: "'Not yet,' you tell them. The refusal becomes a story of its own. People admire the stubbornness.",
            effects: { reputation: 4, ego: 4, publicPerception: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "memoir",
    place: "Los Angeles",
    text: "A publisher offers $3M for your memoir. 'Total honesty,' they say, which is publisher for 'name names'.",
    minStats: { fame: 55, age: 50 },
    weight: 5,
    once: true,
    tags: ["money", "press"],
    options: [
      {
        label: "Write the honest one",
        hint: "Risky",
        danger: true,
        chance: 0.5,
        modifiers: { luck: 0.2, reputation: 0.15 },
        outcomes: [
          {
            text: "The book is a sensation — funny, brutal, wise. It's on every nightstand in America. Three people never speak to you again. Worth it?",
            money: 3_000_000,
            effects: { culturalImpact: 10, legacy: 8, publicPerception: 5, connections: -3 },
          },
          {
            text: "The names you named name lawyers. The legal bills eat the advance. The book, pulped, becomes a collector's item.",
            money: 1_000_000,
            effects: { publicPerception: -5, industryRespect: -8, burnout: 10 },
            flags: { scandalMarked: true },
          },
        ],
      },
      {
        label: "Write the polite one",
        hint: "$3M",
        outcomes: [
          {
            text: "It's charming and empty and sells fine. Book clubs enjoy it. History will have to guess.",
            money: 3_000_000,
            effects: { publicPerception: 2, culturalImpact: 2 },
          },
        ],
      },
    ],
  },
  {
    id: "mentorship",
    place: "Los Angeles",
    text: "A brilliant, broke young actor keeps showing up at your theater, your premieres, your edges. She reminds you of someone. You.",
    minStats: { industryRespect: 40, age: 48 },
    weight: 5,
    once: true,
    tags: ["legacy", "relationships"],
    options: [
      {
        label: "Take her under your wing",
        hint: "Time",
        outcomes: [
          {
            text: "You teach her everything the town taught you the hard way. She wins an award in four years and thanks you first.",
            effects: { industryRespect: 8, legacy: 8, culturalImpact: 4, burnout: -4 },
            flags: { mentored: true },
          },
        ],
      },
      {
        label: "Wish her luck",
        hint: "Busy",
        outcomes: [{ text: "You give her one piece of advice and your publicist's number. It's more than you got.", effects: {} }],
      },
    ],
  },
  {
    id: "franchise_fatigue",
    place: "Los Angeles",
    text: "They want one more sequel. The codpiece, again. The money, again, is obscene. You are old enough now to know exactly what it costs.",
    requiresFlags: { franchiseActor: true },
    minStats: { fame: 40 },
    minAge: 45,
    weight: 6,
    tags: ["franchise", "money", "memory"],
    options: [
      {
        label: "One last ride",
        hint: "$18M",
        outcomes: [
          {
            text: "You say the lines, dodge the green screens, cash the check. The fans weep at your farewell tour. Honestly, so do you, a little.",
            money: 18_000_000,
            effects: { fame: 6, movies: 1, successfulMovies: 1, burnout: 12, culturalImpact: 4 },
          },
        ],
      },
      {
        label: "Hang up the suit",
        hint: "Done",
        outcomes: [
          {
            text: "You pass the codpiece to a 24-year-old. At the premiere, the crowd chants your name, not his. You leave before the credits.",
            effects: { legacy: 5, reputation: 3, ego: 2 },
          },
        ],
      },
    ],
  },
  {
    id: "bad_partner",
    place: "Los Angeles",
    text: "Your business partner at the company has been 'reallocating' funds to a project in the Cayman Islands. The project's address is a mailbox.",
    requiresFlags: { productionCompany: true },
    weight: 5,
    once: true,
    tags: ["disaster", "money", "betrayal"],
    options: [
      {
        label: "Call the lawyers",
        hint: "Long war",
        chance: 0.55,
        modifiers: { luck: 0.25, influence: 0.15 },
        outcomes: [
          {
            text: "Eight months of forensic accounting. You recover most of it. He recovers a judgment and a reputation he can't spend.",
            moneyPct: -0.08,
            effects: { burnout: 12, industryRespect: 3 },
            flags: { survivedDisaster: true },
          },
          {
            text: "He's three jurisdictions ahead of you. You recover a third. The lesson costs the rest.",
            moneyPct: -0.25,
            effects: { burnout: 15, influence: -5, financialRisk: 10 },
          },
        ],
      },
      {
        label: "Handle it quietly",
        hint: "Hush money",
        outcomes: [
          {
            text: "You pay him to disappear. He disappears. Your ledger has a scar, but the trades never smell blood.",
            moneyPct: -0.12,
            effects: { burnout: 8, financialRisk: 5 },
          },
        ],
      },
    ],
  },
  {
    id: "relevance_drift",
    place: "Los Angeles",
    text: "You open a trade paper and realize you don't recognize half the names on the cover. A 19-year-old just got the role you'd have killed for at 19. Time is doing what it does.",
    minStats: { fame: 35 },
    minAge: 52,
    weight: 6,
    tags: ["aging"],
    options: [
      {
        label: "Adapt — find the new wave",
        hint: "Humbling",
        chance: 0.55,
        modifiers: { connections: 0.2, luck: 0.15, ego: -0.2 },
        outcomes: [
          {
            text: "You work with the young directors, learn the new grammar, stop pretending to understand the algorithms. It works. You're current again, on new terms.",
            effects: { fame: 5, culturalImpact: 4, reputation: 4, burnout: 6 },
          },
          {
            text: "You try the young world's language and speak it with an accent. The memes are gentle, at least.",
            effects: { publicPerception: 3, fame: 2, ego: -4 },
          },
        ],
      },
      {
        label: "Stand still, with dignity",
        hint: "Safe",
        outcomes: [
          {
            text: "You remain yourself, immovably. The world rotates. Occasionally it rotates back.",
            effects: { reputation: 2, legacy: 2, fame: -2 },
          },
        ],
      },
    ],
  },
  {
    id: "philanthropy",
    place: "Los Angeles",
    text: "A film school wants to name a scholarship after you. Cost: a $2M endowment. Return: a hundred kids a year get their shot.",
    minStats: { money: 20_000_000, age: 50 },
    weight: 4,
    once: true,
    tags: ["legacy", "money"],
    options: [
      {
        label: "Endow it",
        hint: "$2M",
        outcomes: [
          {
            text: "Every year, a kid from nowhere gets the letter. You'll never meet most of them. That's the point.",
            money: -2_000_000,
            effects: { legacy: 10, publicPerception: 6, culturalImpact: 4, industryRespect: 4 },
          },
        ],
      },
      {
        label: "Politely decline",
        hint: "Safe",
        outcomes: [{ text: "They name it after a mogul instead. He has more money and fewer movies.", effects: {} }],
      },
    ],
  },
  {
    id: "documentary",
    place: "Los Angeles",
    text: "A great documentarian wants to make a film about your life. Full access, no approval rights. Everything on the table.",
    minStats: { fame: 50, age: 55 },
    weight: 4,
    once: true,
    tags: ["legacy", "press"],
    options: [
      {
        label: "Open the vault",
        hint: "Exposed",
        chance: 0.55,
        modifiers: { publicPerception: 0.15, luck: 0.2 },
        outcomes: [
          {
            text: "The film is honest and devastating and beautiful. Young filmmakers discover you. Your obituary just got rewritten, early, in your favor.",
            effects: { legacy: 12, culturalImpact: 8, publicPerception: 8, fame: 4 },
          },
          {
            text: "The film lingers on the scandals and skips the triumphs. It's fair, technically. It premieres at every festival.",
            effects: { legacy: 4, publicPerception: -6, fame: 3 },
          },
        ],
      },
      {
        label: "Keep the vault closed",
        hint: "Private",
        outcomes: [
          { text: "Your story stays yours. Historians will improvise.", effects: { reputation: 1 } },
        ],
      },
    ],
  },
  {
    id: "retirement_offer",
    place: "Los Angeles",
    text: "A quiet morning. A house paid off, awards on the shelf, a garden that needs you more than any set does. You could simply... stop.",
    minStats: { age: 62 },
    weight: (s) => (s.stats.burnout > 50 ? 9 : 4),
    tags: ["ending"],
    options: [
      {
        label: "Let the path rest",
        hint: "A quiet close",
        outcomes: [
          {
            text: "You stop auditioning. The phone slows, then stills. The garden is excellent. The story is yours now, all of it.",
            effects: { burnout: -20, legacy: 3 },
            end: "career",
          },
        ],
      },
      {
        label: "Not yet",
        hint: "Keep going",
        outcomes: [
          {
            text: "There's still something left in the tank. You can feel it. The town can feel it too.",
            effects: { riskTolerance: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "health_scare",
    place: "Los Angeles",
    text: "A routine checkup becomes less routine. The doctor uses the words 'slow down' in a way that sounds less like advice and more like terms and conditions.",
    minStats: { burnout: 60, age: 50 },
    weight: 7,
    tags: ["health", "ending"],
    options: [
      {
        label: "Step back and recover",
        hint: "Listen",
        outcomes: [
          {
            text: "You cancel two projects and learn to sleep again. The work will be there. You nearly weren't.",
            effects: { burnout: -30, fame: -2 },
            flags: { survivedDisaster: true },
          },
        ],
      },
      {
        label: "Ignore it",
        hint: "Dangerous",
        danger: true,
        chance: 0.6,
        modifiers: { luck: 0.4 },
        outcomes: [
          {
            text: "Your body holds, for now. The doctor shakes her head. You've always been stubborn; it's practically your craft.",
            effects: { burnout: 15, money: 500_000, movies: 1 },
          },
          {
            text: "Your body files a formal complaint. The production shuts down. The insurance people have meetings about you.",
            effects: { burnout: 30, fame: -4, industryRespect: -3 },
            flags: { collapsed: true },
          },
        ],
      },
    ],
  },
  {
    id: "comeback_attempt",
    place: "Los Angeles",
    text: "It's been quiet for years. Too quiet. A comeback means starting over at auditions with people young enough to be your children. There's one role. It's good.",
    minStats: { age: 55 },
    maxStats: { fame: 45 },
    weight: 6,
    tags: ["comeback"],
    options: [
      {
        label: "Audition like it's your first",
        hint: "30%",
        danger: true,
        chance: 0.3,
        modifiers: { talent: 0.35, reputation: 0.2, luck: 0.2 },
        outcomes: [
          {
            text: "You walk in with nothing to lose and forty years to give. The room goes still. The comeback is real.",
            money: 1_200_000,
            effects: { fame: 14, reputation: 8, industryRespect: 6, leadingRoles: 1, movies: 1, successfulMovies: 1, publicPerception: 6 },
            flags: { comeback: true, survivedDisaster: true },
          },
          {
            text: "They give it to the 19-year-old. You gave a great audition. Nobody was in the market for one.",
            effects: { ego: -6, burnout: 6, fame: -2 },
          },
        ],
      },
      {
        label: "Leave the past in the past",
        hint: "Safe",
        outcomes: [
          { text: "You let the quiet be the answer. It has its own dignity.", effects: { burnout: -4 } },
        ],
      },
    ],
  },
  {
    id: "rival_final",
    place: "Los Angeles",
    text: "A legacy sequel wants you and your old rival as co-leads. Two careers, one last round. The script winks at the rivalry. The fee is enormous.",
    requiresFlags: { rival: true },
    minStats: { age: 50 },
    weight: 7,
    once: true,
    tags: ["memory", "money"],
    options: [
      {
        label: "Do it together",
        hint: "$8M",
        chance: 0.55,
        modifiers: { luck: 0.2, reputation: 0.15 },
        outcomes: [
          {
            text: "The chemistry is nuclear. Critics call it 'a duel conducted with love'. You out-act each other into the best reviews of both your lives.",
            money: 8_000_000,
            effects: { fame: 8, reputation: 8, legacy: 6, movies: 1, successfulMovies: 1, culturalImpact: 5 },
          },
          {
            text: "The movie is fine. The press tour, where you two clearly adore hating each other, is legendary.",
            money: 8_000_000,
            effects: { fame: 6, publicPerception: 5, movies: 1, failedMovies: 1, culturalImpact: 3 },
          },
        ],
      },
      {
        label: "Decline — some wounds",
        hint: "Proud",
        outcomes: [{ text: "They cast your rival alone. He sends you a fruit basket. You eat it, furiously.", effects: { ego: 2 } }],
      },
    ],
  },
  {
    id: "jingle_returns",
    place: "New York",
    text: "On live television, the host surprises you with the car dealership jingle from your youth. Twenty million people watch your face as it plays.",
    requiresFlags: { jingleViral: true },
    minStats: { fame: 50 },
    weight: 6,
    once: true,
    tags: ["memory", "funny"],
    options: [
      {
        label: "Sing along",
        hint: "Own it",
        outcomes: [
          {
            text: "You sing every word, badly, gloriously. The clip is everywhere by morning. Somewhere, a dealership weeps with joy.",
            effects: { publicPerception: 10, fame: 4, culturalImpact: 3 },
          },
        ],
      },
      {
        label: "Refuse to acknowledge it",
        hint: "Frosty",
        outcomes: [
          {
            text: "You sit in glacial silence. The clip is also everywhere by morning, with different captions.",
            effects: { publicPerception: -8, ego: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "streaming_catalog_money",
    place: "Los Angeles",
    text: "A streaming service wants the exclusive rights to your old films — a 'celebration of your catalog'. The check is substantial. So is the fine print.",
    minStats: { movies: 15, money: 5_000_000 },
    weight: 5,
    once: true,
    tags: ["money", "business"],
    options: [
      {
        label: "Sell the catalog",
        hint: "$6M",
        outcomes: [
          {
            text: "Your life's work, bundled and streamed. A new generation binges your twenties. The check clears.",
            money: 6_000_000,
            effects: { culturalImpact: 4, legacy: 3, fame: 2 },
          },
        ],
      },
      {
        label: "Hold the rights",
        hint: "Principled",
        outcomes: [
          { text: "You keep control of your own history. It appreciates slower, but it's yours.", effects: { influence: 2, legacy: 2 } },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Hidden final chain. Reads as a strange career situation.          */
  /* Never surfaced by name anywhere. Eligibility is silent.           */
  /* ---------------------------------------------------------------- */
  {
    id: "legend_signal",
    place: "Los Angeles",
    text: "A handwritten letter arrives, no return address. Inside: a single page of a screenplay and a note. 'This is the one they said couldn't be made. It's yours if you want it. Everything you have won't be enough. That's why it's worth it.'",
    weight: 100,
    once: true,
    tags: ["hidden"],
    options: [
      {
        label: "Follow it",
        hint: "Uncertain",
        danger: true,
        chance: 1, // real chance set by engine config below via modifiers override
        modifiers: {},
        outcomes: [
          {
            text: "You call the number on the page. The voice on the other end has been waiting a long time. The project is real. It will require everything: the money, the name, the company, the reputation. All of it.",
            effects: {},
            forceEventId: "legend_gamble",
          },
          {
            text: "The number is disconnected. The page turns out to be nothing. You almost believe that.",
            effects: { burnout: 5 },
          },
        ],
      },
      {
        label: "Throw it away",
        hint: "Safe",
        outcomes: [
          {
            text: "You throw it away. Years later you'll wonder. But that night, you sleep fine.",
            effects: {},
          },
        ],
      },
    ],
  },
  {
    id: "legend_gamble",
    place: "Everywhere",
    text: "Two years. Every dollar, every favor, every ounce of your name. The film screens exactly once, unfinished, for the twelve people who decide what history remembers. The room is completely silent as the lights come up.",
    weight: 100,
    once: true,
    tags: ["hidden"],
    options: [
      {
        label: "Let it be judged",
        hint: "Everything on the table",
        danger: true,
        chance: 1,
        modifiers: {},
        outcomes: [
          {
            text: "The silence holds. Then one of them stands. Then all of them. You realize you are crying, and that you don't mind, and that nothing after this can add anything.",
            effects: { legacy: 100, culturalImpact: 100, industryRespect: 100 },
            end: "legend",
          },
          {
            text: "The silence breaks into polite, devastating nothing. The film is shelved. The money is gone. But for two years, you reached for the thing itself. Almost nobody ever does.",
            moneyPct: -0.7,
            effects: { legacy: 10, industryRespect: 5, burnout: 20 },
          },
        ],
      },
    ],
  },
];
