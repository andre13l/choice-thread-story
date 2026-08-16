/**
 * One-time catalogue import.
 *
 * Reads the shipped snapshot (`/data/connect-graph.json`) and upserts it into
 * the backend catalogue tables. Refuses to run once the catalogue already has
 * rows, so it cannot be abused as a public write endpoint. Re-importing is a
 * maintenance action: pass `?reset=1` together with the import token.
 */

import { createFileRoute } from "@tanstack/react-router";

interface RawDataset {
  people: [string, string, number, string, number][];
  films: [string, string, number, number][];
  cast: [number, number, string][][];
}

const CHUNK = 1000;
const MIN_NOTABILITY = 45;
const MIN_CREDITS = 3;

function chunked<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export const Route = createFileRoute("/api/public/connect-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const reset = url.searchParams.get("reset") === "1";
        const token = process.env["CONNECT_IMPORT_TOKEN"];

        const { count } = await supabaseAdmin
          .from("connect_movies")
          .select("id", { count: "exact", head: true });

        if ((count ?? 0) > 0) {
          if (!reset) {
            return Response.json(
              { ok: false, reason: "catalogue already imported", films: count },
              { status: 409 },
            );
          }
          if (!token || request.headers.get("x-import-token") !== token) {
            return Response.json({ ok: false, reason: "reset requires token" }, { status: 401 });
          }
          await supabaseAdmin.from("connect_cast").delete().neq("movie_id", "");
          await supabaseAdmin.from("connect_movies").delete().neq("id", "");
          await supabaseAdmin.from("connect_people").delete().neq("id", "");
        }

        const dataset = (await fetch(new URL("/data/connect-graph.json", url.origin)).then((r) =>
          r.json(),
        )) as RawDataset;

        const credits = new Map<string, number>();
        for (const row of dataset.cast) {
          for (const [personIndex] of row) {
            const qid = dataset.people[personIndex]?.[0];
            if (qid) credits.set(qid, (credits.get(qid) ?? 0) + 1);
          }
        }

        const people = dataset.people
          .filter(([qid]) => (credits.get(qid) ?? 0) > 0)
          .map(([id, name, notability, image, birthYear]) => ({
            id,
            name,
            notability,
            birth_year: birthYear || null,
            image_file: image || null,
            image_attribution_url: image
              ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(image)}`
              : null,
            challenge_eligible:
              notability >= MIN_NOTABILITY && (credits.get(id) ?? 0) >= MIN_CREDITS,
          }));

        const movies = dataset.films.map(([id, title, year, notability]) => ({
          id,
          title,
          year,
          notability,
        }));

        const castRows: {
          movie_id: string;
          person_id: string;
          billing: number | null;
          character_name: string | null;
        }[] = [];
        dataset.films.forEach(([movieId], index) => {
          for (const [personIndex, billing, character] of dataset.cast[index] ?? []) {
            const personId = dataset.people[personIndex]?.[0];
            if (!personId) continue;
            castRows.push({
              movie_id: movieId,
              person_id: personId,
              billing: billing || null,
              character_name: character || null,
            });
          }
        });

        for (const batch of chunked(people)) {
          const { error } = await supabaseAdmin.from("connect_people").upsert(batch);
          if (error) return Response.json({ ok: false, stage: "people", error: error.message }, { status: 500 });
        }
        for (const batch of chunked(movies)) {
          const { error } = await supabaseAdmin.from("connect_movies").upsert(batch);
          if (error) return Response.json({ ok: false, stage: "movies", error: error.message }, { status: 500 });
        }
        for (const batch of chunked(castRows)) {
          const { error } = await supabaseAdmin.from("connect_cast").upsert(batch);
          if (error) return Response.json({ ok: false, stage: "cast", error: error.message }, { status: 500 });
        }

        return Response.json({
          ok: true,
          films: movies.length,
          people: people.length,
          connections: castRows.length,
          challengeActors: people.filter((p) => p.challenge_eligible).length,
        });
      },
    },
  },
});
