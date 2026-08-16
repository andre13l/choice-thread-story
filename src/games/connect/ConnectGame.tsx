import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONNECT } from "@/config/connect";
import {
  generateChallenge,
  pairKey,
  shortestPath,
  type Challenge,
  type GraphNode,
} from "./graph";
import { loadGraph, type Graph } from "./data/dataset";
import { PathTrail } from "./screens/PathTrail";
import { loadStats, recordCompletion, type ConnectStats } from "./storage";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

type Phase = "intro" | "playing" | "done";

export function ConnectGame() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [path, setPath] = useState<GraphNode[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState<ConnectStats>({
    completed: 0,
    bestOverpar: null,
    bestClicks: null,
  });
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setStats(loadStats());
    void loadGraph().then((loaded) => {
      if (!cancelled) setGraph(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => window.clearInterval(id);
  }, [phase, startedAt]);

  const startChallenge = useCallback(() => {
    if (!graph) return;
    const next = generateChallenge(graph, {
      minClicks: CONNECT.minClicks,
      maxClicks: CONNECT.maxClicks,
      avoid: seen.current,
    });
    seen.current.add(pairKey(next.startId, next.targetId));
    if (seen.current.size > 12) seen.current = new Set([...seen.current].slice(-8));
    setChallenge(next);
    setPath([{ kind: "person", id: next.startId }]);
    setStartedAt(null);
    setElapsed(0);
    setPhase("intro");
  }, [graph]);

  useEffect(() => {
    if (graph && !challenge) startChallenge();
  }, [graph, challenge, startChallenge]);

  const restart = useCallback(() => {
    if (!challenge) return;
    setPath([{ kind: "person", id: challenge.startId }]);
    setStartedAt(Date.now());
    setElapsed(0);
    setPhase("playing");
  }, [challenge]);

  const begin = useCallback(() => {
    setStartedAt(Date.now());
    setPhase("playing");
  }, []);

  const current = path[path.length - 1];
  const clicks = path.length - 1;

  const step = useCallback(
    (node: GraphNode) => {
      if (!challenge) return;
      const next = [...path, node];
      setPath(next);
      if (node.kind === "person" && node.id === challenge.targetId) {
        setPhase("done");
        setElapsed(startedAt ? Date.now() - startedAt : 0);
        setStats(recordCompletion(next.length - 1, challenge.best));
      }
    },
    [challenge, path, startedAt],
  );

  const undo = useCallback(() => {
    setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
  }, []);

  const jumpTo = useCallback((index: number) => {
    setPath((p) => p.slice(0, index + 1));
  }, []);

  const bestPath = useMemo(
    () =>
      phase === "done" && challenge && graph
        ? shortestPath(graph, challenge.startId, challenge.targetId)
        : null,
    [phase, challenge, graph],
  );

  if (!graph || !challenge || !current) {
    return (
      <div className="stage flex min-h-screen items-center justify-center px-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Loading the film graph…
        </p>
      </div>
    );
  }

  const start = graph.peopleById[challenge.startId]!;
  const target = graph.peopleById[challenge.targetId]!;

  if (phase === "intro") {
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {CONNECT.kicker}
        </p>
        <div className="mt-7 h-px w-14 bg-link/70" />
        <h1 className="mt-6 font-display text-[clamp(2.8rem,11vw,5.5rem)] leading-none tracking-[0.1em] text-foreground">
          {CONNECT.name}
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {CONNECT.tagline}
        </p>

        <div className="mt-12 flex w-full max-w-lg items-stretch gap-3">
          <ActorPlaque label="Start" name={start.name} />
          <div className="flex items-center text-muted-foreground/50">→</div>
          <ActorPlaque label="Target" name={target.name} accent />
        </div>

        <button
          onClick={begin}
          className="mt-12 border border-link bg-link px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-link-foreground transition-colors duration-300 hover:bg-transparent hover:text-link"
        >
          Begin
        </button>
        <button
          onClick={startChallenge}
          className="mt-5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          New challenge
        </button>
        {stats.completed > 0 && (
          <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            {stats.completed} solved
            {stats.bestOverpar !== null &&
              ` · best ${stats.bestOverpar === 0 ? "perfect route" : `+${stats.bestOverpar} over`}`}
          </p>
        )}
        <Link
          to="/"
          className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          All games
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-16">
        <div className="w-full max-w-2xl">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.3em] text-link">
            Connected
          </p>
          <h2 className="mt-6 text-center font-display text-[clamp(2.2rem,8vw,3.6rem)] leading-none tracking-[0.06em] text-foreground">
            {clicks} CLICK{clicks === 1 ? "" : "S"}
          </h2>
          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat label="Best possible" value={String(challenge.best)} accent />
            <Stat label="Your route" value={String(clicks)} />
            <Stat label="Time" value={formatTime(elapsed)} />
          </div>

          <p className="mt-10 text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
            Your path
          </p>
          <div className="mt-3">
            <PathTrail graph={graph} path={path} />
          </div>

          {bestPath && clicks > challenge.best && (
            <>
              <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                One shortest route
              </p>
              <div className="mt-3 opacity-70">
                <PathTrail graph={graph} path={bestPath} />
              </div>
            </>
          )}

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <button
              onClick={startChallenge}
              className="border border-link bg-link px-8 py-3 text-[11px] font-medium uppercase tracking-[0.26em] text-link-foreground transition-colors hover:bg-transparent hover:text-link"
            >
              New challenge
            </button>
            <button
              onClick={restart}
              className="border border-border px-8 py-3 text-[11px] font-medium uppercase tracking-[0.26em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Replay this one
            </button>
          </div>
          <p className="mt-8 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            {stats.completed} solved
          </p>
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              All games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stage flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                Target
              </p>
              <p className="truncate font-display text-base font-semibold tracking-[0.05em] text-link">
                {target.name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <Meter label="Clicks" value={String(clicks)} />
              <Meter label="Time" value={formatTime(elapsed)} />
            </div>
          </div>
          <div className="mt-2.5">
            <PathTrail graph={graph} path={path} onJump={jumpTo} />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        {current.kind === "person" ? (
          <PersonPage graph={graph} personId={current.id} onPick={(id) => step({ kind: "movie", id })} />
        ) : (
          <MoviePage graph={graph} movieId={current.id} onPick={(id) => step({ kind: "person", id })} />
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/85 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <button
            onClick={undo}
            disabled={path.length < 2}
            className="border border-border px-5 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            Undo
          </button>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Restart
            </button>
            <button
              onClick={startChallenge}
              className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
            >
              New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonPage({
  graph,
  personId,
  onPick,
}: {
  graph: Graph;
  personId: string;
  onPick: (movieId: string) => void;
}) {
  const person = graph.peopleById[personId]!;
  return (
    <div key={personId} className="anim-fade-up">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-link/50 bg-link/10 font-display text-xl font-bold tracking-[0.08em] text-link">
          {initials(person.name)}
        </div>
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
        {person.movieIds.length} {person.movieIds.length === 1 ? "film" : "films"}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {person.movieIds.map((id: string) => {
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
    </div>
  );
}

function MoviePage({
  graph,
  movieId,
  onPick,
}: {
  graph: Graph;
  movieId: string;
  onPick: (personId: string) => void;
}) {
  const movie = graph.moviesById[movieId]!;
  return (
    <div key={movieId} className="anim-fade-up">
      <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
        Film · {movie.year}
      </p>
      <h2 className="mt-2 font-display text-[clamp(1.7rem,7vw,3rem)] font-semibold leading-tight tracking-[0.03em] text-foreground">
        {movie.title}
      </h2>
      <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
        Credited cast
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {movie.personIds.map((id: string) => {
          const person = graph.peopleById[id]!;
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              className="group flex items-center gap-3 border border-border/70 bg-card/40 px-4 py-3 text-left transition-colors hover:border-link/60 hover:bg-card/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-border/70 font-display text-[11px] font-bold tracking-[0.06em] text-muted-foreground group-hover:border-link/50 group-hover:text-link">
                {initials(person.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-[15px] font-medium tracking-[0.02em] text-foreground">
                  {person.name}
                </span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {person.movieIds.length} {person.movieIds.length === 1 ? "film" : "films"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActorPlaque({ label, name, accent }: { label: string; name: string; accent?: boolean }) {
  return (
    <div
      className={`flex-1 border px-4 py-5 ${accent ? "border-link/60 bg-link/5" : "border-border/70 bg-card/40"}`}
    >
      <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mx-auto mt-3 flex h-12 w-12 items-center justify-center border font-display text-sm font-bold ${
          accent ? "border-link/50 text-link" : "border-border/70 text-foreground"
        }`}
      >
        {initials(name)}
      </p>
      <p className="mt-3 font-display text-[15px] font-semibold leading-snug tracking-[0.03em] text-foreground">
        {name}
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-r border-border/70 px-4 py-5 text-center last:border-r-0">
      <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-2xl font-bold tracking-[0.04em] ${accent ? "text-link" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-base font-semibold tracking-[0.05em] text-foreground">
        {value}
      </p>
    </div>
  );
}
