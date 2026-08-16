/**
 * ENDINGS — how the career actually stops.
 *
 * The ending is chosen from whichever pressure family finally won, and
 * written with details from the run itself, so two careers never end the
 * same way twice. Tone: dark, dry, fictional.
 */

import { formatMoney } from "../scoring";
import type { PressureFamily } from "./pressure";
import type { DirectorCareer } from "./types";

export interface Ending {
  /** Short label above the fate line. */
  title: string;
  /** One or two sentences, already templated. */
  fate: string;
  family: PressureFamily;
}

interface Template {
  title: string;
  lines: string[];
}

const BANK: Record<PressureFamily, Template[]> = {
  financial: [
    {
      title: "Chapter Eleven",
      lines: [
        "The receivers take the house, the cars and the framed one-sheet for {best}. The debt outlives the reviews.",
        "You owe {debt}. The court appoints someone to sell your life in the order it was acquired.",
      ],
    },
    {
      title: "The Last Investor",
      lines: [
        "You put your own money into {last} and the money did not come back. Neither did the people who lent you theirs.",
        "The final wire never clears. A production company you no longer control keeps making films with your name misspelled on the paperwork.",
      ],
    },
  ],
  studio: [
    {
      title: "Turnaround",
      lines: [
        "After {last}, every studio in town runs the same numbers and reaches the same conclusion. Your agent stops pretending the meetings are real.",
        "The green light never comes back. Eleven projects die in development, one of them twice.",
      ],
    },
    {
      title: "Uninsurable",
      lines: [
        "The completion bond company circulates a memo with your name in it. That memo ends the career more efficiently than any review.",
        "You are, technically, still a working director. Nobody will underwrite you.",
      ],
    },
  ],
  irrelevance: [
    {
      title: "The Phone Stops",
      lines: [
        "There is no final film, no announcement, no farewell. There is just a year where nobody calls, and then another one.",
        "A streaming service licenses {best} for a package deal. Your name is not in the press release.",
      ],
    },
    {
      title: "Where Are They Now",
      lines: [
        "A magazine runs a nostalgic piece about {best}. The interview request goes to your old email address.",
        "You teach, occasionally. Students look you up afterwards and are surprised by the box office numbers.",
      ],
    },
  ],
  scandal: [
    {
      title: "The Cycle",
      lines: [
        "It takes eleven days. By the end of them the poster for {last} has been quietly removed from the studio lobby.",
        "The clip is fourteen seconds long and outlives everything you ever shot.",
      ],
    },
    {
      title: "Statement Issued",
      lines: [
        "Your representation 'no longer works with' you. Your last three collaborators post the same paragraph within an hour of each other.",
        "The retrospective is cancelled. The films remain; the invitations do not.",
      ],
    },
  ],
  excess: [
    {
      title: "The Overreach",
      lines: [
        "You spent {peak} building something nobody asked for, at a scale nobody could insure, and the fall is proportional to the height.",
        "Everyone warned you about the budget on {last}. You were right up until the exact moment you were catastrophically wrong.",
      ],
    },
    {
      title: "Diminishing Returns",
      lines: [
        "The empire runs on momentum for two more years and then simply stops, the way large things do.",
        "The parties continue. The films do not.",
      ],
    },
  ],
  obsession: [
    {
      title: "The Unfinished One",
      lines: [
        "You spend the rest of it recutting a film nobody will release. The negative is in a climate-controlled unit you pay for monthly.",
        "There is a version of {last} that is a masterpiece. It is nine hours long and exists on one drive.",
      ],
    },
    {
      title: "Vanishing Act",
      lines: [
        "You go to shoot second unit in a country with bad roads and simply do not come back.",
        "The last confirmed sighting is a hotel bar near a location that was never scouted.",
      ],
    },
  ],
  burnout: [
    {
      title: "Doctor's Orders",
      lines: [
        "The second collapse happens in a car park and the insurers make the decision for you.",
        "You are alive, comfortable and forbidden from working. It takes about four months to discover which of those matters.",
      ],
    },
    {
      title: "Wrap",
      lines: [
        "You finish {last}, go home, and find that the thing that made you get up is no longer there.",
        "Everyone agrees you should slow down. It turns out slowing down was the whole ending.",
      ],
    },
  ],
};

function fill(line: string, c: DirectorCareer): string {
  const best = [...c.films].sort((a, b) => b.worldwide - a.worldwide)[0];
  const last = c.films[c.films.length - 1];
  return line
    .replace(/{best}/g, best?.title ?? "your first film")
    .replace(/{last}/g, last?.title ?? "the one that never shot")
    .replace(/{debt}/g, formatMoney(Math.abs(Math.min(0, c.money))))
    .replace(/{peak}/g, formatMoney(Math.max(c.peak.budget, c.peak.money)));
}

export function buildEnding(c: DirectorCareer, family: PressureFamily, rand: number): Ending {
  const templates = BANK[family];
  const t = templates[Math.floor(rand * templates.length) % templates.length]!;
  const line = t.lines[Math.floor(rand * 977) % t.lines.length]!;
  return { title: t.title, fate: fill(line, c), family };
}

/** Legacy tier shown on the recap. Deliberately not a score. */
export function legacyTier(c: DirectorCareer): string {
  if (c.legend) return "Legend";
  const gross = c.films.reduce((a, f) => a + f.worldwide, 0);
  const avg = c.films.length ? c.films.reduce((a, f) => a + f.critics, 0) / c.films.length : 0;
  if (c.oscars >= 2 && avg >= 70) return "Canonised";
  if (c.oscars >= 1) return "Remembered";
  if (gross >= 2_000_000_000) return "Household Name";
  if (c.prestige >= 60 || avg >= 74) return "Critical Favourite";
  if (c.films.some((f) => f.cult)) return "Cult Footnote";
  if (c.films.length >= 6) return "Footnote";
  if (c.films.length >= 2) return "Forgotten";
  return "Unrecorded";
}
