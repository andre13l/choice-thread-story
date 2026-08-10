/**
 * PATHS — HOLLYWOOD content pack, part 1: the early years.
 * Unknown actor → extra → commercials → low-budget anything.
 */

import type { GameEvent } from "../types";

export const earlyEvents: GameEvent[] = [
  {
    id: "restaurant_audition",
    place: "Los Angeles",
    text: "You're working nights at a restaurant. A customer tells you they're casting a low-budget horror movie tomorrow morning. You have a shift.",
    maxAge: 30,
    maxStats: { fame: 12 },
    weight: 10,
    tags: ["audition", "horror"],
    options: [
      {
        label: "Skip work and audition",
        hint: "12%",
        danger: true,
        chance: 0.14,
        modifiers: { talent: 0.35, luck: 0.25, connections: 0.1 },
        setFlags: { skippedShift: true },
        outcomes: [
          {
            text: "You got the part. The movie is terrible. Nobody cares. But someone on set remembers your name.",
            money: 800,
            effects: { fame: 4, connections: 3, movies: 1 },
            flags: { horrorMovie: true },
          },
          {
            text: "You didn't get the part. You also no longer have a job.",
            money: -300,
            effects: { burnout: 6 },
          },
        ],
      },
      {
        label: "Keep your shift",
        hint: "Safe",
        outcomes: [
          {
            text: "You serve forty-one tables. One of them was definitely a producer. He tipped nine percent.",
            money: 180,
            effects: { reputation: 1 },
          },
        ],
      },
    ],
  },
  {
    id: "headshots",
    place: "Los Angeles",
    text: "Every casting director says your headshots are holding you back. A real photographer costs $400 you don't really have.",
    maxAge: 32,
    maxStats: { fame: 15 },
    weight: 7,
    tags: ["money", "career"],
    options: [
      {
        label: "Pay for real headshots",
        hint: "$400",
        chance: 0.55,
        modifiers: { talent: 0.1, luck: 0.15 },
        outcomes: [
          {
            text: "The photos are good. Suddenly your agent — well, your voicemail — starts getting returned.",
            money: -400,
            effects: { connections: 4, reputation: 2 },
          },
          {
            text: "The photos make you look like a suspect in a documentary. You use them anyway.",
            money: -400,
            effects: { burnout: 3 },
          },
        ],
      },
      {
        label: "Have your roommate take them",
        hint: "Free",
        outcomes: [
          {
            text: "Your roommate took 240 photos of you blinking. One is usable. Barely.",
            effects: { reputation: 1 },
          },
        ],
      },
    ],
  },
  {
    id: "acting_class",
    place: "Los Angeles",
    text: "A respected acting coach is taking new students. $600 for eight weeks. Half the town's working actors trained with her.",
    maxAge: 34,
    maxStats: { fame: 20 },
    weight: 7,
    tags: ["training"],
    options: [
      {
        label: "Enroll",
        hint: "$600",
        outcomes: [
          {
            text: "She makes you cry in week two and call it progress. By week eight, you're genuinely better.",
            money: -600,
            effects: { talent: 4, connections: 3, reputation: 2 },
          },
        ],
      },
      {
        label: "Teach yourself from YouTube",
        hint: "Free",
        outcomes: [
          {
            text: "You watch forty hours of acting tutorials. You learn mostly about lighting.",
            effects: { talent: 1, burnout: 2 },
          },
        ],
      },
    ],
  },
  {
    id: "extra_work",
    place: "Los Angeles",
    text: "Central Casting calls: three days as a background extra on a network drama. Standing. Nodding. Pretending to talk.",
    maxStats: { fame: 25 },
    weight: 9,
    tags: ["extra", "money"],
    options: [
      {
        label: "Take the work",
        hint: "$640",
        chance: 0.15,
        modifiers: { luck: 0.3, connections: 0.15 },
        outcomes: [
          {
            text: "On day two, the director notices you in the background and gives you a line. One line. It's a start.",
            money: 640,
            effects: { fame: 3, connections: 2, reputation: 1 },
            flags: { hadOneLine: true },
          },
          {
            text: "Three days of pretending to sip coffee. In the final cut, you are a blurry shoulder.",
            money: 640,
            effects: { burnout: 4 },
          },
        ],
      },
      {
        label: "Hold out for real roles",
        hint: "Risky",
        danger: true,
        outcomes: [
          {
            text: "You spend the week auditioning for things you don't get. Your integrity remains flawless and unfed.",
            money: -150,
            effects: { reputation: 1, burnout: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "cheesy_commercial",
    place: "Los Angeles",
    text: "An audition for a regional mattress commercial. The catchphrase is humiliating. The check is not.",
    maxStats: { fame: 30 },
    weight: 8,
    tags: ["commercial", "money"],
    options: [
      {
        label: "Audition for it",
        hint: "43%",
        chance: 0.43,
        modifiers: { talent: 0.15, luck: 0.2, connections: 0.1 },
        outcomes: [
          {
            text: "You got it. You will now be 'the mattress guy' in three states. Residuals trickle in for months.",
            money: 3500,
            effects: { fame: 3, reputation: -1 },
            flags: { commercialFace: true },
          },
          {
            text: "They went with someone more 'mattress-adjacent'. You didn't know that was a thing either.",
            effects: { burnout: 2 },
          },
        ],
      },
      {
        label: "Pass — it's beneath you",
        hint: "Safe",
        outcomes: [
          {
            text: "Your dignity survives. Your rent does not.",
            money: -200,
            effects: { ego: 3, reputation: 1 },
          },
        ],
      },
    ],
  },
  {
    id: "shady_agent",
    place: "Los Angeles",
    text: "A man named Sal says he can make you a star. He wants 25% of everything and has a storefront office next to a bail bonds place.",
    maxAge: 33,
    maxStats: { fame: 18 },
    weight: 7,
    once: true,
    tags: ["agent"],
    options: [
      {
        label: "Sign with Sal",
        hint: "Risky",
        danger: true,
        chance: 0.4,
        modifiers: { luck: 0.35 },
        setFlags: { shadyAgent: true },
        outcomes: [
          {
            text: "Sal is a shark, but he's your shark. Doors start opening. You stop asking how.",
            effects: { connections: 8, fame: 3, financialRisk: 8 },
          },
          {
            text: "Sal books you on two informercials and 'invests' your earnings for you. You never see the money.",
            money: -500,
            effects: { connections: 2, financialRisk: 5, burnout: 4 },
          },
        ],
      },
      {
        label: "Stay unrepresented",
        hint: "Safe",
        outcomes: [
          {
            text: "You keep your 100% of nothing.",
            effects: { reputation: 1 },
          },
        ],
      },
    ],
  },
  {
    id: "student_film",
    place: "Los Angeles",
    text: "A film school student offers you the lead in her thesis short. No pay. She seems genuinely talented.",
    maxStats: { fame: 30 },
    weight: 7,
    tags: ["indie", "relationships"],
    options: [
      {
        label: "Do it for free",
        hint: "Uncertain",
        chance: 0.35,
        modifiers: { luck: 0.3, talent: 0.1 },
        setFlags: { helpedYoungDirector: true },
        outcomes: [
          {
            text: "The short plays at a festival. A critic calls your performance 'unnervingly good'. She promises she'll remember you.",
            effects: { reputation: 4, connections: 3, culturalImpact: 2 },
          },
          {
            text: "The short is unwatchable. But she graduates, and she means it when she says she owes you.",
            effects: { connections: 3, burnout: 2 },
          },
        ],
      },
      {
        label: "Ask for money",
        hint: "Fair",
        outcomes: [
          {
            text: "She can't pay. You pass. Someone else does it.",
            effects: { reputation: 1 },
            flags: { rejectedYoungDirector: true },
          },
        ],
      },
    ],
  },
  {
    id: "indie_40k",
    place: "Los Angeles",
    text: "A young unknown director offers you a role in a strange independent movie. Budget: $40,000. The script makes no sense. He seems to think it's a masterpiece.",
    minAge: 20,
    maxAge: 35,
    maxStats: { fame: 35 },
    weight: 8,
    once: true,
    tags: ["indie", "memory", "pivotal"],
    options: [
      {
        label: "Take the role",
        hint: "Very unlikely to matter",
        setFlags: { tookIndie40k: true },
        outcomes: [
          {
            text: "Three weeks in the desert, sleeping in the director's van. The film wraps. Nobody will ever see it. Probably.",
            money: 900,
            effects: { reputation: 3, talent: 2, burnout: 5 },
          },
        ],
      },
      {
        label: "Politely decline",
        hint: "Safe",
        setFlags: { rejectedIndie40k: true },
        outcomes: [
          {
            text: "You have rent to think about. He nods, disappointed, and casts someone else.",
            effects: { reputation: 1 },
          },
        ],
      },
    ],
  },
  {
    id: "improv_troupe",
    place: "Los Angeles",
    text: "An improv troupe with a cult following needs a new member. Tuesday nights, no pay, an audience of nineteen people.",
    maxStats: { fame: 25 },
    weight: 6,
    tags: ["training", "connections"],
    options: [
      {
        label: "Join the troupe",
        hint: "Slow",
        chance: 0.3,
        modifiers: { talent: 0.25, luck: 0.2 },
        outcomes: [
          {
            text: "A talent scout catches a show. She laughs at exactly one performer. It's you.",
            effects: { talent: 3, connections: 5, fame: 2 },
          },
          {
            text: "Two years of 'yes, and'. You become genuinely funny. The industry does not notice.",
            effects: { talent: 3, connections: 2, burnout: 3 },
          },
        ],
      },
      {
        label: "Skip it",
        hint: "Safe",
        outcomes: [{ text: "Tuesdays remain yours.", effects: { burnout: -2 } }],
      },
    ],
  },
  {
    id: "industry_party",
    place: "Hollywood Hills",
    text: "You're catering a party in the Hills. Half the guest list is in the trades. Staff are strictly forbidden from pitching.",
    maxStats: { fame: 20 },
    weight: 7,
    tags: ["connections", "risk"],
    options: [
      {
        label: "Pitch the producer by the pool",
        hint: "Very unlikely",
        danger: true,
        chance: 0.1,
        modifiers: { luck: 0.4, talent: 0.1 },
        outcomes: [
          {
            text: "He's drunk enough to find it charming. 'Call my office Monday.' He actually answers.",
            money: 250,
            effects: { connections: 7, fame: 1 },
          },
          {
            text: "Security walks you out past the valet stand. You are now a cautionary tale at catering companies.",
            effects: { connections: -2, reputation: -2, burnout: 4 },
          },
        ],
      },
      {
        label: "Do your job",
        hint: "Safe",
        outcomes: [
          {
            text: "You refill champagne and memorize faces. Knowledge is a kind of capital.",
            money: 320,
            effects: { connections: 1 },
          },
        ],
      },
    ],
  },
  {
    id: "cattle_call",
    place: "Burbank",
    text: "Open call for a soap opera. Four hundred people, two roles, a casting director who has already seen everything.",
    maxStats: { fame: 25 },
    weight: 7,
    tags: ["audition"],
    options: [
      {
        label: "Wait all day",
        hint: "4%",
        danger: true,
        chance: 0.06,
        modifiers: { talent: 0.3, luck: 0.3 },
        outcomes: [
          {
            text: "You get the role of 'Concerned Neighbor'. Recurring. Six episodes. Actual lines.",
            money: 4200,
            effects: { fame: 5, connections: 2, reputation: 2 },
            flags: { soapRole: true },
          },
          {
            text: "Nine hours. Your number is never called. You learn a lot about folding chairs.",
            effects: { burnout: 6 },
          },
        ],
      },
      {
        label: "Walk out",
        hint: "Safe",
        outcomes: [
          { text: "The odds were insulting. Your afternoon is your own.", effects: { burnout: -2 } },
        ],
      },
    ],
  },
  {
    id: "horror_sequel",
    place: "Los Angeles",
    text: "The director of that terrible horror movie is making a sequel. Same role, slightly more money, zero artistic ambition.",
    requiresFlags: { horrorMovie: true },
    maxStats: { fame: 30 },
    weight: 8,
    tags: ["horror", "sequel", "memory"],
    options: [
      {
        label: "Do the sequel",
        hint: "$2,400",
        outcomes: [
          {
            text: "Blood, screaming, a puppet that costs less than your lunch. But you learn how a set really works.",
            money: 2400,
            effects: { fame: 2, movies: 1, connections: 2, reputation: -1 },
            flags: { horrorSequel: true },
          },
        ],
      },
      {
        label: "Decline — move up or starve",
        hint: "Risky",
        danger: true,
        outcomes: [
          {
            text: "You decide you are not a horror actor. The industry has not been consulted on this.",
            effects: { reputation: 2, ego: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "viral_jingle",
    place: "Los Angeles",
    text: "A jingle you recorded for a local car dealership has become a meme. People are remixing it. Your face is in all of them.",
    requiresFlags: { commercialFace: true },
    maxStats: { fame: 45 },
    weight: 9,
    once: true,
    tags: ["viral", "memory"],
    options: [
      {
        label: "Lean into the joke",
        hint: "Unpredictable",
        chance: 0.55,
        modifiers: { luck: 0.25, publicPerception: 0.2 },
        setFlags: { jingleViral: true },
        outcomes: [
          {
            text: "You duet your own meme. The internet decides you're in on it. Bookings follow.",
            money: 3000,
            effects: { fame: 7, publicPerception: 8, connections: 3 },
          },
          {
            text: "You duet your own meme. The internet decides you're desperate. The remixes get meaner.",
            effects: { fame: 4, publicPerception: -8, reputation: -3 },
          },
        ],
      },
      {
        label: "Ignore it completely",
        hint: "Safe",
        outcomes: [
          {
            text: "It burns itself out in two weeks. You pretend it never happened. So does everyone else, eventually.",
            effects: { publicPerception: 1 },
          },
        ],
      },
    ],
  },
  {
    id: "assistant_job",
    place: "Los Angeles",
    text: "A mid-level producer needs an assistant. Terrible hours, worse pay, but you'd be inside the machine.",
    maxAge: 34,
    maxStats: { fame: 15 },
    weight: 6,
    once: true,
    tags: ["industry", "connections"],
    options: [
      {
        label: "Take the job",
        hint: "Grinding",
        outcomes: [
          {
            text: "Eighteen months of coffee, scripts and quiet observation. You learn who actually decides things.",
            money: 9000,
            effects: { connections: 6, industryRespect: 2, burnout: 10, talent: -1 },
            flags: { wasAssistant: true },
          },
        ],
      },
      {
        label: "Stay an actor, only an actor",
        hint: "Pure",
        outcomes: [
          { text: "The machine remains a mystery. Your dream remains unsullied.", effects: { reputation: 1 } },
        ],
      },
    ],
  },
  {
    id: "stunt_work",
    place: "Los Angeles",
    text: "A stunt coordinator needs someone your size for a 'simple' fall off a second-story roof. Pays triple.",
    maxStats: { fame: 25 },
    weight: 5,
    tags: ["risk", "money"],
    options: [
      {
        label: "Take the fall",
        hint: "Risky",
        danger: true,
        chance: 0.7,
        modifiers: { luck: 0.4 },
        outcomes: [
          {
            text: "You land it in two takes. The stunt crew adopts you. These people know everyone.",
            money: 1800,
            effects: { connections: 4, burnout: 3 },
          },
          {
            text: "You land it wrong. Six weeks on crutches and a new relationship with painkillers.",
            money: 900,
            effects: { burnout: 12, talent: -1 },
            flags: { stuntInjury: true },
          },
        ],
      },
      {
        label: "Decline",
        hint: "Safe",
        outcomes: [{ text: "Your spine thanks you.", effects: {} }],
      },
    ],
  },
  {
    id: "day_job_promotion",
    place: "Los Angeles",
    text: "The restaurant offers you assistant manager. Real money, health insurance, and no time left for auditions.",
    maxAge: 35,
    maxStats: { fame: 12 },
    weight: 6,
    once: true,
    tags: ["money", "crossroads"],
    options: [
      {
        label: "Take the promotion",
        hint: "Comfortable",
        outcomes: [
          {
            text: "You have savings now. Auditions become a weekend thing. Something quiet dims a little.",
            money: 8000,
            effects: { burnout: -5, talent: -2, connections: -2 },
            flags: { tookDayJob: true },
          },
        ],
      },
      {
        label: "Turn it down",
        hint: "All in",
        danger: true,
        outcomes: [
          {
            text: "Your boss thinks you're insane. Maybe. But the dream stays on life support.",
            effects: { riskTolerance: 5, burnout: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "web_series",
    place: "Los Angeles",
    text: "Your roommate's friend is shooting a web series in the apartment. Zero budget. The script is, surprisingly, funny.",
    maxStats: { fame: 20 },
    weight: 7,
    tags: ["indie", "viral"],
    options: [
      {
        label: "Play the lead",
        hint: "Uncertain",
        chance: 0.22,
        modifiers: { luck: 0.35, talent: 0.15 },
        outcomes: [
          {
            text: "Episode three hits two million views. Agents you've never heard of are suddenly in the comments.",
            effects: { fame: 8, connections: 5, culturalImpact: 3 },
            flags: { webSeriesHit: true },
          },
          {
            text: "Twelve episodes, four hundred views, mostly your parents. It was fun, at least.",
            effects: { talent: 2, burnout: 2 },
          },
        ],
      },
      {
        label: "Pass",
        hint: "Safe",
        outcomes: [{ text: "Your bedroom remains your own.", effects: {} }],
      },
    ],
  },
  {
    id: "cult_coach",
    place: "Los Angeles",
    text: "An acting guru with a waiting list and intense eyes offers you a 'breakthrough intensive'. $2,000. His alumni swear by him. They swear a lot, actually.",
    maxStats: { fame: 25 },
    weight: 5,
    once: true,
    tags: ["training", "weird"],
    options: [
      {
        label: "Do the intensive",
        hint: "Strange",
        danger: true,
        chance: 0.45,
        modifiers: { luck: 0.3 },
        outcomes: [
          {
            text: "Whatever happened in that warehouse, it worked. You walk differently now. Casting directors notice.",
            money: -2000,
            effects: { talent: 5, reputation: 2, burnout: 6 },
          },
          {
            text: "You spend a weekend pretending to be a tree for $2,000. You do gain an unusual tolerance for embarrassment.",
            money: -2000,
            effects: { talent: 1, ego: -3, burnout: 5 },
          },
        ],
      },
      {
        label: "Politely flee",
        hint: "Safe",
        outcomes: [{ text: "You remain unbreakthrough'd.", effects: {} }],
      },
    ],
  },
  {
    id: "pilot_season",
    place: "Los Angeles",
    text: "Pilot season. Every actor in the city is auditioning for everything. Your agent has four auditions lined up this week.",
    minStats: { connections: 12 },
    maxStats: { fame: 30 },
    weight: 8,
    tags: ["audition", "tv"],
    options: [
      {
        label: "Do all four",
        hint: "Exhausting",
        chance: 0.18,
        modifiers: { talent: 0.3, connections: 0.2, luck: 0.2, burnout: -0.3 },
        outcomes: [
          {
            text: "One of them lands: a recurring role on a mid-tier network show. You're on television. Actual television.",
            money: 14000,
            effects: { fame: 9, connections: 4, reputation: 2, burnout: 8 },
            flags: { tvRecurring: true },
          },
          {
            text: "Four auditions, four 'we went another way'. You learn to love the phrase 'another way'.",
            effects: { burnout: 9, talent: 1 },
          },
        ],
      },
      {
        label: "Pick the best one and rest",
        hint: "Measured",
        chance: 0.12,
        modifiers: { talent: 0.3, luck: 0.25 },
        outcomes: [
          {
            text: "One audition, full energy, nailed it. Recurring role on a network show.",
            money: 14000,
            effects: { fame: 9, connections: 4, reputation: 2, burnout: 3 },
            flags: { tvRecurring: true },
          },
          { text: "It goes fine. Fine gets you nothing.", effects: { burnout: 2 } },
        ],
      },
    ],
  },
  {
    id: "roommate_moves",
    place: "Los Angeles",
    text: "Your roommate is giving up and moving back to Ohio. Rent just doubled. He was also your scene partner.",
    maxAge: 33,
    maxStats: { fame: 15 },
    weight: 5,
    tags: ["life", "money"],
    options: [
      {
        label: "Get a cheaper, worse apartment",
        hint: "$400/mo saved",
        outcomes: [
          {
            text: "The new place has a window that doesn't open and neighbors who rehearse drums. You stay.",
            money: 1200,
            effects: { burnout: 4 },
          },
        ],
      },
      {
        label: "Move home for six months",
        hint: "Reset",
        outcomes: [
          {
            text: "Ohio is quiet. Your mother asks how the acting is going. You return with savings and a slight limp in your confidence.",
            money: 2500,
            effects: { burnout: -8, ego: -4 },
          },
        ],
      },
    ],
  },
  {
    id: "background_romance",
    place: "Los Angeles",
    text: "Another extra keeps ending up in your scenes. There's obvious chemistry. Dating other actors is famously a great idea.",
    maxStats: { fame: 30 },
    weight: 5,
    once: true,
    tags: ["relationships"],
    options: [
      {
        label: "Ask them out",
        hint: "Complicated",
        outcomes: [
          {
            text: "It's good. Two dreamers splitting one dream. It won't last, but right now it helps.",
            effects: { burnout: -6, publicPerception: 2 },
            flags: { earlyRomance: true },
          },
        ],
      },
      {
        label: "Keep it professional",
        hint: "Safe",
        outcomes: [{ text: "You nod politely across the craft services table forever.", effects: {} }],
      },
    ],
  },
  {
    id: "car_breaks",
    place: "Los Angeles",
    text: "Your car — which is also your commute, your changing room, and occasionally your bedroom — dies on the 101.",
    maxStats: { fame: 20 },
    weight: 5,
    tags: ["life", "money"],
    options: [
      {
        label: "Fix it",
        hint: "$900",
        outcomes: [
          { text: "The mechanic knows an actor when he sees one. He charges accordingly.", money: -900, effects: {} },
        ],
      },
      {
        label: "Sell it and take the bus",
        hint: "+$600",
        outcomes: [
          {
            text: "You learn the bus routes. You learn patience. You learn that auditions across town now take two hours.",
            money: 600,
            effects: { burnout: 5, connections: -1 },
          },
        ],
      },
    ],
  },
  {
    id: "talent_showcase",
    place: "Los Angeles",
    text: "A casting showcase for 'emerging talent'. $150 to perform a monologue for a row of exhausted agents.",
    maxStats: { fame: 18 },
    weight: 6,
    tags: ["audition", "agent"],
    options: [
      {
        label: "Perform",
        hint: "8%",
        danger: true,
        chance: 0.1,
        modifiers: { talent: 0.4, luck: 0.2 },
        outcomes: [
          {
            text: "One agent stays after. A real one. With a real office and real clients. She wants to represent you.",
            money: -150,
            effects: { connections: 8, reputation: 2 },
            flags: { realAgent: true },
          },
          {
            text: "They check their phones through your big monologue. All of them. In sync.",
            money: -150,
            effects: { burnout: 5, ego: -3 },
          },
        ],
      },
      {
        label: "Skip the pay-to-play",
        hint: "Safe",
        outcomes: [{ text: "You keep your $150 and your dignity. Both remain unspent.", effects: {} }],
      },
    ],
  },
  {
    id: "infomercial_offer",
    place: "Los Angeles",
    text: "Sal — or someone like Sal — has you booked on a 3 a.m. infomercial for a fitness device with a legally ambiguous name.",
    requiresFlags: { shadyAgent: true },
    maxStats: { fame: 25 },
    weight: 6,
    tags: ["money", "commercial"],
    options: [
      {
        label: "Do it",
        hint: "$1,200",
        outcomes: [
          {
            text: "You demonstrate the device with total commitment at 3 a.m. to no one. The check clears.",
            money: 1200,
            effects: { reputation: -2, burnout: 3 },
          },
        ],
      },
      {
        label: "Refuse and confront Sal",
        hint: "Risky",
        danger: true,
        chance: 0.5,
        modifiers: { ego: 0.2, connections: 0.2 },
        outcomes: [
          {
            text: "Sal respects the pushback. He starts sending you real auditions.",
            effects: { connections: 3, reputation: 2 },
            flags: { salRespectsYou: true },
          },
          {
            text: "Sal drops you. 'Nobody says no to Sal.' People say no to Sal constantly.",
            effects: { connections: -5 },
            flags: { salDroppedYou: true },
          },
        ],
      },
    ],
  },
  {
    id: "theater_play",
    place: "Silver Lake",
    text: "A tiny theater is doing a Beckett play. No pay, forty seats, but a real director and real reviews.",
    maxStats: { fame: 30 },
    weight: 6,
    tags: ["theater", "reputation"],
    options: [
      {
        label: "Take the role",
        hint: "Prestige, maybe",
        chance: 0.4,
        modifiers: { talent: 0.35, luck: 0.15 },
        outcomes: [
          {
            text: "The LA Weekly calls your performance 'ferocious'. Twelve people read the review. Two of them matter.",
            effects: { reputation: 5, talent: 3, connections: 2 },
          },
          {
            text: "Forty seats, eleven filled, one critic asleep. You gave it everything anyway. Something in you levels up.",
            effects: { talent: 3, reputation: 1, burnout: 4 },
          },
        ],
      },
      {
        label: "Focus on paid work",
        hint: "Practical",
        outcomes: [{ text: "Beckett will survive without you.", money: 400, effects: {} }],
      },
    ],
  },
  {
    id: "union_card",
    place: "Los Angeles",
    text: "You're finally eligible to join the actors' union. Initiation fee: $3,000. Without it, most real productions can't hire you.",
    minStats: { movies: 2, fame: 5 },
    maxStats: { fame: 40 },
    weight: 8,
    once: true,
    tags: ["industry", "money"],
    options: [
      {
        label: "Pay the fee",
        hint: "$3,000",
        outcomes: [
          {
            text: "You're union now. Minimum rates, real protections, and access to actual auditions. It feels like citizenship.",
            money: -3000,
            effects: { connections: 4, reputation: 2, industryRespect: 3 },
            flags: { unionMember: true },
          },
        ],
      },
      {
        label: "Stay non-union",
        hint: "Limited",
        outcomes: [
          {
            text: "The non-union world is a desert of $100 days. You know it well by now.",
            effects: { burnout: 3 },
          },
        ],
      },
    ],
  },
];
