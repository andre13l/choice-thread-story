/**
 * HOLLYWOOD — the downfall pack.
 *
 * Terminal events: the final chapter of every non-legend path. They are
 * never in the ordinary event pool — the downfall engine (../downfall.ts)
 * surfaces one when the career's accumulated pressures call for it, and
 * chooses the family that matches how the player actually lived.
 *
 * Most outcomes carry `end: "career"`. A few options offer a survival
 * branch — the career continues, diminished, and the `downfall` flag
 * feeds the comeback events. Survival is never free and never framed as
 * safety; it is the second act of a longer fall.
 *
 * Copy uses the career's own memory (film titles, Oscars, peak fortune,
 * company, age) so the ending reads as the conclusion of THAT path.
 */

import type { GameEvent, GameState } from "../types";
import { formatMoney } from "../scoring";
import { filmTitle, personName, variantRng } from "./fiction";

/** The career's defining film, if one exists — biggest gross, else latest. */
function bestFilmTitle(s: GameState): string | null {
  const films = s.films ?? [];
  if (films.length === 0) return null;
  const top = [...films].sort((a, b) => b.gross - a.gross)[0]!;
  return top.title;
}

function oscarLine(s: GameState): string {
  const n = s.stats.oscars;
  if (n <= 0) return "";
  if (n === 1) return " The Oscar is on the mantle, watching.";
  return ` The ${n} Oscars are on the mantle, watching.`;
}

