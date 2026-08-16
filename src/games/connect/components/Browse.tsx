import { useMemo, useState } from "react";
import type { Graph } from "../data/dataset";
import { Portrait } from "./Portrait";

/** Long casts and filmographies get a filter box; short ones don't need one. */
const FILTER_THRESHOLD = 12;

function FilterBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-3 w-full border border-border/70 bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-link/60"
    />
  );
}

function ReportLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 underline decoration-border underline-offset-4 transition-colors hover:text-link"
    >
      {label}
    </button>
  );
}

export function PersonPage({
  graph,
  personId,
  onPick,
  onReport,
}: {
  graph: Graph;
  personId: string;
  onPick: (movieId: string) => void;
  onReport: () => void;
}) {
  const person = graph.peopleById[personId]!;
  const [filter, setFilter] = useState("");

  const films = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const ids = person.movieIds;
    if (!q) return ids;
    return ids.filter((id) => graph.moviesById[id]!.title.toLowerCase().includes(q));
  }, [filter, person.movieIds, graph]);

  return (
    <div key={personId} className="anim-fade-up">
      <div className="flex items-center gap-4">
        <Portrait person={person} size="md" accent showAttribution />
        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
            Actor
          </p>
          <h2 className="font-display text-[clamp(1.5rem,6vw,2.4rem)] font-semibold leading-tight tracking-[0.04em] text-foreground">
            {person.name}
          </h2>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
        {person.movieIds.length} {person.movieIds.length === 1 ? "movie" : "movies"} in Connect
      </p>
      {person.movieIds.length > FILTER_THRESHOLD && (
        <FilterBox value={filter} onChange={setFilter} placeholder="Filter these movies…" />
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {films.map((id) => {
          const movie = graph.moviesById[id]!;
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              className="group border border-border/70 bg-card/40 px-4 py-3 text-left transition-colors hover:border-link/60 hover:bg-card/70"
            >
              <span className="block font-display text-[15px] font-medium leading-snug tracking-[0.02em] text-foreground">
                {movie.title}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground group-hover:text-link">
                {movie.year}
              </span>
            </button>
          );
        })}
      </div>
      {films.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">No movies match that filter.</p>
      )}

      <ReportLink label="Missing a movie in Connect?" onClick={onReport} />
    </div>
  );
}

export function MoviePage({
  graph,
  movieId,
  onPick,
  onReport,
}: {
  graph: Graph;
  movieId: string;
  onPick: (personId: string) => void;
  onReport: () => void;
}) {
  const movie = graph.moviesById[movieId]!;
  const [filter, setFilter] = useState("");

  const cast = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return movie.personIds;
    return movie.personIds.filter((id) => graph.peopleById[id]!.name.toLowerCase().includes(q));
  }, [filter, movie.personIds, graph]);

  return (
    <div key={movieId} className="anim-fade-up">
      <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
        Film · {movie.year}
      </p>
      <h2 className="mt-2 font-display text-[clamp(1.7rem,7vw,3rem)] font-semibold leading-tight tracking-[0.03em] text-foreground">
        {movie.title}
      </h2>

      <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
        Credited cast · {movie.personIds.length}
      </p>
      {movie.personIds.length > FILTER_THRESHOLD && (
        <FilterBox value={filter} onChange={setFilter} placeholder="Filter this cast…" />
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cast.map((id) => {
          const person = graph.peopleById[id]!;
          const character = movie.characters[id];
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              className="group flex items-center gap-3 border border-border/70 bg-card/40 px-4 py-3 text-left transition-colors hover:border-link/60 hover:bg-card/70"
            >
              <Portrait person={person} size="sm" />
              <span className="min-w-0">
                <span className="block truncate font-display text-[15px] font-medium tracking-[0.02em] text-foreground">
                  {person.name}
                </span>
                <span className="block truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {character ||
                    `${person.movieIds.length} ${person.movieIds.length === 1 ? "movie" : "movies"}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {cast.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">No cast members match that filter.</p>
      )}

      <ReportLink label="Missing someone from this cast?" onClick={onReport} />
    </div>
  );
}

export function GraphError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="stage flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="text-[11px] uppercase tracking-[0.28em] text-destructive">Connection lost</p>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="mt-8 border border-link bg-link px-9 py-3 text-[11px] font-medium uppercase tracking-[0.26em] text-link-foreground transition-colors hover:bg-transparent hover:text-link"
      >
        Retry
      </button>
    </div>
  );
}

export function GraphLoading() {
  return (
    <div className="stage flex min-h-screen items-center justify-center px-5">
      <p className="animate-pulse text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        Loading the film graph…
      </p>
    </div>
  );
}
