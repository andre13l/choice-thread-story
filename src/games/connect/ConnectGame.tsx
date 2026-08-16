import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONNECT } from "@/config/connect";
import { generateChallenge, pairKey, shortestPath, type Challenge, type GraphNode } from "./graph";
import { GraphError, GraphLoading, MoviePage, PersonPage } from "./components/Browse";
import { GraphStats } from "./components/GraphStats";
import { Portrait } from "./components/Portrait";
import { ReportDialog, type ReportContext } from "./components/ReportDialog";
import { useGraph } from "./useGraph";
import { PathTrail } from "./screens/PathTrail";
import { loadStats, recordCompletion, type ConnectStats } from "./storage";
import type { Person } from "./data/dataset";

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

type Phase = "intro" | "playing" | "done" | "gaveup";

export function ConnectGame() {
  const { graph, error, retry } = useGraph();
  const [phase, setPhase] = useState<Phase>("intro");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [path, setPath] = useState<GraphNode[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState<ReportContext | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [stats, setStats] = useState<ConnectStats>({
    completed: 0,
    bestOverpar: null,
    bestClicks: null,
  });
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => setStats(loadStats()), []);

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
    setConfirmQuit(false);
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
    setConfirmQuit(false);
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

  const undo = useCallback(() => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p)), []);
  const jumpTo = useCallback((index: number) => setPath((p) => p.slice(0, index + 1)), []);

  const bestPath = useMemo(
    () =>
      (phase === "done" || phase === "gaveup") && challenge && graph
        ? shortestPath(graph, challenge.startId, challenge.targetId)
        : null,
    [phase, challenge, graph],
  );

  if (error) return <GraphError message={error} onRetry={retry} />;
  if (!graph || !challenge || !current) return <GraphLoading />;

  const start = graph.peopleById[challenge.startId]!;
  const target = graph.peopleById[challenge.targetId]!;

  const dialog = (
    <ReportDialog
      open={report !== null}
      context={report ?? { kind: "other" }}
      onClose={() => setReport(null)}
    />
  );

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
          <ActorPlaque label="Start" person={start} />
          <div className="flex items-center text-muted-foreground/50">→</div>
          <ActorPlaque label="Target" person={target} accent />
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
        <Link
          to="/connect/daily"
          className="mt-5 text-[11px] uppercase tracking-[0.2em] text-link transition-opacity hover:opacity-70"
        >
          Play today's daily
        </Link>
        {stats.completed > 0 && (
          <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            {stats.completed} solved
            {stats.bestOverpar !== null &&
              ` · best ${stats.bestOverpar === 0 ? "perfect route" : `+${stats.bestOverpar} over`}`}
          </p>
        )}

        <GraphStats graph={graph} />
        <p className="mt-5 max-w-sm text-[12px] leading-relaxed text-muted-foreground/80">
          Cinema is huge. Our graph isn't complete yet.{" "}
          <button
            onClick={() => setReport({ kind: "other", subject: "General feedback" })}
            className="underline decoration-border underline-offset-4 transition-colors hover:text-link"
          >
            Spot something missing? Help us improve it.
          </button>
        </p>

        <Link
          to="/"
          className="mt-10 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          All games
        </Link>
        {dialog}
      </div>
    );
  }

  if (phase === "done" || phase === "gaveup") {
    const gaveUp = phase === "gaveup";
    const shareText = [
      `NIRCOSI CONNECT`,
      `${start.name} → ${target.name}`,
      gaveUp ? "❌ gave up" : `🔗 ${clicks} connection${clicks === 1 ? "" : "s"} (best ${challenge.best})`,
      "Beat my path: nircosi.com/connect",
    ].join("\n");
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-8 sm:py-14">
        <ResultSurface label="Connect result">
          <p
            className={`text-center text-[11px] font-medium uppercase tracking-[0.3em] ${gaveUp ? "text-muted-foreground" : "text-link"}`}
          >
            {gaveUp ? "Gave up" : "Connected"}
          </p>
          <h2 className="mt-6 text-center font-display text-[clamp(2.2rem,8vw,3.6rem)] leading-none tracking-[0.06em] text-foreground">
            {gaveUp ? target.name : `${clicks} CLICK${clicks === 1 ? "" : "S"}`}
          </h2>
          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat label="Best possible" value={String(challenge.best)} accent />
            <Stat label="Your route" value={gaveUp ? "—" : String(clicks)} />
            <Stat label="Time" value={formatTime(elapsed)} />
          </div>

          <div className="mt-8 flex justify-center">
            <ShareButton text={shareText} accent="link" className="mt-0 w-full sm:w-auto">
              Challenge a friend
            </ShareButton>
          </div>


          {!gaveUp && (
            <>
              <p className="mt-10 text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                Your path
              </p>
              <div className="mt-3">
                <PathTrail graph={graph} path={path} />
              </div>
            </>
          )}

          {bestPath && (gaveUp || clicks > challenge.best) && (
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
          <div className="mt-6 flex flex-wrap justify-center gap-5">
            <Link
              to="/connect/daily"
              className="text-[11px] uppercase tracking-[0.2em] text-link transition-opacity hover:opacity-70"
            >
              Daily Connect
            </Link>
            <Link
              to="/"
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              All games
            </Link>
          </div>
        </ResultSurface>
        {dialog}
      </div>
    );
  }

  return (
    <div className="stage flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Portrait person={target} size="sm" accent />
              <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                  Target
                </p>
                <p className="truncate font-display text-base font-semibold tracking-[0.05em] text-link">
                  {target.name}
                </p>
              </div>
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
          <PersonPage
            graph={graph}
            personId={current.id}
            onPick={(id) => step({ kind: "movie", id })}
            onReport={() =>
              setReport({
                kind: "movie_missing",
                personId: current.id,
                subject: graph.peopleById[current.id]!.name,
              })
            }
          />
        ) : (
          <MoviePage
            graph={graph}
            movieId={current.id}
            onPick={(id) => step({ kind: "person", id })}
            onReport={() =>
              setReport({
                kind: "actor_missing_from_movie",
                movieId: current.id,
                subject: graph.moviesById[current.id]!.title,
              })
            }
          />
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/85 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <button
            onClick={undo}
            disabled={path.length < 2}
            className="border border-border px-5 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Restart
            </button>
            <button
              onClick={() => setConfirmQuit(true)}
              className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-destructive"
            >
              Give up
            </button>
          </div>
        </div>
      </div>

      {confirmQuit && (
        <QuitDialog
          onCancel={() => setConfirmQuit(false)}
          onGiveUp={() => {
            setConfirmQuit(false);
            setPhase("gaveup");
          }}
        />
      )}
      {dialog}
    </div>
  );
}

export function QuitDialog({
  onCancel,
  onGiveUp,
  homeTo = "/",
}: {
  onCancel: () => void;
  onGiveUp: () => void;
  homeTo?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="anim-fade-up w-full max-w-sm border border-border/80 bg-card px-6 py-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold tracking-[0.04em] text-foreground">
          Give up on this one?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          You'll see a shortest route between the two actors.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={onGiveUp}
            className="border border-destructive/70 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-destructive transition-colors hover:bg-destructive/10"
          >
            Give up
          </button>
          <button
            onClick={onCancel}
            className="border border-border px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Keep playing
          </button>
          <Link
            to={homeTo}
            className="pt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActorPlaque({
  label,
  person,
  accent,
}: {
  label: string;
  person: Person;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex-1 border px-4 py-5 ${accent ? "border-link/60 bg-link/5" : "border-border/70 bg-card/40"}`}
    >
      <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 flex justify-center">
        <Portrait person={person} size="lg" accent={accent ?? false} showAttribution />
      </div>
      <p className="mt-3 font-display text-[15px] font-semibold leading-snug tracking-[0.03em] text-foreground">
        {person.name}
      </p>
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
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

export function Meter({ label, value }: { label: string; value: string }) {
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
