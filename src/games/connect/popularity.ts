/**
 * CONNECT — recognizability layer.
 *
 * The traversal graph stays complete (every credited performer remains a
 * valid intermediate hop). This module only decides which people are good
 * enough *endpoints* for a challenge, and how often each should be drawn.
 *
 * There is no popularity column in the snapshot, so the score is derived
 * from what the graph does contain — how many top-billed credits a person
 * has and how recent those credits are — nudged by a small curated list of
 * performers a normal movie fan is near-certain to recognize (which is how
 * classic-era icons stay in rotation without dragging in their supporting
 * casts).
 */

import type { Graph } from "./graph";

/** Household names. Boosted, never required — the heuristic carries the rest. */
const ICONS = new Set<string>([
  // Classic era
  "Humphrey Bogart", "Katharine Hepburn", "Audrey Hepburn", "Cary Grant", "James Stewart",
  "Marlon Brando", "Marilyn Monroe", "Grace Kelly", "Charles Chaplin", "Elizabeth Taylor",
  "Gregory Peck", "Paul Newman", "Steve McQueen", "Sidney Poitier", "Clint Eastwood",
  "Sean Connery", "Julie Andrews", "Jack Nicholson", "Robert Redford", "Faye Dunaway",
  "Gene Hackman", "Al Pacino", "Robert De Niro", "Diane Keaton", "Dustin Hoffman",
  "Robert Duvall", "Meryl Streep", "Sigourney Weaver", "Harrison Ford", "Carrie Fisher",
  "Mark Hamill", "Jodie Foster", "Michael Caine", "Anthony Hopkins", "Morgan Freeman",
  "Sylvester Stallone", "Arnold Schwarzenegger", "Bruce Willis", "Eddie Murphy", "Tom Hanks",
  "Whoopi Goldberg", "Michelle Pfeiffer", "Kurt Russell", "Kevin Costner", "Mel Gibson",
  // Modern mainstream
  "Tom Cruise", "Brad Pitt", "Leonardo DiCaprio", "Johnny Depp", "Matt Damon",
  "George Clooney", "Julia Roberts", "Nicole Kidman", "Cate Blanchett", "Kate Winslet",
  "Denzel Washington", "Will Smith", "Samuel L. Jackson", "Keanu Reeves", "Jim Carrey",
  "Sandra Bullock", "Charlize Theron", "Angelina Jolie", "Halle Berry", "Natalie Portman",
  "Scarlett Johansson", "Robert Downey Jr.", "Chris Evans", "Chris Hemsworth", "Mark Ruffalo",
  "Jeremy Renner", "Tom Holland", "Zendaya", "Timothée Chalamet", "Margot Robbie",
  "Ryan Gosling", "Ryan Reynolds", "Emma Stone", "Jennifer Lawrence", "Anne Hathaway",
  "Christian Bale", "Heath Ledger", "Joaquin Phoenix", "Matthew McConaughey", "Jake Gyllenhaal",
  "Hugh Jackman", "Ben Affleck", "Emily Blunt", "Amy Adams", "Viola Davis",
  "Idris Elba", "Michael B. Jordan", "Chadwick Boseman", "Zoe Saldana", "Dwayne Johnson",
  "Jason Statham", "Vin Diesel", "Daniel Craig", "Daniel Radcliffe", "Emma Watson",
  "Rupert Grint", "Anya Taylor-Joy", "Florence Pugh", "Pedro Pascal", "Oscar Isaac",
  "Adam Driver", "Saoirse Ronan", "Rachel McAdams", "Reese Witherspoon", "Jennifer Aniston",
  "Cameron Diaz", "Drew Barrymore", "Kirsten Dunst", "Tobey Maguire", "Andrew Garfield",
  "Gal Gadot", "Henry Cavill", "Jamie Foxx", "Will Ferrell", "Steve Carell",
  "Adam Sandler", "Ben Stiller", "Owen Wilson", "Jonah Hill", "Seth Rogen",
  "Melissa McCarthy", "Octavia Spencer", "Lupita Nyong'o", "Brie Larson", "Elizabeth Olsen",
  "Paul Rudd", "Chris Pratt", "Karen Gillan", "Dave Bautista", "Benedict Cumberbatch",
  "Tom Hardy", "Ewan McGregor", "Liam Neeson", "Ralph Fiennes", "Colin Firth",
  "Hugh Grant", "Helena Bonham Carter", "Judi Dench", "Maggie Smith", "Ian McKellen",
  "Viggo Mortensen", "Orlando Bloom", "Elijah Wood", "Cillian Murphy", "Kate Blanchett",
  "Bradley Cooper", "Edward Norton", "Kevin Spacey", "John Travolta", "Uma Thurman",
  "Nicolas Cage", "Keira Knightley", "Salma Hayek", "Penélope Cruz", "Javier Bardem",
  "Antonio Banderas", "Jackie Chan", "Jet Li", "Michelle Yeoh", "Ke Huy Quan",
  "Jamie Lee Curtis", "Frances McDormand", "Laura Dern", "Julianne Moore", "Tilda Swinton",
]);

export interface StarRating {
  id: string;
  name: string;
  score: number;
}

function recencyFactor(latestYear: number): number {
  if (latestYear >= 2010) return 1.5;
  if (latestYear >= 2000) return 1.35;
  if (latestYear >= 1990) return 1.15;
  if (latestYear >= 1975) return 0.95;
  return 0.7;
}

/** Recognizability score. Higher = draw more often as a challenge endpoint. */
export function starScore(graph: Graph, personId: string): number {
  const person = graph.peopleById[personId];
  if (!person) return 0;
  const years = person.movieIds.map((id) => graph.moviesById[id]?.year ?? 0);
  const latest = years.length ? Math.max(...years) : 0;
  const modern = years.filter((y) => y >= 1995).length;
  const credits = person.movieIds.length;
  let score = (credits + modern) * recencyFactor(latest);
  if (ICONS.has(person.name)) score *= 2.2;
  return score;
}

/**
 * People allowed to be a challenge start/target: prolific and still current,
 * deeply prolific regardless of era, or a curated icon. Everyone else stays
 * in the graph as an intermediate hop.
 */
export function challengePool(graph: Graph): StarRating[] {
  const out: StarRating[] = [];
  for (const id of graph.personIds) {
    const person = graph.peopleById[id]!;
    const credits = person.movieIds.length;
    const latest = Math.max(0, ...person.movieIds.map((m) => graph.moviesById[m]?.year ?? 0));
    const icon = ICONS.has(person.name);
    const eligible = (credits >= 5 && latest >= 1995) || credits >= 9 || (icon && credits >= 3);
    if (!eligible) continue;
    out.push({ id, name: person.name, score: starScore(graph, id) });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Weighted draw over a scored pool. */
export function pickWeighted(pool: StarRating[], random: () => number): string {
  let total = 0;
  for (const p of pool) total += p.score;
  let roll = random() * total;
  for (const p of pool) {
    roll -= p.score;
    if (roll <= 0) return p.id;
  }
  return pool[pool.length - 1]!.id;
}
