import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SITE } from "@/config/site";
import {
  DailyFooterLinks,
  DailyHeader,
  NextDailyNote,
  ShareButton,
  Stat,
  accentButton,
  formatTime,
} from "@/games/core/components/DailyChrome";
import { AutocompleteInput, type Suggestion } from "@/games/core/components/AutocompleteInput";
import { loadProgress, saveProgress } from "@/games/core/dailyProgress";
import {
  currentStreak,
  loadDailyStats,
  recordDaily,
  resultFor,
  todayUTC,
  type DailyResult,
  type DailyStats,
} from "@/games/core/dailyStats";
import { TOP10_GAME_ID, type Top10Hit, type Top10Prompt } from "@/games/top10/types";
import { getTop10Today, guessTop10, revealTop10, searchTop10 } from "@/lib/top10.functions";

export const Route = createFileRoute("/daily/top-10")({
  component: DailyTop10Page,
  head: () => ({
    meta: [
      { title: `Daily Top 10 — name the whole list | ${SITE.name}` },
      {
        name: "description",
        content:
          "One ranked film list a day, ten blanks, no multiple choice. Name every entry before you run out of patience. New list at midnight UTC.",
      },
      { property: "og:title", content: `Daily Top 10 | ${SITE.name}` },
      {
        property: "og:description",
        content: "Ten blanks, one ranked list, once a day. Name them all.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Phase = "intro" | "playing" | "done";

interface Progress {
  found: Top10Hit[];
  wrong: string[];
  startedAt: number;
  done: boolean;
  gaveUp: boolean;
  revealed: string[];
  elapsed: number;
}

function DailyTop10Page() {
  const date = useMemo(() => todayUTC(), []);
  const fetchToday = useServerFn(getTop10Today);
  const submitGuess = useServerFn(guessTop10);
  const reveal = useServerFn(revealTop10);
  const runSearch = useServerFn(searchTop10);

  const [prompt, setPrompt] = useState<Top10Prompt | null>(null);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [found, setFound] = useState<Top10Hit[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [revealedAll, setRevealedAll] = useState<string[]>([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState<{ position: number; kind: "hit" | "dupe" } | null>(null);
  const [pending, setPending] = useState(false);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [result, setResult] = useState<DailyResult | null>(null);
  const recorded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchToday({ data: { date } })
      .then(setPrompt)
      .catch(() => setFailed(true));
  }, [fetchToday, date]);

  // Resume: a finished day stays finished, a half-played board stays half-played.
  useEffect(() => {
    setStats(loadDailyStats(TOP10_GAME_ID));
    const existing = resultFor(TOP10_GAME_ID, date);
    const saved = loadProgress<Progress>(TOP10_GAME_ID, date);
    if (saved) {
      setFound(saved.found ?? []);
      setWrong(saved.wrong ?? []);
      setRevealedAll(saved.revealed ?? []);
      setGaveUp(Boolean(saved.gaveUp));
      setStartedAt(saved.startedAt ?? null);
      setElapsed(saved.elapsed ?? 0);
      setPhase(saved.done ? "done" : "playing");
    }
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

  const persist = useCallback(
    (next: Partial<Progress>) => {
      saveProgress<Progress>(TOP10_GAME_ID, date, {
        found,
        wrong,
        revealed: revealedAll,
        startedAt: startedAt ?? Date.now(),
        elapsed,
        done: phase === "done",
        gaveUp,
        ...next,
      });
    },
    [date, found, wrong, revealedAll, startedAt, elapsed, phase, gaveUp],
  );

  const finish = useCallback(
    (score: number, quit: boolean, time: number, answers: string[]) => {
      const finished: DailyResult = {
        date,
        number: prompt?.number ?? 0,
        clicks: 0,
        score,
        total: prompt?.total ?? 10,
        timeMs: time,
        gaveUp: quit,
      };
      setResult(finished);
      setPhase("done");
      setGaveUp(quit);
      setRevealedAll(answers);
      persist({ done: true, gaveUp: quit, revealed: answers, elapsed: time });
      if (!recorded.current) {
        recorded.current = true;
        setStats(recordDaily(TOP10_GAME_ID, finished));
      }
    },
    [date, prompt, persist],
  );

  const onGuess = useCallback(
    async (raw: string) => {
      const guess = raw.trim();
      if (!guess || !prompt || pending) return;
      setPending(true);
      try {
        const outcome = await submitGuess({
          data: { date, guess, found: found.map((f) => f.position) },
        });
        if (!outcome.hit) {
          setWrong((w) => (w.includes(guess) ? w : [guess, ...w].slice(0, 12)));
          setFlash(null);
        } else if (outcome.duplicate) {
          setFlash({ position: outcome.hit.position, kind: "dupe" });
        } else {
          const next = [...found, outcome.hit];
          setFound(next);
          setFlash({ position: outcome.hit.position, kind: "hit" });
          persist({ found: next });
          if (next.length === prompt.total) {
            const time = startedAt ? Date.now() - startedAt : elapsed;
            finish(
              next.length,
              false,
              time,
              [...next].sort((a, b) => a.position - b.position).map((f) => f.answer),
            );
          }
        }
        setInput("");
      } catch {
        setWrong((w) => ["Could not reach the backend — try again", ...w].slice(0, 12));
      } finally {
        setPending(false);
        // Keep the field hot so the next entry can be typed immediately.
        window.setTimeout(() => inputRef.current?.focus(), 0);
        window.setTimeout(() => setFlash(null), 900);
      }
    },
    [prompt, pending, submitGuess, date, found, persist, startedAt, elapsed, finish],
  );

  const onGiveUp = useCallback(async () => {
    if (!prompt) return;
    const time = startedAt ? Date.now() - startedAt : elapsed;
    try {
      const { answers } = await reveal({ data: { date } });
      finish(found.length, true, time, answers);
    } catch {
      finish(found.length, true, time, []);
    }
  }, [prompt, reveal, date, found.length, startedAt, elapsed, finish]);

  const answerType = prompt?.answerType ?? "film";
  const searchCatalog = useCallback(
    async (query: string): Promise<Suggestion[]> =>
      runSearch({ data: { kind: answerType, q: query } }),
    [runSearch, answerType],
  );

  if (failed) {
    return (
      <div className="stage flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-2xl tracking-[0.1em] text-foreground">
          Today&apos;s list is unavailable
        </h1>
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
          The backend didn&apos;t answer. Refresh in a moment.
        </p>
        <DailyFooterLinks />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="stage flex min-h-screen items-center justify-center px-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const streak = stats ? currentStreak(stats, date) : 0;
  const byPosition = new Map(found.map((f) => [f.position, f.answer]));
  const answers = revealedAll;

  if (phase === "done" && result) {
    const score = result.score ?? found.length;
    const shareText = [
      `${SITE.name.toUpperCase()} DAILY TOP 10 #${result.number}`,
      prompt.title,
      `🎬 ${score}/${result.total ?? 10}${result.gaveUp ? " (gave up)" : ""}`,
      `⏱ ${formatTime(result.timeMs)}`,
      ...(streak > 0 ? [`🔥 ${streak} day streak`] : []),
      "nircosi.com/daily/top-10",
    ].join("\n");

    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-8 sm:py-14">
        <ResultSurface className="text-center" label="Daily Top 10 result">
          <DailyHeader label={`Daily Top 10 #${result.number}`} date={date} accent="gold" />
          <h1 className="mt-8 font-display text-[clamp(2.2rem,8vw,3.6rem)] leading-none tracking-[0.06em] text-foreground">
            {score}/{result.total ?? 10}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">{prompt.title}</p>

          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat label="Named" value={`${score}`} accent />
            <Stat label="Time" value={formatTime(result.timeMs)} />
            <Stat label="Streak" value={String(streak)} />
          </div>

          <ShareButton text={shareText} accent="gold" className="mt-8 w-full sm:w-auto" />

          <ol className="mt-10 border border-border/70 text-left">
            {Array.from({ length: prompt.total }, (_, i) => {
              const position = i + 1;
              const mine = byPosition.get(position);
              const answer = mine ?? answers[i] ?? "—";
              return (
                <li
                  key={position}
                  className="flex items-baseline gap-4 border-b border-border/50 px-4 py-3 last:border-b-0"
                >
                  <span className="w-6 shrink-0 font-display text-xs tracking-[0.1em] text-muted-foreground">
                    {String(position).padStart(2, "0")}
                  </span>
                  <span
                    className={
                      mine ? "text-sm text-foreground" : "text-sm text-muted-foreground/70"
                    }
                  >
                    {answer}
                  </span>
                  {mine && (
                    <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-gold">
                      Named
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Source: {prompt.source}
          </p>

          <NextDailyNote />
          <DailyFooterLinks
            extra={
              <Link
                to="/connect/daily"
                className="text-[11px] uppercase tracking-[0.2em] text-link transition-opacity hover:opacity-70"
              >
                Play Daily Connect
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
        <DailyHeader label={`Daily Top 10 #${prompt.number}`} date={date} accent="gold" />
        <h1 className="mt-6 font-display text-[clamp(2.2rem,9vw,4rem)] leading-none tracking-[0.08em] text-foreground">
          TOP 10
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-foreground">{prompt.title}</p>
        {prompt.subtitle && (
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {prompt.subtitle}
          </p>
        )}
        <p className="mt-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Ten blanks. Type any entry — the position sorts itself out. Same list for everyone today.
        </p>
        <button
          onClick={() => {
            const now = Date.now();
            setStartedAt(now);
            setPhase("playing");
            persist({ startedAt: now });
            window.setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className={`mt-12 border px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] transition-colors duration-300 ${accentButton("gold")}`}
        >
          Play today
        </button>
        {streak > 0 && (
          <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            🔥 {streak} day streak
          </p>
        )}
        <DailyFooterLinks />
      </div>
    );
  }

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <DailyHeader label={`Daily Top 10 #${prompt.number}`} date={date} accent="gold" />
          <h1 className="mt-6 text-base leading-snug text-foreground sm:text-lg">{prompt.title}</h1>
          {prompt.subtitle && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{prompt.subtitle}</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>
            {found.length}/{prompt.total} named
          </span>
          <span>{formatTime(elapsed)}</span>
        </div>

        <form
          className="mt-3 flex items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onGuess(input);
          }}
        >
          <div className="min-w-0 flex-1">
            <AutocompleteInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSubmit={(v) => void onGuess(v)}
              search={searchCatalog}
              exclude={found.map((f) => f.answer)}
              disabled={pending}
              label="Name an entry"
              placeholder={prompt.answerType === "person" ? "Name a person…" : "Name a film…"}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`shrink-0 self-stretch border px-6 text-[11px] font-medium uppercase tracking-[0.24em] transition-colors disabled:opacity-50 ${accentButton("gold")}`}
          >
            Guess
          </button>
        </form>

        <ol className="mt-6 border border-border/70">
          {Array.from({ length: prompt.total }, (_, i) => {
            const position = i + 1;
            const answer = byPosition.get(position);
            const isFlashing = flash?.position === position;
            return (
              <li
                key={position}
                className={`flex items-center gap-4 border-b border-border/50 px-4 py-3 transition-colors duration-300 last:border-b-0 ${
                  isFlashing ? (flash?.kind === "hit" ? "bg-gold/10" : "bg-muted") : ""
                }`}
              >
                <span className="w-6 shrink-0 font-display text-xs tracking-[0.1em] text-muted-foreground">
                  {String(position).padStart(2, "0")}
                </span>
                {answer ? (
                  <span className="anim-fade-up text-sm text-foreground">{answer}</span>
                ) : (
                  <span className="h-px flex-1 bg-border" />
                )}
              </li>
            );
          })}
        </ol>

        {wrong.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Not on the list
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
              {wrong.join(" · ")}
            </p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => void onGiveUp()}
            className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-danger"
          >
            Give up and see the list
          </button>
        </div>
      </div>
    </div>
  );
}
