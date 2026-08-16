import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SITE } from "@/config/site";
import {
  DAILY_GAME_ID,
  dailyChallenge,
  dailyNumber,
} from "@/games/connect/daily";
import { shortestPath, type Challenge, type GraphNode } from "@/games/connect/graph";
import { getDailyConnect, type DailyConnectPayload } from "@/lib/connect.functions";
import { useServerFn } from "@tanstack/react-start";
import { GraphError, GraphLoading, MoviePage, PersonPage } from "@/games/connect/components/Browse";
import { Portrait } from "@/games/connect/components/Portrait";
import { ReportDialog, type ReportContext } from "@/games/connect/components/ReportDialog";
import { useGraph } from "@/games/connect/useGraph";
import { PathTrail } from "@/games/connect/screens/PathTrail";
import { Meter, QuitDialog, Stat, formatTime } from "@/games/connect/ConnectGame";
import {
  currentStreak,
  loadDailyStats,
  recordDaily,
  resultFor,
  todayUTC,
  type DailyResult,
  type DailyStats,
} from "@/games/core/dailyStats";

export const Route = createFileRoute("/connect/daily")({
  component: DailyConnectPage,
  head: () => ({
    meta: [
      { title: `Daily Connect — one film puzzle a day | ${SITE.name}` },
      {
        name: "description",
        content:
          "One shared film-graph puzzle every day: link two actors through the movies they made. Same challenge for everyone, new pair at midnight UTC.",
      },
      { property: "og:title", content: `Daily Connect | ${SITE.name}` },
      {
        property: "og:description",
        content: "Link two actors through their films. One shared puzzle a day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Phase = "intro" | "playing" | "done";

function DailyConnectPage() {
  const { graph, error, retry } = useGraph();
  const date = useMemo(() => todayUTC(), []);
  const number = useMemo(() => dailyNumber(date), [date]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [path, setPath] = useState<GraphNode[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [report, setReport] = useState<ReportContext | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [copied, setCopied] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    setStats(loadDailyStats(DAILY_GAME_ID));
    const existing = resultFor(DAILY_GAME_ID, date);
    if (existing) {
      setResult(existing);
      recorded.current = true;
      setPhase("done");
    }
  }, [date]);

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => window.clearInterval(id);
  }, [phase, startedAt]);

  // The backend row is authoritative; the deterministic generator is the
  // fallback so a date is never without a challenge. Both derive the same pair.
  const fetchDaily = useServerFn(getDailyConnect);
  const [published, setPublished] = useState<DailyConnectPayload | null>(null);
  const [publishedLoaded, setPublishedLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchDaily({ data: { date } })
      .then((payload) => {
        if (cancelled) return;
        setPublished(payload);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setPublishedLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDaily, date]);

  const challenge: Challenge | null = useMemo(() => {
    if (!graph || !publishedLoaded) return null;
    if (published && graph.peopleById[published.startPersonId] && graph.peopleById[published.targetPersonId]) {
      return {
        startId: published.startPersonId,
        targetId: published.targetPersonId,
        best: published.optimalClicks,
      };
    }
    return dailyChallenge(graph, date);
  }, [graph, date, published, publishedLoaded]);

  useEffect(() => {
    if (challenge && path.length === 0) setPath([{ kind: "person", id: challenge.startId }]);
  }, [challenge, path.length]);

  const finish = useCallback(
    (finalPath: GraphNode[], gaveUp: boolean) => {
      const finished: DailyResult = {
        date,
        number,
        clicks: finalPath.length - 1,
        timeMs: startedAt ? Date.now() - startedAt : 0,
        gaveUp,
      };
      setResult(finished);
      setPhase("done");
      if (!recorded.current) {
        recorded.current = true;
        setStats(recordDaily(DAILY_GAME_ID, finished));
      }
    },
    [date, number, startedAt],
  );

  const step = useCallback(
    (node: GraphNode) => {
      if (!challenge) return;
      const next = [...path, node];
      setPath(next);
      if (node.kind === "person" && node.id === challenge.targetId) finish(next, false);
    },
    [challenge, path, finish],
  );

  const undo = useCallback(() => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p)), []);
  const jumpTo = useCallback((index: number) => setPath((p) => p.slice(0, index + 1)), []);

  const bestPath = useMemo(
    () => (phase === "done" && challenge && graph
      ? shortestPath(graph, challenge.startId, challenge.targetId)
      : null),
    [phase, challenge, graph],
  );

  if (error) return <GraphError message={error} onRetry={retry} />;
  if (!graph || !challenge) return <GraphLoading />;

  const start = graph.peopleById[challenge.startId]!;
  const target = graph.peopleById[challenge.targetId]!;
  const current = path[path.length - 1];
  const streak = stats ? currentStreak(stats, date) : 0;
  const prettyDate = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dialog = (
    <ReportDialog
      open={report !== null}
      context={report ?? { kind: "other" }}
      onClose={() => setReport(null)}
    />
  );

  const header = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-link">
        Daily Connect #{number}
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {prettyDate}
      </p>
    </>
  );

  if (phase === "done" && result) {
    const shareText = [
      `${SITE.name.toUpperCase()} DAILY CONNECT #${result.number}`,
      result.gaveUp ? "❌ gave up" : `🔗 ${result.clicks} connections`,
      `⏱ ${formatTime(result.timeMs)}`,
      ...(streak > 0 ? [`🔥 ${streak} day streak`] : []),
      "nircosi.com/connect/daily",
    ].join("\n");

    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-8 sm:py-14">
        <ResultSurface className="text-center" label="Daily Connect result">
          {header}
          <h1 className="mt-8 font-display text-[clamp(2.2rem,8vw,3.6rem)] leading-none tracking-[0.06em] text-foreground">
            {result.gaveUp ? "GAVE UP" : `${result.clicks} CLICK${result.clicks === 1 ? "" : "S"}`}
          </h1>
          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat label="Best possible" value={String(challenge.best)} accent />
            <Stat label="Time" value={formatTime(result.timeMs)} />
            <Stat label="Streak" value={String(streak)} />
          </div>
          {stats && (
            <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
              {stats.played} days played · best streak {stats.bestStreak}
            </p>
          )}

          {!result.gaveUp && path.length > 1 && (
            <div className="mt-10 text-left">
              <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                Your path
              </p>
              <div className="mt-3">
                <PathTrail graph={graph} path={path} />
              </div>
            </div>
          )}
          {bestPath && (
            <div className="mt-8 text-left">
              <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                One shortest route
              </p>
              <div className="mt-3 opacity-70">
                <PathTrail graph={graph} path={bestPath} />
              </div>
            </div>
          )}

          <button
            onClick={share}
            className="mt-12 border border-link bg-link px-10 py-3 text-[11px] font-medium uppercase tracking-[0.26em] text-link-foreground transition-colors hover:bg-transparent hover:text-link"
          >
            {copied ? "Copied" : "Share result"}
          </button>
          <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Next daily at midnight UTC
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-5">
            <Link
              to="/connect"
              className="text-[11px] uppercase tracking-[0.2em] text-link transition-opacity hover:opacity-70"
            >
              Play unlimited Connect
            </Link>
            <Link
              to="/"
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              All games
            </Link>
          </div>
        </div>
        {dialog}
      </div>
    );
  }

  if (phase === "intro" || !current) {
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
        {header}
        <div className="mt-7 h-px w-14 bg-link/70" />
        <h1 className="mt-6 font-display text-[clamp(2.4rem,10vw,4.5rem)] leading-none tracking-[0.1em] text-foreground">
          CONNECT
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          The same two actors for everyone today. Link them through the films they made.
        </p>

        <div className="mt-12 flex w-full max-w-lg items-stretch gap-3">
          <Endpoint label="Start" personId={challenge.startId} graph={graph} />
          <div className="flex items-center text-muted-foreground/50">→</div>
          <Endpoint label="Target" personId={challenge.targetId} graph={graph} accent />
        </div>

        <button
          onClick={() => {
            setStartedAt(Date.now());
            setPhase("playing");
          }}
          className="mt-12 border border-link bg-link px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-link-foreground transition-colors duration-300 hover:bg-transparent hover:text-link"
        >
          Play today
        </button>
        {streak > 0 && (
          <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            🔥 {streak} day streak
          </p>
        )}
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

  return (
    <div className="stage flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Portrait person={target} size="sm" accent />
              <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                  Daily #{number} · target
                </p>
                <p className="truncate font-display text-base font-semibold tracking-[0.05em] text-link">
                  {target.name}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <Meter label="Clicks" value={String(path.length - 1)} />
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
          <p className="hidden text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60 sm:block">
            From {start.name}
          </p>
          <button
            onClick={() => setConfirmQuit(true)}
            className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-destructive"
          >
            Give up
          </button>
        </div>
      </div>

      {confirmQuit && (
        <QuitDialog
          onCancel={() => setConfirmQuit(false)}
          onGiveUp={() => {
            setConfirmQuit(false);
            finish(path, true);
          }}
        />
      )}
      {dialog}
    </div>
  );
}

function Endpoint({
  label,
  personId,
  graph,
  accent,
}: {
  label: string;
  personId: string;
  graph: NonNullable<ReturnType<typeof useGraph>["graph"]>;
  accent?: boolean;
}) {
  const person = graph.peopleById[personId]!;
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
