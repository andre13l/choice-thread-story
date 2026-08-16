/**
 * DAILY PERSON — selection, clue construction and answer checking.
 * SERVER ONLY: the answer must never be derivable from the page payload.
 *
 * Reuses the shared Connect catalogue (`connect_people` / `connect_cast` /
 * `connect_movies`) rather than inventing a second dataset, and the shared
 * daily calendar + seeded RNG from `games/core/daily`.
 *
 * Selection is deterministic from the date, so every player gets the same
 * person even if no `daily_person` row was published; a published row, when
 * present, wins.
 */
import { dailyNumber, seededShuffle, answerKey } from "@/games/core/daily";
import { dayNumberFromDate } from "@/games/core/dailyStats";
import type { PersonClue, PersonPrompt, PersonReveal } from "./types";
import { PERSON_MAX_CLUES } from "./types";

const POOL_SIZE = 400;
const MIN_CREDITS = 8;
const CALENDAR_SEED = 0x9e2f11;

interface PoolPerson {
  id: string;
  name: string;
  notability: number;
  birth_year: number | null;
  image_file: string | null;
}

interface Credit {
  movieId: string;
  title: string;
  year: number;
  notability: number;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Most recognizable people with a portrait — a daily should never open on a nobody. */
async function loadPool(): Promise<PoolPerson[]> {
  const db = await admin();
  const { data, error } = await db
    .from("connect_people")
    .select("id, name, notability, birth_year, image_file")
    .eq("challenge_eligible", true)
    .not("image_file", "is", null)
    .order("notability", { ascending: false })
    .limit(POOL_SIZE);
  if (error) throw new Error(error.message);
  return (data ?? []) as PoolPerson[];
}

async function loadCredits(personId: string): Promise<Credit[]> {
  const db = await admin();
  const { data: castRows, error } = await db
    .from("connect_cast")
    .select("movie_id")
    .eq("person_id", personId);
  if (error) throw new Error(error.message);
  const ids = (castRows ?? []).map((row) => row.movie_id);
  if (ids.length === 0) return [];

  const { data: movies } = await db
    .from("connect_movies")
    .select("id, title, year, notability")
    .in("id", ids);

  return (movies ?? [])
    .map((m) => ({ movieId: m.id, title: m.title, year: m.year, notability: m.notability }))
    .sort((a, b) => b.notability - a.notability);
}

/** The most recognizable co-star across the person's filmography. */
async function topCoStar(personId: string, credits: Credit[]): Promise<string | null> {
  if (credits.length === 0) return null;
  const db = await admin();
  const { data: rows } = await db
    .from("connect_cast")
    .select("person_id")
    .in(
      "movie_id",
      credits.slice(0, 12).map((c) => c.movieId),
    );
  const ids = [...new Set((rows ?? []).map((r) => r.person_id))].filter((id) => id !== personId);
  if (ids.length === 0) return null;

  const { data: people } = await db
    .from("connect_people")
    .select("name, notability")
    .in("id", ids.slice(0, 400))
    .eq("challenge_eligible", true)
    .order("notability", { ascending: false })
    .limit(1);
  return people?.[0]?.name ?? null;
}

async function overrideFor(date: string): Promise<PoolPerson | null> {
  try {
    const db = await admin();
    const { data } = await db
      .from("daily_person")
      .select("person_id, published")
      .eq("date", date)
      .maybeSingle();
    if (!data?.published) return null;
    const { data: person } = await db
      .from("connect_people")
      .select("id, name, notability, birth_year, image_file")
      .eq("id", data.person_id)
      .maybeSingle();
    return (person as PoolPerson) ?? null;
  } catch {
    return null;
  }
}

export interface DailyPerson {
  person: PoolPerson;
  credits: Credit[];
}

/**
 * Same date + same catalogue = same person. The rotation walks a seeded
 * shuffle of the pool, so a person can't recur until the pool is exhausted.
 */
export async function personFor(date: string): Promise<DailyPerson> {
  const override = await overrideFor(date);
  if (override) return { person: override, credits: await loadCredits(override.id) };

  const pool = await loadPool();
  if (pool.length === 0) throw new Error("Daily Person pool is empty");
  const order = seededShuffle(pool, CALENDAR_SEED);
  const start = ((dayNumberFromDate(date) % order.length) + order.length) % order.length;

  for (let step = 0; step < Math.min(order.length, 40); step++) {
    const candidate = order[(start + step) % order.length]!;
    const credits = await loadCredits(candidate.id);
    if (credits.length >= MIN_CREDITS) return { person: candidate, credits };
  }
  const fallback = order[start]!;
  return { person: fallback, credits: await loadCredits(fallback.id) };
}

function decade(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

/**
 * Clue ladder: obscure → unmistakable. Each clue is strictly more useful
 * than the last, and the portrait is always the final give-away.
 */
export async function cluesFor(daily: DailyPerson): Promise<PersonClue[]> {
  const { person, credits } = daily;
  const clues: PersonClue[] = [];
  const byFame = credits;
  const obscure = byFame[byFame.length - 1];
  const mid = byFame[Math.floor(byFame.length / 2)];
  const famous = byFame[0];
  const earliest = credits.reduce((min, c) => Math.min(min, c.year), 9999);

  const profileBits: string[] = [];
  if (person.birth_year) profileBits.push(`Born in the ${decade(person.birth_year)}`);
  if (earliest < 9999) profileBits.push(`first credit here in ${earliest}`);
  profileBits.push(`${credits.length} films in the NIRCOSI catalogue`);
  clues.push({
    index: 1,
    kind: "profile",
    label: "Profile",
    text: `${profileBits.join(" · ")}.`,
  });

  if (obscure) {
    clues.push({
      index: 2,
      kind: "credit",
      label: "Deep cut",
      text: `Appeared in ${obscure.title} (${obscure.year}).`,
    });
  }
  if (mid) {
    clues.push({
      index: 3,
      kind: "credit",
      label: "Credit",
      text: `Also in ${mid.title} (${mid.year}).`,
    });
  }

  const coStar = await topCoStar(person.id, credits);
  if (coStar) {
    clues.push({
      index: 4,
      kind: "costar",
      label: "Shared the screen",
      text: `Has worked with ${coStar}.`,
    });
  }
  if (famous) {
    clues.push({
      index: 5,
      kind: "credit",
      label: "Best known",
      text: `Best known here for ${famous.title} (${famous.year}).`,
    });
  }
  clues.push({
    index: 6,
    kind: "portrait",
    label: "The face",
    text: "That's them.",
    ...(person.image_file ? { imageFile: person.image_file } : {}),
  });

  return clues.slice(0, PERSON_MAX_CLUES).map((clue, i) => ({ ...clue, index: i + 1 }));
}

export async function promptFor(date: string, revealed: number): Promise<PersonPrompt> {
  const daily = await personFor(date);
  const clues = await cluesFor(daily);
  const count = Math.max(1, Math.min(revealed || 1, clues.length));
  return {
    date,
    number: dailyNumber(date),
    totalClues: clues.length,
    clues: clues.slice(0, count),
  };
}

export async function checkGuess(date: string, guess: string): Promise<boolean> {
  const { person } = await personFor(date);
  return answerKey(guess) === answerKey(person.name);
}

export async function revealFor(date: string): Promise<PersonReveal> {
  const { person, credits } = await personFor(date);
  return {
    name: person.name,
    imageFile: person.image_file,
    birthYear: person.birth_year,
    credits: credits.slice(0, 6).map((c) => ({ title: c.title, year: c.year })),
  };
}

/** Autocomplete over the recognizable pool, so guessing isn't a spelling test. */
export async function searchPeople(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const db = await admin();
  const { data } = await db
    .from("connect_people")
    .select("name, notability")
    .eq("challenge_eligible", true)
    .ilike("name", `%${q.replace(/[%_]/g, "")}%`)
    .order("notability", { ascending: false })
    .limit(8);
  return (data ?? []).map((row) => row.name);
}
