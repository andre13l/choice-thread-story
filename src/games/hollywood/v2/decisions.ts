/**
 * HOLLYWOOD V2 — decision catalog.
 *
 * Decisions are the verbs of the game. Each is a small scene with 2–3
 * choices; every choice carries narrative consequence text and hidden
 * effects (fx) that flow into the release simulation. Archetypes compose
 * these into per-project plans — there is no universal loop.
 */

import type { RunFx } from "./types";

export interface DecisionChoice {
  id: string;
  label: string;
  /** Small print under the label — cost hints, tone. */
  sub?: string | undefined;
  /** What happened, shown after choosing. */
  text: string;
  fx: RunFx;
}

export interface DecisionDef {
  id: string;
  family: string;
  /** Scene heading, e.g. "The ending". */
  title: string;
  /** Setup. {title} and {studio} are templated. */
  body: string;
  choices: DecisionChoice[];
}

export const DECISIONS: Record<string, DecisionDef> = {
  /* ------------------------------ generic craft ------------------------------ */

  ending: {
    id: "ending",
    family: "notes",
    title: "The ending",
    body: "Three weeks from the wrap, {studio} sends the note you were dreading: the ending of {title} tests “too bleak.” They'd like something with more hope.",
    choices: [
      {
        id: "keep",
        label: "Keep the bleak ending",
        sub: "It's why you signed on",
        text: "You hold the line. The studio isn't thrilled, but the film keeps its spine.",
        fx: { quality: 6, awards: 6, appeal: -3, studioRel: -6 },
      },
      {
        id: "hopeful",
        label: "Give them the hopeful one",
        sub: "Pick your battles",
        text: "The new ending plays fine. Something small and true got traded away, and only you will ever know.",
        fx: { quality: -3, appeal: 5, awards: -4, studioRel: 8 },
      },
      {
        id: "both",
        label: "Shoot both, decide in the edit",
        sub: "+$1.5M",
        text: "Two endings, one edit bay, and a very long winter. Expensive — but the choice will be yours.",
        fx: { quality: 3, awards: 2, budget: 1_500_000, burnout: 6 },
      },
    ],
  },

  location: {
    id: "location",
    family: "money",
    title: "Where to shoot",
    body: "The line producer lays out three versions of {title}. The script says New York. The spreadsheet says Prague. The stage says nobody will notice.",
    choices: [
      {
        id: "prague",
        label: "Prague doubles for New York",
        sub: "Save 15% of the budget",
        text: "Prague is beautiful, cheap, and almost — almost — convinces as Manhattan.",
        fx: { budget: -0.15, quality: -2, appeal: 1 },
      },
      {
        id: "real",
        label: "Keep the real locations",
        sub: "The city is a character",
        text: "Real streets, real noise, real cost overruns waiting to happen. It looks like money.",
        fx: { quality: 5, appeal: 2, budget: 0.08 },
      },
      {
        id: "stage",
        label: "Build it on a stage",
        sub: "Control everything",
        text: "Total control, total artifice. The crew loves it. The budget loves it more.",
        fx: { budget: -0.08, quality: 1 },
      },
    ],
  },

  scale: {
    id: "scale",
    family: "spectacle",
    title: "The helicopter moment",
    body: "Page 87 of {title}: the helicopter sequence. The second-unit director has plans. The insurance company has concerns. Your producer just asks: how big?",
    choices: [
      {
        id: "grounded",
        label: "Keep it grounded",
        sub: "Character over spectacle",
        text: "You cut the helicopter and give the scene to the actors. The crew quietly applauds.",
        fx: { quality: 5, appeal: -4, budget: -0.1 },
      },
      {
        id: "big",
        label: "Blow the helicopter up",
        sub: "+$12M, and worth every cent",
        text: "Three cameras, one helicopter, zero regrets. The trailer just wrote itself.",
        fx: { appeal: 9, budget: 12_000_000, risk: 8, momentum: 3 },
      },
      {
        id: "practical",
        label: "Do it practical, but smaller",
        sub: "+$4M",
        text: "A real helicopter, a real field, a controlled burn. It feels dangerous because it slightly is.",
        fx: { appeal: 5, quality: 2, budget: 4_000_000, risk: 4 },
      },
    ],
  },

  reshoots: {
    id: "reshoots",
    family: "post",
    title: "The reshoot question",
    body: "The first cut of {title} screens for the studio. Silence in the room, then: “We have thoughts.” The third act needs work. Everyone knows it.",
    choices: [
      {
        id: "two-weeks",
        label: "Two weeks of reshoots",
        sub: "+$8M",
        text: "You go back in and fix the third act properly. The studio pays, and remembers that you were right.",
        fx: { quality: 8, appeal: 4, budget: 8_000_000, burnout: 8, studioRel: -3 },
      },
      {
        id: "lock",
        label: "Lock what you have",
        sub: "The edit can save it",
        text: "You recut instead of reshoot. It's 90% of the movie it could have been. That last 10% will nag at you.",
        fx: { quality: -2, burnout: 2, studioRel: 4 },
      },
      {
        id: "one-day",
        label: "One day, one scene",
        sub: "+$1M",
        text: "One perfect insert scene, shot in fourteen hours. Surgery, not reconstruction.",
        fx: { quality: 3, budget: 1_000_000, burnout: 3 },
      },
    ],
  },

  runtime: {
    id: "runtime",
    family: "post",
    title: "The length note",
    body: "The cut of {title} runs two hours and change. {studio} wants ninety-five minutes — “pace is king.” Your editor has gone pale.",
    choices: [
      {
        id: "cut",
        label: "Cut it to 95",
        sub: "Pace is king",
        text: "Out go the digressions, the silences, the breath. It's lean. Something human went with it.",
        fx: { appeal: 4, quality: -4, awards: -5, studioRel: 6 },
      },
      {
        id: "hold",
        label: "Hold the long cut",
        sub: "Trust the audience",
        text: "You defend every minute. The studio folds. The film breathes.",
        fx: { quality: 5, awards: 4, appeal: -2, studioRel: -5 },
      },
    ],
  },

  rating: {
    id: "rating",
    family: "notes",
    title: "The rating fight",
    body: "The ratings board hands {title} a restricted rating. {studio} estimates what a friendlier rating adds to the gross. It's not a small number.",
    choices: [
      {
        id: "trim",
        label: "Trim for the friendlier rating",
        sub: "Reach everybody",
        text: "Forty seconds of trims. The film survives — mostly. The multiplexes open their doors.",
        fx: { appeal: 7, quality: -3, awards: -3 },
      },
      {
        id: "keep-r",
        label: "Keep the hard rating",
        sub: "It's that kind of film",
        text: "You keep every frame. Adults only — but the adults who come will feel something.",
        fx: { quality: 4, awards: 3, appeal: -5 },
      },
    ],
  },

  release: {
    id: "release",
    family: "post",
    title: "The release strategy",
    body: "Finished film, three doors. {studio} will follow your call: go wide in summer, platform through festivals into awards season, or take the streaming money now.",
    choices: [
      {
        id: "wide",
        label: "Wide summer release",
        sub: "Swing for the fences",
        text: "Two thousand screens and a prayer. The marketing machine roars to life.",
        fx: { appeal: 8, awards: -6, momentum: 2, flags: ["rel:wide"] },
      },
      {
        id: "platform",
        label: "Platform into awards season",
        sub: "Slow burn",
        text: "Four screens, then forty, then four hundred — if the word of mouth comes.",
        fx: { awards: 8, quality: 2, appeal: -2, flags: ["rel:platform"] },
      },
      {
        id: "streaming",
        label: "Sell to the streamer",
        sub: "Take the sure money",
        text: "The check clears in a week. Your film premieres between a true-crime doc and a cooking show.",
        fx: { money: 0, appeal: -3, awards: -8, momentum: -2, flags: ["rel:stream"] },
      },
    ],
  },

  vfx: {
    id: "vfx",
    family: "spectacle",
    title: "Practical or pixels",
    body: "The big sequences in {title} can be built in a computer or in a warehouse. The warehouse is slower. The computer is safer. Both are expensive.",
    choices: [
      {
        id: "practical",
        label: "Practical effects, real sets",
        sub: "Audiences can feel it",
        text: "Real dust, real fire, real weight. The shoot runs long and the footage glows.",
        fx: { quality: 6, awards: 3, budget: 0.1, risk: 5 },
      },
      {
        id: "cgi",
        label: "Full CGI pipeline",
        sub: "Fix it in post",
        text: "Flexible, safe, and slightly weightless. You can always polish it later. You will always be polishing it later.",
        fx: { quality: -2, appeal: 2, budget: 0.06, burnout: 4 },
      },
    ],
  },

  music: {
    id: "music",
    family: "money",
    title: "The song",
    body: "The closing scene of {title} needs one specific song. The rights holder knows exactly what scene it's for. The number they quote has a lot of zeros.",
    choices: [
      {
        id: "pay",
        label: "Pay for the song",
        sub: "+$1M",
        text: "It's the right song. It's the only song. You pay.",
        fx: { quality: 4, appeal: 3, budget: 1_000_000 },
      },
      {
        id: "score",
        label: "Let the composer carry it",
        sub: "Original score instead",
        text: "Your composer writes the cue of her career. Nobody remembers the other song existed.",
        fx: { quality: 3, awards: 3 },
      },
    ],
  },

  /* ------------------------------ first jobs ------------------------------ */

  mvConcept: {
    id: "mv-concept",
    family: "firstjobs",
    title: "The concept",
    body: "The label wants a video for {title}. The artist sent a mood board at 2 a.m. The budget is what it is. What are you making?",
    choices: [
      {
        id: "onetake",
        label: "One unbroken take",
        sub: "Technically terrifying",
        text: "Forty-one takes to get one. The internet will loop the behind-the-scenes clip for a week.",
        fx: { quality: 6, appeal: 4, risk: 8, burnout: 5 },
      },
      {
        id: "pastiche",
        label: "A perfect 80s pastiche",
        sub: "Nostalgia prints money",
        text: "Neon, grain, a keytar. The algorithm rewards it instantly.",
        fx: { appeal: 7, quality: 1 },
      },
      {
        id: "story",
        label: "A tiny three-minute film",
        sub: "Tell a story instead",
        text: "No performance shots, just a story. The label is confused. The comments section is crying.",
        fx: { quality: 7, appeal: 2, awards: 3 },
      },
    ],
  },

  adBrief: {
    id: "ad-brief",
    family: "firstjobs",
    title: "The brief",
    body: "The agency brief for the {title} spot is eleven pages of brand guidelines and one sentence that matters: “make people feel something.”",
    choices: [
      {
        id: "safe",
        label: "Deliver the brief exactly",
        sub: "Product first",
        text: "Clean, on-brief, on-time. The client loves it. Nobody else will ever think about it again.",
        fx: { appeal: 3, quality: -1, studioRel: 8 },
      },
      {
        id: "weird",
        label: "Shoot the intern's weird idea",
        sub: "The one everyone laughed at",
        text: "It's strange and specific and thirty seconds long. It wins a craft award and gets meme'd for a month.",
        fx: { quality: 6, appeal: 5, studioRel: -2, awards: 4 },
      },
    ],
  },

  tvBrief: {
    id: "tv-brief",
    family: "firstjobs",
    title: "The episode",
    body: "You're directing episode six of {title}. Ten days, the showrunner's bible, and a cast that already knows the machine. How do you play it?",
    choices: [
      {
        id: "serve",
        label: "Serve the show's house style",
        sub: "Be a pro",
        text: "Invisible, precise, on schedule. The showrunner trusts you with the season finale next.",
        fx: { quality: 2, studioRel: 8, momentum: 3 },
      },
      {
        id: "signature",
        label: "Sneak in a signature episode",
        sub: "Make it yours",
        text: "A long take, a cold open nobody approved, a needle-drop you fought for. Fans call it “the good one.”",
        fx: { quality: 6, appeal: 3, studioRel: -3, awards: 2 },
      },
    ],
  },

  shortScope: {
    id: "short-scope",
    family: "firstjobs",
    title: "The short",
    body: "{title}: twelve pages, one location, a crew of friends, and a budget assembled from favors. What kind of short is this?",
    choices: [
      {
        id: "calling-card",
        label: "A festival calling card",
        sub: "Craft over everything",
        text: "Every frame argued over. It's the best possible version of twelve pages.",
        fx: { quality: 7, awards: 6, burnout: 4 },
      },
      {
        id: "proof",
        label: "A proof of concept",
        sub: "For the feature it could become",
        text: "You shoot the short as a trailer for a film that doesn't exist yet. Now it has to.",
        fx: { quality: 3, momentum: 5, flags: ["poc"] },
      },
    ],
  },

  /* ------------------------------ micro / indie ------------------------------ */

  mhLocation: {
    id: "mh-location",
    family: "micro",
    title: "The location",
    body: "{title} needs one location that does the scaring for you. The budget allows exactly one bad idea.",
    choices: [
      {
        id: "cabin",
        label: "The cabin nobody rents",
        sub: "Classic for a reason",
        text: "The owner warns you about the basement door. You put the basement door in the movie.",
        fx: { quality: 3, appeal: 3 },
      },
      {
        id: "mall",
        label: "The abandoned mall at night",
        sub: "Permit-free. Allegedly.",
        text: "Security kicks you out twice. The third night you get the shot.",
        fx: { quality: 5, appeal: 2, risk: 6 },
      },
      {
        id: "house",
        label: "Your own house",
        sub: "Free. Haunted now, though.",
        text: "You can never again walk past that hallway without hearing the score.",
        fx: { quality: 4, budget: -0.05, burnout: 3 },
      },
    ],
  },

  mhEnding: {
    id: "mh-ending",
    family: "micro",
    title: "How it ends",
    body: "Horror lives and dies in the last five minutes. The script of {title} has three endings circled.",
    choices: [
      {
        id: "everyone",
        label: "Nobody survives",
        sub: "Bleak as hell",
        text: "The audience leaves the theater changed, and slightly angry. Perfect.",
        fx: { quality: 4, appeal: 2, awards: 2 },
      },
      {
        id: "finalgirl",
        label: "The final girl",
        sub: "Give them someone to root for",
        text: "One survivor, one last scare, one franchise option.",
        fx: { appeal: 6, quality: 1, flags: ["sequelbait"] },
      },
      {
        id: "ambiguous",
        label: "Cut to black",
        sub: "Let them argue",
        text: "No answer. Forums will still be arguing about it in ten years.",
        fx: { quality: 6, appeal: 1, awards: 3 },
      },
    ],
  },

  docAccess: {
    id: "doc-access",
    family: "doc",
    title: "The access",
    body: "{title} lives or dies on access. The subject of your documentary finally calls you back with terms.",
    choices: [
      {
        id: "their-terms",
        label: "Full access, their terms",
        sub: "They see the cut first",
        text: "You get everything — except final say. The intimacy is real. So is the compromise.",
        fx: { appeal: 5, quality: -2, awards: 2 },
      },
      {
        id: "archives",
        label: "No cooperation — build from archives",
        sub: "The hard way",
        text: "Two hundred hours of found footage and no permission. What emerges is stranger and truer.",
        fx: { quality: 7, awards: 5, risk: 5, burnout: 6 },
      },
      {
        id: "three",
        label: "Follow three subjects instead",
        sub: "Spread the risk",
        text: "Three stories braided together. Twice the footage, three times the edit.",
        fx: { quality: 4, appeal: 2, burnout: 5 },
      },
    ],
  },

  docApproach: {
    id: "doc-approach",
    family: "doc",
    title: "The approach",
    body: "What's the grammar of {title}?",
    choices: [
      {
        id: "observational",
        label: "Observational — no interviews",
        sub: "The camera watches",
        text: "You film for fourteen months and say nothing. The quiet becomes the point.",
        fx: { quality: 6, awards: 5, appeal: -2 },
      },
      {
        id: "investigative",
        label: "Investigative",
        sub: "Follow the money",
        text: "Lawyers review every cut. Somebody powerful stops returning your calls. You're onto something.",
        fx: { quality: 5, appeal: 4, risk: 7, awards: 3 },
      },
      {
        id: "poetic",
        label: "Poetic — image and music",
        sub: "A feeling, not an argument",
        text: "It's less a documentary than a dream about a real place. Programmers will either fight over it or pass entirely.",
        fx: { quality: 5, awards: 6, risk: 4 },
      },
    ],
  },

  /* ------------------------------ mid career ------------------------------ */

  animStyle: {
    id: "anim-style",
    family: "anim",
    title: "The visual style",
    body: "{title} can look like anything — that's the whole point. It just can't look like everything.",
    choices: [
      {
        id: "hand",
        label: "Hand-painted 2D",
        sub: "Slow, expensive, gorgeous",
        text: "Every frame a painting. The animators union sends a thank-you card.",
        fx: { quality: 8, awards: 6, budget: 0.12, burnout: 4 },
      },
      {
        id: "stopmotion",
        label: "Stop-motion",
        sub: "Years, literally",
        text: "Twelve frames a day. The puppets get union nicknames. The result has a heartbeat.",
        fx: { quality: 7, awards: 7, appeal: -2 },
      },
      {
        id: "cg",
        label: "Cutting-edge CG",
        sub: "The safe modern choice",
        text: "It looks like everything and nothing. The render farm never sleeps.",
        fx: { appeal: 6, quality: 1, budget: 0.08 },
      },
    ],
  },

  animPartner: {
    id: "anim-partner",
    family: "anim",
    title: "The studio partner",
    body: "You can't animate {title} alone. Two teams want the job, and they could not be more different.",
    choices: [
      {
        id: "legendary",
        label: "The legendary studio",
        sub: "Slow, stubborn, brilliant",
        text: "They take a month to approve a walk cycle. The walk cycle is perfect.",
        fx: { quality: 7, burnout: 5, studioRel: 3 },
      },
      {
        id: "hungry",
        label: "The hungry young team",
        sub: "Fast, cheap, chaotic",
        text: "They invent a new pipeline in a weekend to hit your deadline. Some of it is even legal.",
        fx: { quality: 3, appeal: 3, risk: 5, momentum: 3 },
      },
    ],
  },

  comTone: {
    id: "com-tone",
    family: "comedy",
    title: "The tone",
    body: "Comedy is math plus chaos. What's the engine of {title}?",
    choices: [
      {
        id: "scripted",
        label: "Shoot the script tight",
        sub: "Trust the page",
        text: "Every joke lands where the draft said it would. The table read was right.",
        fx: { quality: 4, appeal: 2 },
      },
      {
        id: "improv",
        label: "Let them improvise",
        sub: "Chaos tax: +$2M in film stock",
        text: "Forty takes of riffing, two of them genius. The edit suite becomes a comedy bunker.",
        fx: { appeal: 5, quality: 3, budget: 2_000_000, risk: 4 },
      },
      {
        id: "deadpan",
        label: "Play it completely deadpan",
        sub: "No one is allowed to know it's funny",
        text: "The cast plays it like Chekhov. Half the audience howls, half checks their phones.",
        fx: { quality: 6, appeal: -3, awards: 2 },
      },
    ],
  },

  thrHook: {
    id: "thr-hook",
    family: "thriller",
    title: "The hook",
    body: "{title} needs its scene — the one people describe badly at parties. Where does it happen?",
    choices: [
      {
        id: "elevator",
        label: "The elevator sequence",
        sub: "Four pages, one location",
        text: "One box, two actors, rising dread. Cheap to shoot, impossible to forget.",
        fx: { quality: 6, appeal: 3, awards: 2 },
      },
      {
        id: "chase",
        label: "The foot chase across the rooftops",
        sub: "+$3M",
        text: "Eleven rooftops, one broken awning, no permits in two jurisdictions. The trailer opens with it.",
        fx: { appeal: 6, budget: 3_000_000, risk: 4 },
      },
      {
        id: "twist",
        label: "The mid-film twist",
        sub: "Trust the script",
        text: "You move the reveal twenty minutes earlier and let the fallout be the movie. Nobody saw it coming.",
        fx: { quality: 7, awards: 3 },
      },
    ],
  },

  /* ------------------------------ top of market ------------------------------ */

  preSource: {
    id: "pre-source",
    family: "prestige",
    title: "The adaptation",
    body: "{title} comes from a beloved book. The author's estate is watching. The fans are armed. How faithful do you play it?",
    choices: [
      {
        id: "faithful",
        label: "Faithful, scene for scene",
        sub: "Serve the book",
        text: "The estate approves every page. The film is a monument — respectful, handsome, safe.",
        fx: { appeal: 4, quality: 2, awards: 3, studioRel: 4 },
      },
      {
        id: "personal",
        label: "Loose and personal",
        sub: "The book is a compass, not a map",
        text: "You change the ending and merge two characters. The estate issues a statement. The film is alive.",
        fx: { quality: 7, awards: 5, risk: 4 },
      },
      {
        id: "radical",
        label: "Radical reinvention",
        sub: "Same title, new soul",
        text: "You keep the title and the theme and rebuild everything else. Book Twitter declares war.",
        fx: { quality: 8, awards: 6, appeal: -5, risk: 7 },
      },
    ],
  },

  frCanon: {
    id: "fr-canon",
    family: "franchise",
    title: "The canon question",
    body: "{title} arrives with fifteen years of lore, a wiki maintained by volunteers, and a fanbase that treats continuity as scripture.",
    choices: [
      {
        id: "respect",
        label: "Respect the canon",
        sub: "The wiki stays happy",
        text: "Every easter egg lands. The fan screenings feel like church.",
        fx: { appeal: 6, quality: 1, studioRel: 4 },
      },
      {
        id: "retcon",
        label: "Retcon the last installment",
        sub: "It never happened. Mostly.",
        text: "You erase the bad sequel with one elegant line of dialogue. The fandom riots, then applauds.",
        fx: { quality: 5, appeal: 2, risk: 4 },
      },
      {
        id: "ignore",
        label: "Ignore the noise, make your film",
        sub: "Canon is a suggestion",
        text: "You make the movie you wanted to see. Half the fandom anoints you; the other half starts a petition.",
        fx: { quality: 6, appeal: -1, risk: 6, awards: 2 },
      },
    ],
  },

  frControl: {
    id: "fr-control",
    family: "franchise",
    title: "The committee",
    body: "On {title}, notes don't come from a person — they come from a committee. Eleven executives, one shared document, four hundred comments.",
    choices: [
      {
        id: "notes",
        label: "Take the notes",
        sub: "Deliver the product",
        text: "You implement 380 of 400 notes. The film is smooth, focus-grouped, and faintly airless. It will open huge.",
        fx: { appeal: 8, quality: -6, awards: -6, studioRel: 10, burnout: 6 },
      },
      {
        id: "fight",
        label: "Fight for your cut",
        sub: "Risk the relationship",
        text: "You win on the villain, lose on the runtime, and sneak the ending past them in the mix. The film has a pulse.",
        fx: { quality: 5, appeal: -2, studioRel: -8, burnout: 8 },
      },
    ],
  },

  stFormat: {
    id: "st-format",
    family: "streaming",
    title: "The format",
    body: "The platform's algorithm team has opinions about {title}. They have charts. The charts have charts.",
    choices: [
      {
        id: "binge",
        label: "Front-load the hook",
        sub: "First eight minutes decide everything",
        text: "You restage the opening so something irreversible happens before the title card. Completion rate soars.",
        fx: { appeal: 7, quality: -2 },
      },
      {
        id: "film",
        label: "Make a film, not content",
        sub: "Ignore the charts",
        text: "A slow first act, on purpose. The algorithm frowns. The critics don't.",
        fx: { quality: 6, awards: 3, appeal: -3 },
      },
    ],
  },

  paFunding: {
    id: "pa-funding",
    family: "passion",
    title: "The money",
    body: "No studio will make {title}. You knew that when you wrote it. The question is what you're willing to lose.",
    choices: [
      {
        id: "house",
        label: "Mortgage the house",
        sub: "All of it. Everything.",
        text: "Your lawyer begs you not to. You do it anyway. This is the one.",
        fx: { quality: 6, awards: 6, risk: 10, burnout: 8 },
      },
      {
        id: "presales",
        label: "Piece it together with pre-sales",
        sub: "Eight financiers, eight opinions",
        text: "You stitch the budget from foreign pre-sales and tax rebates. Every financier gets a logo, a credit, and a note.",
        fx: { quality: 2, risk: 5, studioRel: -2 },
      },
    ],
  },

  awCampaign: {
    id: "aw-campaign",
    family: "awards",
    title: "The campaign",
    body: "{title} has the goods. Awards season is a second production — screenings, dinners, handshakes, narratives. How hard do you campaign?",
    choices: [
      {
        id: "full",
        label: "Full campaign, no apologies",
        sub: "Q&As every night for months",
        text: "You shake every hand in the Academy. Twice. Your smile becomes a fixture of the season.",
        fx: { awards: 10, burnout: 10, money: -50_000 },
      },
      {
        id: "speak",
        label: "Let the film speak",
        sub: "Dignity above all",
        text: "One interview, zero stunts. The film stands alone — for better or worse.",
        fx: { awards: -2, quality: 1 },
      },
    ],
  },
};

/** Decision ids an archetype may reference. Kept explicit to catch typos. */
export function decision(id: keyof typeof DECISIONS): string {
  return DECISIONS[id]!.id;
}
