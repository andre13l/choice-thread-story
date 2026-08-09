/**
 * PATHS — HOLLYWOOD content pack, part 2: the working actor.
 * TV, supporting roles, indies, blockbusters, fame management.
 */

import type { GameEvent } from "../types";

export const midEvents: GameEvent[] = [
  {
    id: "supporting_role",
    place: "Los Angeles",
    text: "A supporting role in a mid-budget studio comedy. Fourth billing, decent money, a director who shoots fast.",
    minStats: { fame: 10 },
    maxStats: { fame: 55 },
    weight: 9,
    tags: ["movie", "studio"],
    options: [
      {
        label: "Take it",
        hint: "$85,000",
        chance: 0.5,
        modifiers: { talent: 0.3, luck: 0.15 },
        outcomes: [
          {
            text: "You steal every scene you're in. Reviewers keep using the phrase 'scene-stealer'.",
            money: 85000,
            effects: { fame: 8, reputation: 4, movies: 1, successfulMovies: 1, connections: 3 },
          },
          {
            text: "The movie is a shrug. You're fine in it. Fine is the industry's favorite word.",
            money: 85000,
            effects: { fame: 5, movies: 1, failedMovies: 1, burnout: 4 },
          },
        ],
      },
      {
        label: "Hold out for a lead",
        hint: "Risky",
        danger: true,
        outcomes: [
          {
            text: "Your agent sighs audibly. The lead offers do not immediately materialize.",
            effects: { ego: 4, riskTolerance: 4 },
          },
        ],
      },
    ],
  },
  {
    id: "indie_darling",
    place: "Park City",
    text: "A small indie with a real script wants you as the lead. $30,000 for six weeks. It might play Sundance.",
    minStats: { fame: 8 },
    maxStats: { fame: 70 },
    weight: 8,
    tags: ["indie", "reputation", "lead"],
    options: [
      {
        label: "Do the indie",
        hint: "Career move",
        chance: 0.45,
        modifiers: { talent: 0.35, luck: 0.2 },
        outcomes: [
          {
            text: "It premieres at Sundance to a standing ovation. You're suddenly 'one to watch'. The trades write about your 'fearless choices'.",
            money: 30000,
            effects: { reputation: 10, fame: 9, movies: 1, leadingRoles: 1, successfulMovies: 1, industryRespect: 6, culturalImpact: 4 },
            flags: { indieDarling: true },
          },
          {
            text: "It premieres at a festival in a strip mall. The director stops answering emails. You got good footage for your reel, at least.",
            money: 30000,
            effects: { reputation: 2, movies: 1, leadingRoles: 1, failedMovies: 1, burnout: 5 },
          },
        ],
      },
      {
        label: "Pass — the money's insulting",
        hint: "Safe",
        outcomes: [
          { text: "You keep your quote intact. Your quote, of course, is theoretical.", effects: { ego: 2 } },
        ],
      },
    ],
  },
  {
    id: "franchise_offer",
    place: "Los Angeles",
    text: "A superhero franchise wants you as the villain's sidekick. Three-picture deal. The money is obscene. The costume has a codpiece.",
    minStats: { fame: 20 },
    maxStats: { fame: 70 },
    weight: 7,
    once: true,
    tags: ["franchise", "blockbuster", "money", "pivotal"],
    options: [
      {
        label: "Sign the three-picture deal",
        hint: "$4M+",
        chance: 0.6,
        modifiers: { luck: 0.15, talent: 0.15 },
        setFlags: { franchiseActor: true },
        outcomes: [
          {
            text: "The film makes $900M worldwide. Children know your face. Your face is also on a lunchbox you will never escape.",
            money: 4_200_000,
            effects: { fame: 22, money: 0, movies: 1, successfulMovies: 1, culturalImpact: 14, reputation: -3, burnout: 8 },
          },
          {
            text: "The film underperforms. The trilogy becomes a duology, then a reboot without you. The lunchboxes are already printed.",
            money: 2_800_000,
            effects: { fame: 12, movies: 1, failedMovies: 1, burnout: 8 },
          },
        ],
      },
      {
        label: "Turn it down",
        hint: "Principled",
        outcomes: [
          {
            text: "Your agent takes a long walk before answering. You keep your soul. Souls are illiquid assets.",
            effects: { reputation: 3, ego: 5, riskTolerance: -3 },
            flags: { turnedDownFranchise: true },
          },
        ],
      },
    ],
  },
  {
    id: "first_lead",
    place: "Los Angeles",
    text: "A director you respect is casting the lead in a $25M drama. You're on a shortlist of three, next to two actors with bigger names.",
    minStats: { fame: 18, reputation: 20 },
    maxStats: { fame: 60 },
    weight: 8,
    once: true,
    tags: ["lead", "audition", "pivotal"],
    options: [
      {
        label: "Fight for it",
        hint: "25%",
        chance: 0.25,
        modifiers: { talent: 0.4, connections: 0.2, luck: 0.2, reputation: 0.15 },
        outcomes: [
          {
            text: "The director calls you himself. 'It's yours.' Your name goes above the title for the first time.",
            money: 650_000,
            effects: { fame: 14, leadingRoles: 1, movies: 1, reputation: 6, industryRespect: 5, ego: 6 },
            flags: { hadLead: true },
          },
          {
            text: "They go with the bigger name. The director sends a handwritten note: 'Next one. I mean it.'",
            effects: { connections: 3, burnout: 4 },
            flags: { directorOwesYou: true },
          },
        ],
      },
      {
        label: "Withdraw gracefully",
        hint: "Safe",
        outcomes: [
          {
            text: "You spare yourself the waiting. The movie opens a year later. You don't go see it.",
            effects: { burnout: -3 },
          },
        ],
      },
    ],
  },
  {
    id: "streaming_series",
    place: "Los Angeles",
    text: "A streaming giant offers you the lead in a prestige series. Six-episode seasons, great showrunner, three-year option.",
    minStats: { fame: 15 },
    maxStats: { fame: 65 },
    weight: 8,
    once: true,
    tags: ["streaming", "tv", "lead"],
    options: [
      {
        label: "Sign on",
        hint: "3 years",
        chance: 0.5,
        modifiers: { talent: 0.25, luck: 0.2 },
        setFlags: { streamingStar: true },
        outcomes: [
          {
            text: "The show becomes the thing everyone talks about on Mondays. Your face is on a building in Koreatown.",
            money: 1_800_000,
            effects: { fame: 18, reputation: 6, culturalImpact: 10, industryRespect: 5, burnout: 10 },
          },
          {
            text: "The show is cancelled after one season. The algorithm has spoken. Its reasons are classified.",
            money: 900_000,
            effects: { fame: 6, burnout: 10, failedMovies: 1 },
          },
        ],
      },
      {
        label: "Movies only",
        hint: "Stubborn",
        outcomes: [
          { text: "You're a film actor. The industry files this under 'cute'.", effects: { ego: 3, reputation: 1 } },
        ],
      },
    ],
  },
  {
    id: "method_role",
    place: "Los Angeles",
    text: "A role requires you to lose 40 pounds and live as your character for three months. Awards people are already circling the project.",
    minStats: { fame: 25, talent: 45 },
    weight: 7,
    tags: ["awards", "risk", "lead"],
    options: [
      {
        label: "Go full method",
        hint: "Dangerous",
        danger: true,
        chance: 0.45,
        modifiers: { talent: 0.35, luck: 0.15, burnout: -0.25 },
        outcomes: [
          {
            text: "You disappear into the part. On set, people whisper. The whispers say one word, and it rhymes with 'Schmoscar'.",
            money: 500_000,
            effects: { reputation: 12, industryRespect: 10, leadingRoles: 1, movies: 1, successfulMovies: 1, burnout: 18, culturalImpact: 5 },
            flags: { oscarBuzz: true },
          },
          {
            text: "You disappear into the part. The movie disappears into a February release slot. You kept the weight off and lost something else instead.",
            money: 500_000,
            effects: { reputation: 4, leadingRoles: 1, movies: 1, failedMovies: 1, burnout: 20 },
          },
        ],
      },
      {
        label: "Decline — protect yourself",
        hint: "Wise?",
        outcomes: [
          { text: "Your body and mind remain your own. Someone else gets very thin and very praised.", effects: { burnout: -5 } },
        ],
      },
    ],
  },
  {
    id: "oscar_campaign",
    place: "Los Angeles",
    text: "Your performance has real awards momentum. The studio will campaign, but you're expected to attend everything: lunches, panels, Q&As, more lunches.",
    requiresFlags: { oscarBuzz: true },
    weight: 10,
    once: true,
    tags: ["awards", "oscar"],
    options: [
      {
        label: "Campaign hard",
        hint: "38%",
        chance: 0.38,
        modifiers: { reputation: 0.25, industryRespect: 0.25, connections: 0.15, luck: 0.2, burnout: -0.2 },
        outcomes: [
          {
            text: "The envelope opens. It's your name. You float to the stage and forget everyone's names, starting with your own.",
            effects: { oscars: 1, awards: 1, fame: 15, industryRespect: 15, legacy: 10, reputation: 8, money: 200_000 },
            flags: { oscarWinner: true },
          },
          {
            text: "Nominated. You smile through the envelope, the applause, the after-party. Everyone says 'it's an honor'. It is. It also isn't.",
            effects: { awards: 1, fame: 8, industryRespect: 6, burnout: 10, ego: -4 },
          },
        ],
      },
      {
        label: "Let the work speak",
        hint: "12%",
        chance: 0.12,
        modifiers: { reputation: 0.3, luck: 0.2 },
        outcomes: [
          {
            text: "The work speaks. The Academy listens. You win without a single lunch.",
            effects: { oscars: 1, awards: 1, fame: 15, industryRespect: 15, legacy: 10, reputation: 8 },
            flags: { oscarWinner: true },
          },
          {
            text: "The work speaks. Unfortunately, forty other actors had lunch with the voters.",
            effects: { burnout: -3, reputation: 2 },
          },
        ],
      },
    ],
  },
  {
    id: "blockbuster_lead",
    place: "Los Angeles",
    text: "A $150M summer movie wants you as the lead. The script is a satellite crashing into various landmarks. The paycheck has many zeros.",
    minStats: { fame: 35 },
    weight: 8,
    tags: ["blockbuster", "lead", "money"],
    options: [
      {
        label: "Save the world, cash the check",
        hint: "$6M",
        chance: 0.55,
        modifiers: { luck: 0.2, fame: 0.1 },
        outcomes: [
          {
            text: "It opens huge. You're officially a movie star, defined as: your face sells tickets to movies nobody remembers.",
            money: 6_000_000,
            effects: { fame: 20, leadingRoles: 1, movies: 1, successfulMovies: 1, culturalImpact: 6, reputation: -2, burnout: 8 },
          },
          {
            text: "It bombs. The reviews use your name as a verb, and not kindly. The zeroes in the check remain stubbornly real.",
            money: 6_000_000,
            effects: { fame: 8, leadingRoles: 1, movies: 1, failedMovies: 1, reputation: -6, industryRespect: -5 },
            flags: { hadBomb: true },
          },
        ],
      },
      {
        label: "Pass",
        hint: "Safe",
        outcomes: [
          { text: "Someone else stands in front of the explosion. You keep your mystique.", effects: { reputation: 2 } },
        ],
      },
    ],
  },
  {
    id: "rival_actor",
    place: "Los Angeles",
    text: "The same actor keeps beating you for roles. Your agents have the same clients. Your publicists have the same ideas. This is now a rivalry, whether you like it or not.",
    minStats: { fame: 20 },
    weight: 6,
    once: true,
    tags: ["rival", "memory"],
    options: [
      {
        label: "Outwork them",
        hint: "Grinding",
        outcomes: [
          {
            text: "You audition better, train harder, arrive earlier. The gap starts closing.",
            effects: { talent: 3, reputation: 3, burnout: 8, riskTolerance: 3 },
            flags: { rival: true },
          },
        ],
      },
      {
        label: "Befriend them",
        hint: "Unusual",
        chance: 0.5,
        modifiers: { publicPerception: 0.2, luck: 0.2 },
        setFlags: { rival: true },
        outcomes: [
          {
            text: "Turns out they're hilarious. You become a famous duo of friends. The industry loves a storyline.",
            effects: { connections: 5, publicPerception: 6, fame: 4 },
            flags: { rivalFriend: true },
          },
          {
            text: "They smile, shake your hand, and take your next role too. Hollywood hugs with a knife.",
            effects: { ego: -5, burnout: 5 },
          },
        ],
      },
    ],
  },
  {
    id: "paparazzi_scandal",
    place: "Los Angeles",
    text: "Photos of you leaving a club at 4 a.m. with someone's spouse are everywhere. It was innocent. It does not look innocent.",
    minStats: { fame: 30 },
    weight: 6,
    tags: ["scandal", "press"],
    options: [
      {
        label: "Deny everything",
        hint: "Risky",
        danger: true,
        chance: 0.45,
        modifiers: { luck: 0.3, publicPerception: 0.2 },
        outcomes: [
          {
            text: "The story dies in three days, killed by a celebrity breakup. You are free.",
            effects: { publicPerception: -2, burnout: 4 },
          },
          {
            text: "More photos surface. The denial is now the story. The story is now a meme.",
            effects: { publicPerception: -15, reputation: -4, fame: 5, burnout: 8 },
            flags: { scandalMarked: true },
          },
        ],
      },
      {
        label: "Say nothing, ever",
        hint: "Disciplined",
        outcomes: [
          {
            text: "You become briefly fascinating and then briefly boring again. Silence is underrated.",
            effects: { publicPerception: -5, reputation: 2, ego: -2 },
          },
        ],
      },
    ],
  },
  {
    id: "talk_show",
    place: "New York",
    text: "A late-night appearance to promote your movie. Ten million viewers. The host is famous for ambushes.",
    minStats: { fame: 25 },
    weight: 7,
    tags: ["press", "viral"],
    options: [
      {
        label: "Be charming",
        hint: "Good chance",
        chance: 0.55,
        modifiers: { talent: 0.2, ego: 0.1, luck: 0.2 },
        outcomes: [
          {
            text: "Your anecdote about the puppet from the horror sequel gets 12 million views. Ticket sales bump 8%.",
            effects: { fame: 7, publicPerception: 8, culturalImpact: 3 },
          },
          {
            text: "You tell a story that lands like a piano. The clip circulates with the caption 'yikes'.",
            effects: { publicPerception: -8, fame: 3, burnout: 5 },
          },
        ],
      },
      {
        label: "Keep it boring",
        hint: "Safe",
        outcomes: [
          { text: "You promote the movie with all the charisma of a terms-of-service agreement. Nothing bad happens.", effects: { fame: 1 } },
        ],
      },
    ],
  },
  {
    id: "typecast_trap",
    place: "Los Angeles",
    text: "Another offer to play the exact same character type. The industry has decided what you are. The money keeps agreeing.",
    minStats: { fame: 30 },
    weight: 7,
    tags: ["typecast", "money"],
    options: [
      {
        label: "Take the money",
        hint: "$1.5M",
        outcomes: [
          {
            text: "You play it again. You can do this role in your sleep. Increasingly, you do.",
            money: 1_500_000,
            effects: { fame: 4, movies: 1, reputation: -4, burnout: 7, talent: -1 },
            flags: { typecast: true },
          },
        ],
      },
      {
        label: "Refuse and wait for range",
        hint: "Slow",
        outcomes: [
          {
            text: "Months pass. Your agent calls less. But when the right script finally comes, you'll be ready. Probably.",
            effects: { reputation: 3, burnout: -4, riskTolerance: 4 },
          },
        ],
      },
    ],
  },
  {
    id: "contract_renegotiation",
    place: "Los Angeles",
    text: "Season two of your show wants you back at the same rate. Your co-star just renegotiated for triple. Your agent says push.",
    requiresFlags: { streamingStar: true },
    weight: 8,
    tags: ["money", "negotiation", "tv"],
    options: [
      {
        label: "Hold out for triple",
        hint: "Coin flip",
        danger: true,
        chance: 0.5,
        modifiers: { fame: 0.25, influence: 0.2, luck: 0.15 },
        outcomes: [
          {
            text: "They cave in four days. You're now paid what you're worth, minus what they can get away with, plus a lot.",
            money: 1_200_000,
            effects: { influence: 5, ego: 5 },
          },
          {
            text: "They kill your character in a skiing accident. In Miami. The show does fine without you.",
            effects: { fame: -6, industryRespect: -3, ego: -8 },
            flags: { killedOff: true },
          },
        ],
      },
      {
        label: "Take the same rate",
        hint: "Safe",
        outcomes: [
          { text: "Loyalty is noted and immediately underpaid.", money: 400_000, effects: { reputation: 1 } },
        ],
      },
    ],
  },
  {
    id: "director_clash",
    place: "On location",
    text: "A famous director is publicly rewriting your scenes and humiliating the crew. He has three Oscars. You have a choice.",
    minStats: { fame: 25 },
    weight: 5,
    once: true,
    tags: ["conflict", "director"],
    options: [
      {
        label: "Confront him",
        hint: "Risky",
        danger: true,
        chance: 0.4,
        modifiers: { industryRespect: 0.25, ego: 0.2, luck: 0.15 },
        outcomes: [
          {
            text: "He stares at you for ten seconds, then laughs. 'Finally, someone.' The set changes. So does your reputation.",
            effects: { industryRespect: 8, reputation: 5, ego: 4 },
            flags: { stoodUpToDirector: true },
          },
          {
            text: "He finishes the film without speaking to you. Your scenes shrink mysteriously in the edit.",
            effects: { industryRespect: -4, reputation: -2, ego: -5, burnout: 6 },
          },
        ],
      },
      {
        label: "Endure it",
        hint: "Professional",
        outcomes: [
          {
            text: "You do your job beautifully and say nothing. The crew remembers who behaved like an adult.",
            effects: { industryRespect: 3, burnout: 8 },
          },
        ],
      },
    ],
  },
  {
    id: "passion_project",
    place: "Los Angeles",
    text: "You've found a script nobody will finance. You believe in it completely. You'd have to put in $800,000 of your own money.",
    minStats: { fame: 30, money: 1_000_000 },
    weight: 6,
    once: true,
    tags: ["indie", "risk", "money"],
    options: [
      {
        label: "Finance it yourself",
        hint: "Extremely risky",
        danger: true,
        chance: 0.35,
        modifiers: { talent: 0.3, luck: 0.25, reputation: 0.1 },
        setFlags: { financialRisk: true },
        outcomes: [
          {
            text: "It becomes the little film that could. Critics adore it. It returns eleven times its budget.",
            money: 8_000_000,
            effects: { reputation: 12, industryRespect: 10, movies: 1, successfulMovies: 1, culturalImpact: 8, legacy: 6, influence: 5 },
            flags: { passionHit: true, survivedRisk: true },
          },
          {
            text: "It plays in six theaters for one weekend. Your $800,000 is now a very expensive memory.",
            money: -800_000,
            effects: { reputation: 3, movies: 1, failedMovies: 1, financialRisk: 8, burnout: 8 },
          },
        ],
      },
      {
        label: "Let it go",
        hint: "Safe",
        outcomes: [
          { text: "You think about that script sometimes. Someone makes it in nine years. You don't ask how it does.", effects: { ego: -2 } },
        ],
      },
    ],
  },
  {
    id: "young_director_chance",
    place: "Los Angeles",
    text: "A 26-year-old director with one acclaimed short wants you for her first feature. No money, total creative control, a script people call 'unfilmable'.",
    minStats: { fame: 25 },
    weight: 7,
    once: true,
    tags: ["indie", "relationships", "memory", "pivotal"],
    options: [
      {
        label: "Take the chance",
        hint: "Uncertain",
        chance: 0.4,
        modifiers: { talent: 0.25, luck: 0.25 },
        setFlags: { helpedYoungDirector: true },
        outcomes: [
          {
            text: "She is the real thing. The film is a sensation. At the premiere she thanks you by name, twice.",
            money: 200_000,
            effects: { reputation: 10, industryRespect: 8, movies: 1, successfulMovies: 1, culturalImpact: 7 },
          },
          {
            text: "She is not the real thing. The film is unreleasable. But she'll never forget you believed in her.",
            money: 60_000,
            effects: { reputation: 3, movies: 1, failedMovies: 1, connections: 3 },
          },
        ],
      },
      {
        label: "Pass",
        hint: "Safe",
        setFlags: { rejectedYoungDirector: true },
        outcomes: [
          { text: "Unfilmable is usually a warning, not a compliment.", effects: {} },
        ],
      },
    ],
  },
  {
    id: "dating_costar",
    place: "On location",
    text: "You and your co-star are falling for each other. The studio is thrilled. The tabloids are thrilled. Your therapist would not be thrilled.",
    minStats: { fame: 25 },
    weight: 5,
    once: true,
    tags: ["relationships", "press"],
    options: [
      {
        label: "Go public",
        hint: "Complicated",
        outcomes: [
          {
            text: "The internet gives you a couple name. It's terrible. The attention is not.",
            effects: { fame: 8, publicPerception: 5, burnout: 4 },
            flags: { publicCouple: true },
          },
        ],
      },
      {
        label: "Keep it private",
        hint: "Disciplined",
        outcomes: [
          {
            text: "You become experts at separate exits and decoy cars. It's exhausting and kind of great.",
            effects: { burnout: 3 },
            flags: { privateCouple: true },
          },
        ],
      },
    ],
  },
  {
    id: "social_media",
    place: "Los Angeles",
    text: "Your publicist insists you need a social media presence. 'The studio checks follower counts now.' This is apparently true.",
    minStats: { fame: 20 },
    weight: 6,
    once: true,
    tags: ["social", "press"],
    options: [
      {
        label: "Post authentically",
        hint: "Unpredictable",
        chance: 0.5,
        modifiers: { luck: 0.25, publicPerception: 0.2 },
        setFlags: { onSocialMedia: true },
        outcomes: [
          {
            text: "Your unfiltered posts become a minor phenomenon. Millions of followers. Studios suddenly see 'engagement'.",
            effects: { fame: 9, publicPerception: 7, culturalImpact: 4, influence: 3 },
          },
          {
            text: "A joke from 2 a.m. resurfaces without context. You spend a week apologizing to people you've never met.",
            effects: { publicPerception: -10, fame: 3, burnout: 7 },
          },
        ],
      },
      {
        label: "Let the team run it",
        hint: "Safe",
        outcomes: [
          {
            text: "Your account posts like a friendly corporation. Nobody is offended. Nobody is anything.",
            effects: { fame: 2 },
            flags: { onSocialMedia: true },
          },
        ],
      },
    ],
  },
  {
    id: "cult_movie",
    place: "Los Angeles",
    text: "A box-office flop you made years ago has become a midnight-screening phenomenon. College kids know every line. There is merch.",
    minStats: { failedMovies: 2 },
    minAge: 30,
    weight: 6,
    once: true,
    tags: ["cult", "memory"],
    options: [
      {
        label: "Embrace the cult",
        hint: "Fun",
        outcomes: [
          {
            text: "You do the midnight screenings. The Q&As. The conventions. A generation adopts you as theirs.",
            money: 150_000,
            effects: { fame: 6, publicPerception: 8, culturalImpact: 12, legacy: 5 },
            flags: { cultIcon: true },
          },
        ],
      },
      {
        label: "Distance yourself",
        hint: "Proud",
        outcomes: [
          { text: "You were trying to be serious. The kids keep cheering anyway.", effects: { ego: 2, culturalImpact: 2 } },
        ],
      },
    ],
  },
  {
    id: "box_office_bomb",
    place: "Los Angeles",
    text: "Your big movie opens to empty theaters. $120M spent, $9M back. The trades are writing autopsies with your name in the headline.",
    minStats: { fame: 40, leadingRoles: 1 },
    weight: 5,
    once: true,
    tags: ["disaster", "boxoffice"],
    options: [
      {
        label: "Disappear for a while",
        hint: "Recover",
        outcomes: [
          {
            text: "You read scripts in a house with no press. The industry has a short memory if you let it forget.",
            effects: { burnout: -8, fame: -5, reputation: -3, failedMovies: 1 },
            flags: { hadBomb: true },
          },
        ],
      },
      {
        label: "Do the apology press tour",
        hint: "Humiliating",
        danger: true,
        chance: 0.5,
        modifiers: { publicPerception: 0.2, luck: 0.15 },
        outcomes: [
          {
            text: "Your self-deprecating honesty plays well. People root for a good loser.",
            effects: { publicPerception: 6, reputation: 2, failedMovies: 1, burnout: 8 },
            flags: { hadBomb: true },
          },
          {
            text: "You blame the marketing on live television. The studio does not forget this. Neither does the internet.",
            effects: { industryRespect: -8, publicPerception: -8, failedMovies: 1, influence: -5 },
            flags: { hadBomb: true, blamedStudio: true },
          },
        ],
      },
    ],
  },
  {
    id: "comeback_indie",
    place: "Los Angeles",
    text: "After the bomb, the only offer is a tiny indie from a director who 'always loved your work'. The irony is not lost on you.",
    requiresFlags: { hadBomb: true },
    weight: 9,
    tags: ["comeback", "indie", "memory"],
    options: [
      {
        label: "Take the humble role",
        hint: "Rebuilding",
        chance: 0.5,
        modifiers: { talent: 0.3, reputation: 0.2, luck: 0.15 },
        outcomes: [
          {
            text: "You remind everyone what you can actually do. 'Welcome back,' says the review. You pretend you never left.",
            money: 120_000,
            effects: { reputation: 10, industryRespect: 6, movies: 1, successfulMovies: 1, fame: 5 },
            flags: { comeback: true, survivedDisaster: true },
          },
          {
            text: "The indie vanishes. The comeback narrative needs a new chapter.",
            money: 120_000,
            effects: { reputation: 2, movies: 1, failedMovies: 1, burnout: 6 },
          },
        ],
      },
      {
        label: "Wait for a big offer",
        hint: "Proud",
        outcomes: [
          { text: "You wait. The phone's silence develops a personality.", effects: { ego: 3, fame: -3 } },
        ],
      },
    ],
  },
  {
    id: "mansion_buy",
    place: "Beverly Hills",
    text: "Your business manager mentions a 'great opportunity': a $14M mansion. 'Everyone at your level has one.' Everyone at your level also goes bankrupt sometimes, he doesn't add.",
    minStats: { money: 8_000_000, fame: 35 },
    weight: 6,
    once: true,
    tags: ["money", "lifestyle"],
    options: [
      {
        label: "Buy the mansion",
        hint: "$14M",
        outcomes: [
          {
            text: "Eleven bathrooms. You use two. The property taxes have their own gravitational field.",
            money: -14_000_000,
            effects: { ego: 6, financialRisk: 12, publicPerception: 3 },
            flags: { mansion: true },
          },
        ],
      },
      {
        label: "Keep the house you have",
        hint: "Boring",
        outcomes: [
          { text: "Your three bedrooms suffice. Your accountant sends a fruit basket.", effects: { financialRisk: -5 } },
        ],
      },
    ],
  },
  {
    id: "restaurant_investment",
    place: "Los Angeles",
    text: "A friend wants you to invest in a restaurant. 'Celebrities do it all the time,' he says, unaware of how that sentence ends.",
    minStats: { money: 2_000_000 },
    weight: 5,
    once: true,
    tags: ["money", "investment"],
    options: [
      {
        label: "Invest $500K",
        hint: "Risky",
        danger: true,
        chance: 0.3,
        modifiers: { luck: 0.4 },
        outcomes: [
          {
            text: "The restaurant becomes a scene. You eat free and get a cut. This almost never happens.",
            money: 900_000,
            effects: { financialRisk: 5 },
          },
          {
            text: "The restaurant closes in eleven months. Your name is in the lawsuit section of a food blog.",
            money: -500_000,
            effects: { financialRisk: 10, burnout: 3 },
          },
        ],
      },
      {
        label: "Decline",
        hint: "Safe",
        outcomes: [{ text: "He opens it anyway. It closes anyway. You feel nothing, deliciously.", effects: {} }],
      },
    ],
  },
  {
    id: "crypto_pitch",
    place: "Los Angeles",
    text: "An actor you know is launching a coin. He wants your face on it. 'It's basically free money,' he says, twirling a fidget spinner made of gold.",
    minStats: { fame: 30, money: 3_000_000 },
    weight: 5,
    once: true,
    tags: ["money", "scam", "funny"],
    options: [
      {
        label: "Lend your face",
        hint: "Very risky",
        danger: true,
        chance: 0.25,
        modifiers: { luck: 0.45 },
        outcomes: [
          {
            text: "The coin moons, then dies. You sold at the top by pure accident. Never speak of this.",
            money: 2_500_000,
            effects: { financialRisk: 8 },
          },
          {
            text: "The coin collapses. Your face is in the class-action lawsuit. The lawyer's letters are long.",
            money: -800_000,
            effects: { publicPerception: -12, reputation: -6, financialRisk: 10 },
            flags: { scandalMarked: true },
          },
        ],
      },
      {
        label: "Walk away slowly",
        hint: "Safe",
        outcomes: [
          { text: "Six months later his coin is a punchline and he is in Dubai 'for a while'.", effects: { reputation: 1 } },
        ],
      },
    ],
  },
  {
    id: "assistant_incident",
    place: "Los Angeles",
    text: "Your new assistant mixes up your call times for the third time. She's trying hard. You are exhausted and famous and the words are right there.",
    minStats: { fame: 35 },
    weight: 5,
    once: true,
    tags: ["ego", "memory", "relationships"],
    options: [
      {
        label: "Let her have it",
        hint: "It would feel good",
        outcomes: [
          {
            text: "You say things. She quits in tears. The set goes quiet in a particular way.",
            effects: { ego: 5, industryRespect: -3, publicPerception: -2 },
            flags: { treatedAssistantBadly: true },
          },
        ],
      },
      {
        label: "Breathe. Help her fix it.",
        hint: "Kind",
        outcomes: [
          {
            text: "You walk her through it. She never makes the mistake again. She never forgets you either.",
            effects: { industryRespect: 2, burnout: -2 },
            flags: { treatedAssistantWell: true },
          },
        ],
      },
    ],
  },
  {
    id: "tell_all_interview",
    place: "Los Angeles",
    text: "A long-form magazine profile. The journalist is friendly, patient, and famously lethal. She wants 'the real you'.",
    minStats: { fame: 40 },
    weight: 5,
    tags: ["press"],
    options: [
      {
        label: "Be honest",
        hint: "Unpredictable",
        chance: 0.5,
        modifiers: { reputation: 0.2, luck: 0.2 },
        outcomes: [
          {
            text: "The profile is extraordinary — raw, funny, human. People clip quotes from it for years.",
            effects: { publicPerception: 10, reputation: 5, culturalImpact: 5, fame: 4 },
          },
          {
            text: "Your honest anecdote about a co-star becomes the only sentence anyone reads. Lawyers get involved.",
            effects: { publicPerception: -8, industryRespect: -6, fame: 3 },
            flags: { scandalMarked: true },
          },
        ],
      },
      {
        label: "Give nothing",
        hint: "Safe",
        outcomes: [
          { text: "The profile is 4,000 words of polite nothing. It wins no awards. It loses nothing either.", effects: {} },
        ],
      },
    ],
  },
  {
    id: "sequel_machine",
    place: "Los Angeles",
    text: "The studio wants a sequel to your hit. Then a third. The contracts are escalators — each one doubles your fee and halves your soul.",
    minStats: { successfulMovies: 3, fame: 45 },
    weight: 6,
    tags: ["sequel", "money", "franchise"],
    options: [
      {
        label: "Sign for both",
        hint: "$15M+",
        outcomes: [
          {
            text: "Two more rides on the machine. The money is generational. The characters are not.",
            money: 15_000_000,
            effects: { fame: 10, movies: 2, successfulMovies: 1, failedMovies: 1, reputation: -5, burnout: 14, culturalImpact: 4 },
          },
        ],
      },
      {
        label: "One and done",
        hint: "Measured",
        outcomes: [
          {
            text: "You take one sequel, on your terms, with script approval. The studio grumbles. The film is decent.",
            money: 8_000_000,
            effects: { fame: 6, movies: 1, successfulMovies: 1, influence: 4, burnout: 7 },
          },
        ],
      },
    ],
  },
  {
    id: "burnout_warning",
    place: "Los Angeles",
    text: "You fall asleep in the makeup chair. Your doctor mentions 'exhaustion'. Your agent mentions two more offers. Your body is keeping a ledger.",
    minStats: { burnout: 55, fame: 20 },
    weight: (s) => (s.stats.burnout > 70 ? 14 : 6),
    tags: ["burnout", "health"],
    options: [
      {
        label: "Take six months off",
        hint: "Expensive",
        outcomes: [
          {
            text: "You sleep, read, remember your own name. The town moves fast — some momentum is gone. You don't entirely mind.",
            effects: { burnout: -35, fame: -4, talent: 2 },
          },
        ],
      },
      {
        label: "Push through",
        hint: "Dangerous",
        danger: true,
        chance: 0.6,
        modifiers: { luck: 0.3, burnout: -0.4 },
        outcomes: [
          {
            text: "You deliver the performances anyway. Nobody knows what it cost. You do.",
            money: 600_000,
            effects: { burnout: 18, reputation: 3 },
          },
          {
            text: "You collapse on set. The trades call it 'exhaustion'. The hospital calls it a warning.",
            effects: { burnout: 25, fame: -3, publicPerception: 3 },
            flags: { collapsed: true },
          },
        ],
      },
    ],
  },
  {
    id: "golden_globe",
    place: "Beverly Hills",
    text: "A Golden Globe nomination. The ceremony is famous for open wine and loose tongues. You're seated next to your rival.",
    minStats: { awards: 0, reputation: 30 },
    maxStats: { awards: 3 },
    weight: 5,
    tags: ["awards"],
    options: [
      {
        label: "Attend and enjoy it",
        hint: "Good chance",
        chance: 0.5,
        modifiers: { reputation: 0.2, luck: 0.25 },
        outcomes: [
          {
            text: "You win. The speech is short, the wine is long, and Hollywood hugs you for one warm evening.",
            effects: { awards: 1, fame: 6, industryRespect: 6, reputation: 4 },
          },
          {
            text: "You lose gracefully on camera. The clip of your genuine smile does more than the trophy would have.",
            effects: { publicPerception: 5, industryRespect: 2 },
          },
        ],
      },
      {
        label: "Skip it",
        hint: "Aloof",
        outcomes: [
          { text: "Your absence is noted. Whether as mystique or snub depends on who you ask.", effects: { ego: 2 } },
        ],
      },
    ],
  },
  {
    id: "indie_40k_returns_taken",
    place: "Los Angeles",
    text: (s) => {
      const yrs = s.stats.age - 25;
      return `Remember that strange $40k indie you made all those years ago? It's being restored by a prestigious film archive. ${yrs > 15 ? "Critics call it a lost masterpiece." : "A cult following has formed around it."}`;
    },
    requiresFlags: { tookIndie40k: true },
    minAge: 38,
    weight: 10,
    once: true,
    tags: ["memory", "cult", "legacy"],
    options: [
      {
        label: "Attend the restoration premiere",
        hint: "Poetic",
        outcomes: [
          {
            text: "A packed theater watches your 23-year-old face do things you forgot you could do. The ovation is long. Something in your chest unlocks.",
            effects: { reputation: 8, legacy: 8, culturalImpact: 10, industryRespect: 6, fame: 4 },
            flags: { cultIcon: true },
          },
        ],
      },
      {
        label: "Send a nice statement",
        hint: "Busy",
        outcomes: [
          { text: "The archive thanks you. The moment passes, smaller than it could have been.", effects: { reputation: 2, legacy: 3 } },
        ],
      },
    ],
  },
  {
    id: "indie_40k_returns_rejected",
    place: "Los Angeles",
    text: "Remember that $40k indie movie you rejected? It made $620M. The actor who replaced you just won his third Oscar. The trades would like a comment.",
    requiresFlags: { rejectedIndie40k: true },
    minAge: 40,
    weight: 10,
    once: true,
    tags: ["memory", "regret"],
    options: [
      {
        label: "Congratulate him publicly",
        hint: "Graceful",
        outcomes: [
          {
            text: "Your gracious note goes mildly viral. 'Class act,' everyone says, while you quietly re-read the old email at 3 a.m.",
            effects: { publicPerception: 6, reputation: 3, ego: -6, burnout: 4 },
          },
        ],
      },
      {
        label: "Decline to comment",
        hint: "Human",
        outcomes: [
          {
            text: "You say nothing. Somewhere there is a parallel life where you said yes. You try not to visit it too often.",
            effects: { ego: -4, burnout: 5 },
          },
        ],
      },
    ],
  },
  {
    id: "role_offer_working",
    place: "Los Angeles",
    text: "A role in a working production — nothing glamorous, but it's a real part in a real movie. The town runs on people who say yes to these.",
    minStats: { fame: 5 },
    maxStats: { fame: 45 },
    weight: 12,
    tags: ["work", "movie"],
    options: [
      {
        label: "Take the part",
        hint: "Steady",
        chance: 0.5,
        modifiers: { talent: 0.25, luck: 0.15 },
        outcomes: [
          {
            text: "Solid work. The film does well enough, and you're the kind of actor directors call back.",
            money: 120_000,
            effects: { movies: 1, successfulMovies: 1, fame: 4, reputation: 2, industryRespect: 2 },
          },
          {
            text: "The film sinks without a ripple. You were good in it; nobody will ever know.",
            money: 120_000,
            effects: { movies: 1, failedMovies: 1, fame: 2, burnout: 3 },
          },
        ],
      },
      {
        label: "Pass",
        hint: "Selective",
        outcomes: [{ text: "You wait for something worthier. Waiting is also a career strategy, allegedly.", effects: { reputation: 1 } }],
      },
    ],
  },
  {
    id: "role_offer_star",
    place: "Los Angeles",
    text: "A studio offers you a major role in their fall release. Real budget, real co-stars, a release date already printed on posters that don't exist yet.",
    minStats: { fame: 40 },
    weight: 12,
    tags: ["work", "movie", "studio"],
    options: [
      {
        label: "Sign on",
        hint: "$2.5M",
        chance: 0.55,
        modifiers: { talent: 0.25, fame: 0.15, luck: 0.15 },
        outcomes: [
          {
            text: "The film lands. Your performance is the consensus highlight, and the box office backs it up.",
            money: 2_500_000,
            effects: { movies: 1, successfulMovies: 1, fame: 8, reputation: 4, industryRespect: 3, leadingRoles: 1, culturalImpact: 2, legacy: 2 },
          },
          {
            text: "The film disappoints. Not a catastrophe — just another entry in the 'what happened?' column.",
            money: 2_500_000,
            effects: { movies: 1, failedMovies: 1, fame: 3, reputation: -2, burnout: 5 },
          },
        ],
      },
      {
        label: "Pass",
        hint: "Selective",
        outcomes: [{ text: "You hold out for something better. The calendar does not care.", effects: { ego: 2 } }],
      },
    ],
  },
  {
    id: "young_director_returns",
    place: "Los Angeles",
    text: "The young director you once took a chance on is now one of the most sought-after filmmakers alive. She has written a role for you. Only you.",
    requiresFlags: { helpedYoungDirector: true },
    minAge: 40,
    weight: 10,
    once: true,
    tags: ["memory", "reward", "lead"],
    options: [
      {
        label: "Read the script",
        hint: "She earned it",
        chance: 0.65,
        modifiers: { talent: 0.25, luck: 0.15 },
        outcomes: [
          {
            text: "The role of a lifetime, written with your voice in her head. The film sweeps the season. Loyalty, it turns out, compounds.",
            money: 2_000_000,
            effects: { oscars: 1, awards: 1, reputation: 10, industryRespect: 10, legacy: 10, leadingRoles: 1, movies: 1, successfulMovies: 1, fame: 10 },
            flags: { loyaltyPaidOff: true },
          },
          {
            text: "The script is ambitious and strange. The film divides critics. But the performance is one for the reel they play when you're gone.",
            money: 1_200_000,
            effects: { reputation: 8, industryRespect: 6, legacy: 6, leadingRoles: 1, movies: 1, failedMovies: 1 },
          },
        ],
      },
      {
        label: "Too busy",
        hint: "Honestly?",
        outcomes: [
          { text: "She understands. She casts someone else. The role wins things. You understand too.", effects: { ego: -3 } },
        ],
      },
    ],
  },
  {
    id: "director_owes_you",
    place: "Los Angeles",
    text: "The director who promised you 'next one, I mean it' is back. He's making his dream project and the lead is yours if you want it.",
    requiresFlags: { directorOwesYou: true },
    minAge: 32,
    weight: 10,
    once: true,
    tags: ["memory", "reward", "lead"],
    options: [
      {
        label: "Take it",
        hint: "He meant it",
        chance: 0.6,
        modifiers: { talent: 0.3, luck: 0.15 },
        outcomes: [
          {
            text: "He directs you to the performance of your career. Some promises in this town are real.",
            money: 1_500_000,
            effects: { leadingRoles: 1, movies: 1, successfulMovies: 1, reputation: 9, industryRespect: 8, fame: 8, awards: 1 },
          },
          {
            text: "The dream project dies in the edit. But his next three films all have your name penciled in.",
            money: 800_000,
            effects: { leadingRoles: 1, movies: 1, failedMovies: 1, connections: 4 },
          },
        ],
      },
    ],
  },
];
