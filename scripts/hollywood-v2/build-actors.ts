/**
 * HOLLYWOOD V2 — actor bank build.
 *
 * Builds `public/data/hollywood-actors.json` from the authoritative
 * catalogue (Lovable Cloud), which the TMDB pipeline keeps hydrated. The
 * bank only includes people who actually act — at least two credited
 * character roles, or two TMDB credits with meaningful popularity — so
 * politicians and documentary subjects never appear at a casting call.
 *
 * Portraits: TMDB profile paths (hotlinked per TMDB attribution terms) with
 * Wikimedia Commons files as fallback. Nothing is rehosted.
 *
 *   bun scripts/hollywood-v2/build-actors.ts
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const SQL = `
with act as (
  select p.id, p.name, p.birth_year, p.popularity, p.profile_path, p.image_file,
    count(*) filter (where c.tmdb_credit_id is not null
      and c.character_name is not null
      and c.character_name not ilike '%self%'
      and c.character_name not ilike '%archive%'
      and lower(c.character_name) <> lower(p.name)) as roles,
    count(*) filter (where c.tmdb_credit_id is not null) as tmdb_credits,
    count(*) filter (where c.character_name ilike '%self%'
      or c.character_name ilike '%archive%') as self_credits
  from connect_people p
  join connect_cast c on c.person_id = p.id
  where p.tmdb_id is not null
    and p.profile_path is not null
    and p.birth_year between 1850 and 2012
  group by p.id
),
bank as (
  select * from act
  where roles >= 2
     or (tmdb_credits >= 2 and popularity >= 2.0 and self_credits < tmdb_credits * 0.6)
),
credits as (
  select distinct on (c.person_id, m.id)
    c.person_id, m.title, m.year,
    coalesce(m.popularity, 0) + coalesce(m.notability, 0) / 4.0 as score,
    (c.character_name is not null and c.character_name not ilike '%self%')::int as is_role
  from connect_cast c
  join connect_movies m on m.id = c.movie_id
  where c.person_id in (select id from bank)
  order by c.person_id, m.id, is_role desc, score desc
),
top_credits as (
  select person_id,
    jsonb_agg(jsonb_build_array(title, year) order by is_role desc, score desc)
      as credits
  from (
    select person_id, title, year, is_role, score,
      row_number() over (partition by person_id order by is_role desc, score desc) as rn
    from credits
  ) ranked
  where rn <= 4
  group by person_id
)
select jsonb_agg(jsonb_build_array(
  b.id, b.name, round(b.popularity::numeric, 2), b.profile_path, b.image_file,
  b.birth_year, coalesce(t.credits, '[]'::jsonb)
) order by b.popularity desc) as payload
from bank b
left join top_credits t on t.person_id = b.id
where b.popularity >= 0.35;
`;

const dbUrl = process.env["SUPABASE_DB_URL"];
if (!dbUrl) {
  console.error("SUPABASE_DB_URL is required");
  process.exit(1);
}

const raw = execFileSync(
  "psql",
  [dbUrl, "-At", "-c", `select payload from (${SQL}) q;`],
  { maxBuffer: 64 * 1024 * 1024 },
).toString();

type Row = [string, string, number, string, string, number, [string, number][]];
const rows = JSON.parse(raw.trim() || "[]") as Row[];

const payload = {
  version: new Date().toISOString().slice(0, 10),
  source:
    "NIRCOSI catalogue — TMDB (profiles, credits, popularity) + Wikidata CC0 identities; portraits via image.tmdb.org / Wikimedia Commons",
  count: rows.length,
  // [id, name, popularity, tmdbProfilePath, commonsFile, birthYear, [[title, year], ...]]
  actors: rows,
};

mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/hollywood-actors.json", JSON.stringify(payload));

const bands = [30, 12, 5, 2, 1, 0];
const dist = bands.map(
  (floor, i) =>
    rows.filter((r) => r[2] >= floor && (i === 0 || r[2] < bands[i - 1]!)).length,
);
console.log(`actors: ${rows.length}`);
console.log(`popularity bands [>=30,>=12,>=5,>=2,>=1,<1]: ${dist.join(" / ")}`);
console.log(`top: ${rows.slice(0, 6).map((r) => `${r[1]}(${r[2]})`).join(", ")}`);