export const downfallEvents: GameEvent[] = [
  /* ---------------------------------------------------------------- */
  /* FINANCIAL — the fortune was always a position, not a number.     */
  /* ---------------------------------------------------------------- */
  {
    id: "df_margin_call",
    terminal: true,
    downfallFamily: "financial",
    family: "downfall_financial",
    once: true,
    place: "A Thursday",
    text: (s) =>
      `It starts with one phone call about a loan you'd forgotten signing. By lunch there are four calls. By Friday, people you have never met are using the word "exposure" about your life. The ventures, the slate, the leverage — it was all one machine, and the machine has stopped. Peak balance once: ${formatMoney(s.stats.peakMoney)}. The number they're discussing now is very different.`,
    requiresFlags: { productionCompany: true },
    minStats: { money: 5_000_000 },
    weight: 1,
    tags: ["ending", "money"],
    options: [
      {
        label: "Sell everything with your name on it",
        hint: "Survive, stripped",
        danger: true,
        outcomes: [
          {
            text: "The catalog, the company, the name rights — all of it goes in a fire sale conducted by polite strangers. You keep the house you sleep in and almost nothing else. You are, technically, still here.",
            moneyPct: -0.92,
            effects: { fame: -12, influence: -25, industryRespect: -10, burnout: 25 },
            flags: { survivedDisaster: true, downfall: true, companyBankrupt: true },
          },
        ],
      },
      {
        label: "Let the machine take it all",
        hint: "It's already decided",
        outcomes: [
          {
            text: "The unwinding takes eleven months and everything you built. The trades run the story as a business item, page six. You read it in a rental apartment with good light. The phone does not ring.",
            moneyPct: -1,
            effects: { fame: -15, influence: -30, industryRespect: -12 },
            flags: { companyBankrupt: true },
            end: "career",
          },
        ],
      },
    ],
  },
  {
    id: "df_fortune_unwinds",
    terminal: true,
    downfallFamily: "financial",
    family: "downfall_financial",
    once: true,
    place: "The accountant's office",
    text: (s) =>
      `Your new accountant — the fourth — slides a single page across the desk. The investments, the restaurants, the fund your business manager believed in, the taxes nobody paid. "You're not broke," she says carefully. "You're illiquid in a way that becomes broke." At the peak there was ${formatMoney(s.stats.peakMoney)}. The page says the peak was a long time ago.`,
    minStats: { money: 20_000_000, financialRisk: 35 },
    weight: 1,
    tags: ["ending", "money"],
    options: [
      {
        label: "Take any work that pays",
        hint: "Humbling",
        outcomes: [
          {
            text: "You take the sequels, the conventions, the commercial for a casino that doesn't exist in America. The checks are real. The hole is realer. Each job costs a little of what the name used to mean, and there is less of it every year.",
            money: 4_000_000,
            effects: { fame: -10, reputation: -12, industryRespect: -8, burnout: 20, failedMovies: 2, movies: 2 },
            flags: { debtPaying: true, survivedDisaster: true, downfall: true },
          },
        ],
      },
      {
        label: "Refuse to believe the page",
        hint: "One more venture",
        danger: true,
        chance: 0.18,
        modifiers: { luck: 0.5 },
        outcomes: [
          {
            text: "Against every model, the last venture lands. Not a comeback — a stay of execution, bought with the last of the credit and most of the luck. You exhale. The town pretends it never doubted you.",
            moneyPct: 0.4,
            effects: { financialRisk: 15, burnout: 20 },
            flags: { survivedDisaster: true, downfall: true },
          },
          {
            text: "The venture folds in a quarter. So does everything else. The bankruptcy filing is public record, and the public loves a number with that many zeros going the wrong way.",
            moneyPct: -0.95,
            effects: { fame: -10, publicPerception: -8, industryRespect: -10 },
            end: "career",
          },
        ],
      },
    ],
  },
  {
    id: "df_last_picture",
    terminal: true,
    downfallFamily: "financial",
    family: "downfall_financial",
    once: true,
    place: "Your own money, again",
    text: (s) => {
      const r = variantRng(s, "df_last_picture");
      const title = filmTitle(r);
      return `There is one script left that you believe in: ${title}. No studio will touch it — you've asked everyone, twice. Making it yourself costs everything that's left and the house besides. You're ${s.stats.age}. The math only works if the film is perfect.`;
    },
    minStats: { money: 4_000_000, fame: 35, age: 50 },
    weight: 1,
    tags: ["ending", "money", "risk"],
    options: [
      {
        label: "Mortgage it all and shoot",
        hint: "Everything, one last time",
        danger: true,
        chance: 0.2,
        modifiers: { talent: 0.25, luck: 0.3, industryRespect: 0.1 },
        outcomes: [
          {
            text: "It's the best thing you ever made. The reviews say so in the first paragraph. You are broke, exposed, and — for one strange season — completely right about yourself.",
            moneyPct: -0.6,
            effects: { reputation: 15, industryRespect: 12, legacy: 10, culturalImpact: 8, burnout: 20, movies: 1, successfulMovies: 1 },
            flags: { survivedDisaster: true, downfall: true, legendaryFilm: true },
          },
          {
            text: "It opens in four hundred theaters and closes in none. The house goes in November. Critics are kind the way they're kind about the dead: briefly, and in past tense.",
            moneyPct: -0.95,
            effects: { reputation: 4, fame: -8, burnout: 30, movies: 1, failedMovies: 1 },
            end: "career",
          },
        ],
      },
      {
        label: "Burn the script",
        hint: "Let it go",
        outcomes: [
          {
            text: "You burn it in the sink like a sane person. The money lasts; you don't, particularly. You spend the following years at industry dinners being introduced as a great one and watching people try to remember why.",
            effects: { fame: -12, legacy: -6, burnout: 15 },
            end: "career",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* SCANDAL — the town built the pedestal and keeps the matches.     */
  /* ---------------------------------------------------------------- */
  {
    id: "df_the_story",
    terminal: true,
    downfallFamily: "scandal",
    family: "downfall_scandal",
    once: true,
    place: "48 hours",
    text: (s) =>
      `The story drops at 6 a.m. — years of it, sourced, dated, itemized. Half of it is exaggerated and a third of it is true, and none of that matters because the headline is perfect. By noon your publicist has stopped answering. By the second morning, three projects have "mutually agreed to part ways" with you.${oscarLine(s)}`,
    minStats: { fame: 50 },
    maxStats: { publicPerception: 55 },
    weight: 1,
    tags: ["ending", "scandal"],
    options: [
      {
        label: "Go on camera and fight",
        hint: "One chance",
        danger: true,
        chance: 0.25,
        modifiers: { luck: 0.3, publicPerception: 0.2, fame: -0.1 },
        outcomes: [
          {
            text: "The interview is raw and strange and it works — not forgiveness, exactly, but a pause. The town keeps you at arm's length, which is still a kind of membership. You work again. Smaller rooms, shorter leashes.",
            effects: { fame: -20, publicPerception: -10, reputation: -8, connections: -15, burnout: 20 },
            flags: { survivedDisaster: true, downfall: true, scandalMarked: true },
          },
          {
            text: "The interview makes it worse. The clip where your voice breaks gets remixed, memed, monetized by strangers. The industry doesn't announce anything; it simply stops including you.",
            effects: { fame: -25, publicPerception: -15, reputation: -10, connections: -20 },
            flags: { scandalMarked: true, blacklistedQuietly: true },
            end: "career",
          },
        ],
      },
      {
        label: "Disappear",
        hint: "No statement",
        outcomes: [
          {
            text: "You say nothing, ever, and the silence becomes the story's second chapter. The gates close behind you. Years later, documentaries will describe this part with slow zooms and a piano.",
            effects: { fame: -20, publicPerception: -12, legacy: -10 },
            flags: { scandalMarked: true },
            end: "career",
          },
        ],
      },
    ],
  },
  {
    id: "df_the_hearing",
    terminal: true,
    downfallFamily: "scandal",
    family: "downfall_scandal",
    once: true,
    place: "Room 4B",
    text: (s) =>
      `The lawyers stopped saying "if" months ago. Now it's a hearing, a docket, a seat you sit in while people read your life into the record in a bored voice. Whatever the verdict is, the transcript is forever, and the town has already decided which version it's keeping. The defense has cost ${formatMoney(Math.max(2_000_000, Math.round(s.stats.money * 0.2)))} so far.`,
    requiresFlags: { scandalMarked: true },
    minStats: { money: 2_000_000 },
    weight: 1,
    tags: ["ending", "scandal", "legal"],
    options: [
      {
        label: "Settle everything, admit nothing",
        hint: "Ruinously expensive",
        outcomes: [
          {
            text: "The settlement number has commas in places numbers shouldn't. No admission, no trial, no closure. You are free, poorer, and permanently followed by a story no one tells to your face.",
            moneyPct: -0.7,
            effects: { publicPerception: -8, reputation: -8, industryRespect: -10, burnout: 20 },
            end: "career",
          },
        ],
      },
      {
        label: "Take the stand",
        hint: "All or nothing",
        danger: true,
        chance: 0.3,
        modifiers: { luck: 0.35, publicPerception: 0.15 },
        outcomes: [
          {
            text: "The jury believes you. The vindication is total and the cost is most of what you had — but you walk out of Room 4B with your name back, and you intend to make the town regret the seating chart.",
            moneyPct: -0.6,
            effects: { publicPerception: 5, burnout: 25, industryRespect: 4 },
            flags: { survivedDisaster: true, downfall: true },
          },
          {
            text: "They don't believe you. The judgment lands, the appeals fail, and the last decade of your career is reclassified as evidence. It's over in every way a career can be over.",
            moneyPct: -0.9,
            effects: { fame: -20, publicPerception: -15, reputation: -15, industryRespect: -20 },
            end: "career",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* IRRELEVANCE — the quietest ending, and the most common.          */
  /* ---------------------------------------------------------------- */
  {
    id: "df_nobody_calls",
    terminal: true,
    downfallFamily: "irrelevance",
    family: "downfall_irrelevance",
    once: true,
    place: "Los Angeles",
    text: (s) => {
      const film = bestFilmTitle(s);
      const filmBit = film ? ` People still quote ${film} at you in grocery stores — gently, the way you'd mention the weather.` : "";
      return `You realize you've been counting the phone's silences in weeks now. Your agent's assistant's assistant sends a holiday card.${filmBit} The town hasn't turned on you. It has done something worse: it has moved on, politely, without announcing it.`;
    },
    minStats: { peakFame: 40 },
    maxStats: { fame: 45 },
    weight: 2,
    tags: ["ending", "decline"],
    options: [
      {
        label: "Force one more audition",
        hint: "Dignity optional",
        danger: true,
        chance: 0.22,
        modifiers: { talent: 0.3, luck: 0.25 },
        outcomes: [
          {
            text: "The room is full of people half your age and you act them out of the building. It's not a comeback — the calls don't flood — but one door reopens, and you walk through it like you never left.",
            money: 800_000,
            effects: { fame: 10, reputation: 8, industryRespect: 5, movies: 1, successfulMovies: 1 },
            flags: { survivedDisaster: true, downfall: true, comeback: true },
          },
          {
            text: "You give the room everything. The casting director, twenty-six, says 'that was really special' in the tone used for grandparents and lost pets. You drive home the long way.",
            effects: { ego: -10, burnout: 15, fame: -4 },
            end: "career",
          },
        ],
      },
      {
        label: "Accept the quiet",
        hint: "Let it be over",
        outcomes: [
          {
            text: "You stop waiting for the phone and start gardening, or painting, or nothing. The ceremonies continue without you. Every few years a listicle remembers you exist, and gets two details wrong.",
            effects: { fame: -8, legacy: -4 },
            end: "career",
          },
        ],
      },
    ],
  },
  {
    id: "df_impersonator",
    terminal: true,
    downfallFamily: "irrelevance",
    family: "downfall_irrelevance",
    once: true,
    place: "A convention center",
    text: (s) =>
      `You're booked at a fan convention between a wrestler and a cartoon voice. Across the aisle, an impersonator — younger, shinier — is doing you. His line is longer. A teenager asks him for a photo and asks you to take it. You are ${s.stats.age}, and at your peak you could not walk down this street without traffic stopping.`,
    minStats: { peakFame: 65, age: 55 },
    maxStats: { fame: 55 },
    weight: 1,
    tags: ["ending", "decline"],
    options: [
      {
        label: "Take the photo for them",
        hint: "Grace, of a kind",
        outcomes: [
          {
            text: "You take the photo. You even get them both in focus. On the drive home you laugh once, alone, and it's mostly real. This is what the afterlife of fame looks like: fluorescent, air-conditioned, forty dollars a signature.",
            effects: { ego: -8, burnout: 10, fame: -5 },
            end: "career",
          },
        ],
      },
      {
        label: "Walk out mid-panel",
        hint: "The old fire",
        outcomes: [
          {
            text: "You walk out. Someone films it. For four days the internet remembers you — as a meme about ego, not as the career. The bookings dry up entirely after that, which turns out to be the same ending on a worse note.",
            effects: { publicPerception: -10, fame: -6, ego: 5 },
            end: "career",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* ISOLATION — the estate, the silence, the eccentric ending.       */
  /* ---------------------------------------------------------------- */
  {
    id: "df_the_estate",
    terminal: true,
    downfallFamily: "isolation",
    family: "downfall_isolation",
    once: true,
    place: "Behind the gates",
    text: (s) =>
      `The estate has eleven bedrooms and one occupant. You've started giving notes to staff who left years ago; there's a peacock nobody bought. Old colleagues call it "reclusive" in interviews, fondly, the way you'd describe weather in a country you no longer visit. The invitations stopped when you stopped answering. You don't remember stopping answering.`,
    minStats: { ego: 55, money: 10_000_000 },
    weight: 1,
    tags: ["ending", "isolation"],
    options: [
      {
        label: "Open the gates",
        hint: "Come back slowly",
        danger: true,
        chance: 0.3,
        modifiers: { connections: 0.25, luck: 0.2 },
        outcomes: [
          {
            text: "You call the three people whose numbers you still know by heart. Two answer. It turns out the town will take you back in small doses — a dinner, a cameo, a tribute where you wave from a balcony. Smaller than before. Realer, too.",
            effects: { connections: 12, ego: -10, fame: 4, burnout: -10 },
            flags: { survivedDisaster: true, downfall: true },
          },
          {
            text: "You call. The numbers belong to other people now. You host one dinner anyway; everyone is charming and no one stays for coffee. The gates close themselves, gently, like a habit.",
            effects: { connections: -5, ego: -8, burnout: 15 },
            end: "career",
          },
        ],
      },
      {
        label: "Keep the gates closed",
        hint: "Your own terms",
        outcomes: [
          {
            text: "The years pass in fascinating, private order. You write memos no one reads and screen your own films to standing ovations of one. When they finally write about you, they'll use the word 'enigma'. It means alone.",
            effects: { ego: 6, legacy: -4, burnout: 10 },
            end: "career",
          },
        ],
      },
    ],
  },
  {
    id: "df_last_interview",
    terminal: true,
    downfallFamily: "isolation",
    family: "downfall_isolation",
    once: true,
    place: "A profile, long overdue",
    text: (s) => {
      const r = variantRng(s, "df_last_interview");
      return `A magazine sends ${personName(r)} to write the big career retrospective. She is kind, thorough, and visibly surprised by the details: the house is too quiet, the anecdotes all end decades ago, and there is no one to call to verify the good stories. The piece will run as a celebration. It will read as a eulogy.`;
    },
    minStats: { age: 55, peakFame: 40 },
    maxStats: { connections: 40 },
    weight: 1,
    tags: ["ending", "isolation"],
    options: [
      {
        label: "Give her the real story",
        hint: "Unvarnished",
        outcomes: [
          {
            text: "You tell it all — the betrayals you committed, not just survived. The piece is extraordinary and it ends your career more honestly than any scandal could. People admire the candor. They admire it from a distance.",
            effects: { reputation: 5, connections: -8, publicPerception: -6, ego: -5 },
            end: "career",
          },
        ],
      },
      {
        label: "Perform the legend one last time",
        hint: "The greatest hits",
        outcomes: [
          {
            text: "You give the anecdotes, the impressions, the charm turned up to the old wattage. She writes a love letter to a person who left the building years ago. It runs on a Sunday. You clip it, and have no one to send it to.",
            effects: { ego: 4, burnout: 8 },
            end: "career",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* FEUD — the doors were closed from the other side.                */
  /* ---------------------------------------------------------------- */
  {
    id: "df_the_blacklist",
    terminal: true,
    downfallFamily: "feud",
    family: "downfall_feud",
    once: true,
    place: "Every studio, apparently",
    text: () =>
      `It takes you a year to see the pattern: projects that die between "we love it" and the contract; meetings rescheduled into oblivion; a producer who hugs you and greenlights nothing. There's no list — there never is. There's just a consensus, formed in rooms you weren't in, that you are more trouble than the money. You find out the way everyone does: last.`,
    requiresFlags: { blacklistedQuietly: true },
    weight: 2,
    tags: ["ending", "feud"],
    options: [
      {
        label: "Make the apology tour",
        hint: "Swallow it all",
        danger: true,
        chance: 0.28,
        modifiers: { ego: -0.3, connections: 0.2, luck: 0.2 },
        outcomes: [
          {
            text: "You apologize to people who deserve it and people who engineered it, and you can't always tell which is which. Two doors reopen. It's not forgiveness; it's economics. You take it.",
            effects: { ego: -12, connections: 8, industryRespect: -4, burnout: 15 },
            flags: { survivedDisaster: true, downfall: true, blacklistedQuietly: false },
          },
          {
            text: "The apologies are accepted in the tone reserved for the already-buried. Nothing reopens. Hollywood forgives failure, given time. It never quite forgives being right about it in public.",
            effects: { ego: -12, connections: -5, fame: -6 },
            end: "career",
          },
        ],
      },
      {
        label: "Name names on the record",
        hint: "Magnificent, brief",
        outcomes: [
          {
            text: "You say everything, on camera, with dates. It's the best performance of your later career and it plays for a week. Then the machinery finishes what it started, and the silence is total — but it's your silence now, chosen, detonated.",
            effects: { fame: -12, connections: -15, industryRespect: -10, culturalImpact: 4, ego: 8 },
            end: "career",
          },
        ],
      },
    ],
  },
  {
    id: "df_the_protege",
    terminal: true,
    downfallFamily: "feud",
    family: "downfall_feud",
    once: true,
    place: "Your own boardroom",
    text: (s) => {
      const r = variantRng(s, "df_the_protege");
      return `You taught ${personName(r)} everything — the rooms, the reads, the ruthlessness you thought you could switch off. The vote happens while you're at a premiere you were only invited to for appearances. Your name stays on the building. It's the only thing of yours that does.`;
    },
    requiresFlags: { productionCompany: true },
    minStats: { influence: 30 },
    weight: 1,
    tags: ["ending", "feud", "betrayal"],
    options: [
      {
        label: "Fight for the company",
        hint: "War",
        danger: true,
        chance: 0.3,
        modifiers: { influence: 0.25, connections: 0.2, luck: 0.2 },
        outcomes: [
          {
            text: "Eight months of proxies and poison pills and you win — the company, minus the staff who mattered and the years it took. You keep the kingdom. It's smaller now, and it remembers.",
            moneyPct: -0.35,
            effects: { influence: -10, burnout: 25, industryRespect: -6 },
            flags: { survivedDisaster: true, downfall: true },
          },
          {
            text: "You lose the vote, the lawsuit, and the narrative — in that order. They name a screening room after you, which is the corporate way of saying checkmate. The company thrives. You watch from outside.",
            moneyPct: -0.5,
            effects: { influence: -25, industryRespect: -8, burnout: 20 },
            end: "career",
          },
        ],
      },
      {
        label: "Sign the exit",
        hint: "Walk",
        outcomes: [
          {
            text: "You sign. The severance is generous the way a headstone is generous. That evening, a young actor asks you what you're working on next, and you discover you have no answer for the first time in your adult life.",
            moneyPct: 0.15,
            effects: { influence: -20, industryRespect: -6, ego: -8 },
            end: "career",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* ACCIDENT — the body files the paperwork. Non-graphic, final.     */
  /* ---------------------------------------------------------------- */
  {
    id: "df_the_stunt",
    terminal: true,
    downfallFamily: "accident",
    family: "downfall_accident",
    once: true,
    place: "Second unit, a Tuesday",
    text: () =>
      `You insisted on doing it yourself — you always insisted. The rig checks out; the math checks out; everyone is very professional, and it doesn't matter. You wake up in a room with beeping machines and a doctor who says "remarkable" and "never again" in the same paragraph. The insurance report will run eleven pages. Your body has made a decision your agent can't appeal.`,
    minStats: { fame: 35, riskTolerance: 45 },
    maxStats: { age: 70 },
    weight: 1,
    tags: ["ending", "accident"],
    options: [
      {
        label: "Fight through rehab",
        hint: "Months of it",
        danger: true,
        chance: 0.3,
        modifiers: { luck: 0.35, burnout: -0.2 },
        outcomes: [
          {
            text: "You walk back onto a set eleven months later and the crew applauds without being asked to. You'll never do your own stunts again. You're still here to be told that, which counts.",
            effects: { burnout: 30, fame: 4, publicPerception: 6, industryRespect: 5 },
            flags: { survivedDisaster: true, downfall: true },
          },
          {
            text: "The rehab works; the work doesn't. Producers look at the insurance numbers, not the comeback story. The body healed. The career's cast never came off.",
            effects: { burnout: 20, fame: -8 },
            end: "career",
          },
        ],
      },
      {
        label: "Call it what it is",
        hint: "The last mark",
        outcomes: [
          {
            text: "You never stand on a mark again. The get-well flowers wilt, the tribute reels are lovely, and the industry sends notes that all begin the same way. You were lucky, the doctor keeps saying. You try the word on. It doesn't quite fit.",
            effects: { burnout: 15 },
            end: "career",
          },
        ],
      },
    ],
  },
  {
    id: "df_final_take",
    terminal: true,
    downfallFamily: "accident",
    family: "downfall_accident",
    once: true,
    place: "Los Angeles",
    text: (s) =>
      `The doctors have stopped suggesting and started scheduling. The body that carried ${s.stats.movies} films is filing its own paperwork now, line by line. There's no dramatic scene coming — just a calendar with fewer pages than the script called for, and the strange logistics of a life that has to be wrapped like a production.`,
    minStats: { age: 62, burnout: 45 },
    weight: 1,
    tags: ["ending", "health"],
    options: [
      {
        label: "Wrap the production",
        hint: "On your terms",
        outcomes: [
          {
            text: "You finish the small things: letters, the garden, one perfect dinner with the few who mattered. The town finds out later, the way it finds out everything — all at once, with montages. The work stays. The rest was always going to go.",
            effects: { legacy: 6 },
            end: "career",
          },
        ],
      },
      {
        label: "Book one more job anyway",
        hint: "Defiant",
        danger: true,
        chance: 0.25,
        modifiers: { luck: 0.4 },
        outcomes: [
          {
            text: "The body holds for one last shoot — barely, gloriously. You deliver the performance sitting down and steal the film doing it. After that, the calendar is what it is. But you got the last word in first.",
            money: 1_000_000,
            effects: { reputation: 8, legacy: 8, industryRespect: 6, burnout: 25, movies: 1, successfulMovies: 1 },
            flags: { survivedDisaster: true, downfall: true },
          },
          {
            text: "Production shuts down in week two — the insurance finally says the quiet part. The footage is beautiful and unusable. The trades are respectful. Respectful is a word for endings.",
            effects: { burnout: 30, fame: -4 },
            end: "career",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* LEGACY — history gets the final edit.                            */
  /* ---------------------------------------------------------------- */
  {
    id: "df_the_tell_all",
    terminal: true,
    downfallFamily: "legacy",
    family: "downfall_legacy",
    once: true,
    place: "A book you didn't write",
    text: (s) => {
      const r = variantRng(s, "df_the_tell_all");
      const film = bestFilmTitle(s);
      const filmBit = film ? ` Even ${film} gets re-litigated — what it cost, who it cost.` : "";
      return `Someone who knew you — really knew you — has written the book. ${personName(r)} spent three years on it, and it's good, that's the problem. Generous where it hurts most, precise everywhere else.${filmBit} Fifty years of narrative control, re-edited by someone with receipts. You're ${s.stats.age}, and history is getting the final cut.`;
    },
    minStats: { legacy: 25, age: 55 },
    weight: 1,
    tags: ["ending", "legacy"],
    options: [
      {
        label: "Contest every page",
        hint: "War over the past",
        danger: true,
        chance: 0.3,
        modifiers: { influence: 0.2, luck: 0.25 },
        outcomes: [
          {
            text: "You fight it — interviews, your own counter-memoir, lawyers on the footnotes. You win enough corrections to matter. The story survives, scarred but yours. Mostly yours.",
            money: -3_000_000,
            effects: { legacy: -6, burnout: 20, publicPerception: -4 },
            flags: { survivedDisaster: true, downfall: true },
          },
          {
            text: "Every denial sells another printing. The book becomes the record; your version becomes the footnote. They'll teach the wrong story now, forever, in your name.",
            money: -3_000_000,
            effects: { legacy: -18, publicPerception: -10, reputation: -8 },
            end: "career",
          },
        ],
      },
      {
        label: "Say nothing",
        hint: "Let history have it",
        outcomes: [
          {
            text: "You let the book stand. It becomes the record. On good days you tell yourself the films are the real autobiography. On bad days you count how many people will only ever know the index version of you.",
            effects: { legacy: -14, ego: -8, burnout: 12 },
            end: "career",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* FALLBACK — the quiet ending that fits any career. Always          */
  /* eligible, so the downfall engine never draws a blank.            */
  /* ---------------------------------------------------------------- */
  {
    id: "df_the_quiet",
    terminal: true,
    downfallFamily: "irrelevance",
    family: "downfall_irrelevance",
    once: true,
    place: "Los Angeles",
    text: (s) =>
      `No scandal, no collapse — just the arithmetic of this town catching up. The premieres you aren't at, the parts you hear about after they're cast, the name that takes journalists a beat longer to place. You gave it ${s.stats.movies > 0 ? `${s.stats.movies} films` : "everything"}. Hollywood's gratitude is real; it's just also perishable.`,
    weight: 1,
    tags: ["ending"],
    options: [
      {
        label: "Let the credits roll",
        hint: "The path ends here",
        outcomes: [
          {
            text: "The phone slows, then stills. The garden, or the view, or the quiet — it's genuinely good, some mornings. But you catch yourself listening for a call that stopped coming, in a town that has already made three more of you.",
            effects: { fame: -6 },
            end: "career",
          },
        ],
      },
    ],
  },
];
