import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SITE } from "@/config/site";
import { Portrait } from "@/games/connect/components/Portrait";
import {
  DailyFooterLinks,
  DailyHeader,
  NextDailyNote,
  ResultSurface,
  ShareButton,
  Stat,
  accentButton,
  formatTime,
} from "@/games/core/components/DailyChrome";
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
import {
  PERSON_GAME_ID,
  type PersonClue,
  type PersonPrompt,
  type PersonReveal,
} from "@/games/person/types";
import {
  getDailyPerson,
  guessDailyPerson,
  revealDailyPerson,
  searchDailyPeople,
} from "@/lib/person.functions";
import { DailyRank } from "@/games/core/components/DailyRank";

export const Route = createFileRoute("/daily/person")({
  component: DailyPersonPage,
  head: () => ({
    meta: [
      { title: `Daily Person — deduce the actor | ${SITE.name}` },
      {
        name: "description",
        content:
          "One hidden screen actor a day, revealed one clue at a time — obscure credit first, face last. Guess early for a better score. New person at midnight UTC.",
      },
      { property: "og:title", content: `Daily Person | ${SITE.name}` },
      {
        property: "og:description",
        content: "Six clues, one hidden actor. Guess as early as you dare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Phase = "intro" | "playing" | "done";

interface Progress {
  revealed: number;
  wrong: string[];
  startedAt: number;
  elapsed: number;
  done: boolean;
  solved: boolean;
}

function DailyPersonPage() {
  const date = useMemo(() => todayUTC(), []);
  const fetchPerson = useServerFn(getDailyPerson);
  const submitGuess = useServerFn(guessDailyPerson);
  const revealAnswer = useServerFn(revealDailyPerson);
  const search = useServerFn(searchDailyPeople);

  const [prompt, setPrompt] = useState<PersonPrompt | null>(null);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [revealed, setRevealed] = useState(1);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [answer, setAnswer] = useState<PersonReveal | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [result, setResult] = useState<DailyResult | null>(null);
  const recorded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStats(loadDailyStats(PERSON_GAME_ID));
    const saved = loadProgress<Progress>(PERSON_GAME_ID, date);
    if (saved) {
      setRevealed(Math.max(1, saved.revealed ?? 1));
      setWrong(saved.wrong ?? []);
      setSolved(Boolean(saved.solved));
      setStartedAt(saved.startedAt ?? null);
      setElapsed(saved.elapsed ?? 0);
      setPhase(saved.done ? "done" : "playing");
    }
    const existing = resultFor(PERSON_GAME_ID, date);
    if (existing) {
      setResult(existing);
      recorded.current = true;
      setPhase("done");
    }
  }, [date]);

  useEffect(() => {
    void fetchPerson({ data: { date, revealed } })
      .then(setPrompt)
      .catch(() => setFailed(true));
  }, [fetchPerson, date, revealed]);

  // The answer card needs the full record — only fetched once the round is over.
  useEffect(() => {
    if (phase !== "done" || answer) return;
    void revealAnswer({ data: { date } })
      .then(setAnswer)
      .catch(() => undefined);
  }, [phase, answer, revealAnswer, date]);

  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => window.clearInterval(id);
  }, [phase, startedAt]);

  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(() => {
      void search({ data: { query: q } })
        .then((names) => {
          if (!cancelled) setSuggestions(names);
        })
        .catch(() => undefined);
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [input, search]);

  const persist = useCallback(
    (next: Partial<Progress>) => {
      saveProgress<Progress>(PERSON_GAME_ID, date, {
        revealed,
        wrong,
        startedAt: startedAt ?? Date.now(),
        elapsed,
        done: phase === "done",
        solved,
        ...next,
      });
    },
    [date, revealed, wrong, startedAt, elapsed, phase, solved],
  );

  const finish = useCallback(
    (didSolve: boolean, cluesUsed: number, guesses: number) => {
      const time = startedAt ? Date.now() - startedAt : elapsed;
      const finished: DailyResult = {
        date,
        number: prompt?.number ?? 0,
        clicks: 0,
        clues: cluesUsed,
        guesses,
        timeMs: time,
        gaveUp: !didSolve,
      };
      setResult(finished);
      setSolved(didSolve);
      setPhase("done");
      persist({ done: true, solved: didSolve, elapsed: time });
      if (!recorded.current) {
        recorded.current = true;
        setStats(recordDaily(PERSON_GAME_ID, finished));
      }
    },
    [date, prompt, startedAt, elapsed, persist],
  );

  const nextClue = useCallback(() => {
    if (!prompt) return;
    if (revealed >= prompt.totalClues) {
      finish(false, revealed, wrong.length);
      return;
    }
    const next = revealed + 1;
    setRevealed(next);
    persist({ revealed: next });
  }, [prompt, revealed, wrong.length, finish, persist]);

  const onGuess = useCallback(
    async (raw: string) => {
      const guess = raw.trim();
      if (!guess || !prompt || pending) return;
      setPending(true);
      try {
        const outcome = await submitGuess({ data: { date, guess } });
        setInput("");
        setSuggestions([]);
        if (outcome.correct) {
          finish(true, revealed, wrong.length + 1);
          return;
        }
        const nextWrong = wrong.includes(guess) ? wrong : [...wrong, guess];
        setWrong(nextWrong);
        if (revealed >= prompt.totalClues) {
          persist({ wrong: nextWrong });
          finish(false, revealed, nextWrong.length);
        } else {
          const next = revealed + 1;
          setRevealed(next);
          persist({ wrong: nextWrong, revealed: next });
        }
      } catch {
        setWrong((w) => [...w, "Could not reach the backend"]);
      } finally {
        setPending(false);
      }
    },
    [prompt, pending, submitGuess, date, revealed, wrong, finish, persist],
  );

  if (failed) {
    return (
      <div className="stage flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-2xl tracking-[0.1em] text-foreground">
          Today&apos;s person is unavailable
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

  if (phase === "done" && result) {
    const cluesUsed = result.clues ?? revealed;
    const shareText = [
      `${SITE.name.toUpperCase()} DAILY PERSON #${result.number}`,
      solved ? `🎭 solved on clue ${cluesUsed}/${prompt.totalClues}` : "❌ not today",
      `⏱ ${formatTime(result.timeMs)}`,
      ...(streak > 0 ? [`🔥 ${streak} day streak`] : []),
      "nircosi.com/daily/person",
    ].join("\n");

    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-8 sm:py-14">
        <ResultSurface className="text-center" label="Daily Person result">
          <DailyHeader label={`Daily Person #${result.number}`} date={date} accent="ink" />
          <h1 className="mt-8 font-display text-[clamp(2rem,7vw,3.2rem)] leading-none tracking-[0.06em] text-foreground">
            {solved ? `CLUE ${cluesUsed}` : "NOT TODAY"}
          </h1>

          {answer && (
            <div className="mt-8 flex flex-col items-center">
              <Portrait
                person={{ name: answer.name, image: answer.imageFile ?? "" }}
                size="lg"
                showAttribution
              />
              <p className="mt-4 font-display text-xl tracking-[0.08em] text-foreground">
                {answer.name}
              </p>
              {answer.credits.length > 0 && (
                <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
                  {answer.credits.map((c) => `${c.title} (${c.year})`).join(" · ")}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 grid grid-cols-3 border border-border/70">
            <Stat label="Clues used" value={`${cluesUsed}/${prompt.totalClues}`} accent />
            <Stat label="Time" value={formatTime(result.timeMs)} />
            <Stat label="Streak" value={String(streak)} />
          </div>

          <ShareButton text={shareText} accent="ink" className="mt-8 w-full sm:w-auto" />

          <DailyRank
            game="person"
            date={date}
            number={result.number}
            score={cluesUsed}
            timeMs={result.timeMs}
            meta={{ guesses: result.guesses ?? 0, total: prompt.totalClues }}
            eligible={solved}
          />
          <NextDailyNote />
          <DailyFooterLinks
            extra={
              <Link
                to="/daily"
                className="text-[11px] uppercase tracking-[0.2em] text-link transition-opacity hover:opacity-70"
              >
                Today&apos;s other dailies
              </Link>
            }
          />
        </ResultSurface>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-5 py-14 text-center">
        <DailyHeader label={`Daily Person #${prompt.number}`} date={date} accent="ink" />
        <h1 className="mt-6 font-display text-[clamp(2.2rem,9vw,4rem)] leading-none tracking-[0.08em] text-foreground">
          PERSON
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          One hidden screen actor. Clues arrive worst-first: an obscure credit long before the
          face. Every wrong guess opens the next clue.
        </p>
        <button
          onClick={() => {
            const now = Date.now();
            setStartedAt(now);
            setPhase("playing");
            persist({ startedAt: now });
            window.setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className={`mt-12 border px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] transition-colors duration-300 ${accentButton("ink")}`}
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
      <div className="w-full max-w-xl">
        <div className="text-center">
          <DailyHeader label={`Daily Person #${prompt.number}`} date={date} accent="ink" />
        </div>

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>
            Clue {revealed}/{prompt.totalClues}
          </span>
          <span>{formatTime(elapsed)}</span>
        </div>

        <ol className="mt-3 border border-border/70">
          {prompt.clues.map((clue) => (
            <ClueRow key={clue.index} clue={clue} />
          ))}
        </ol>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onGuess(input);
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Name the person…"
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            className="min-w-0 flex-1 border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground"
          />
          <button
            type="submit"
            disabled={pending}
            className={`shrink-0 border px-6 text-[11px] font-medium uppercase tracking-[0.24em] transition-colors disabled:opacity-50 ${accentButton("ink")}`}
          >
            Guess
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => void onGuess(name)}
                className="border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {wrong.length > 0 && (
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground/80">
            <span className="uppercase tracking-[0.22em] text-muted-foreground">Missed:</span>{" "}
            {wrong.join(" · ")}
          </p>
        )}

        <div className="mt-10 flex justify-center gap-6">
          <button
            onClick={nextClue}
            className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {revealed >= prompt.totalClues ? "Reveal the answer" : "Skip to next clue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClueRow({ clue }: { clue: PersonClue }) {
  return (
    <li className="anim-fade-up flex items-start gap-4 border-b border-border/50 px-4 py-4 last:border-b-0">
      <span className="w-6 shrink-0 font-display text-xs tracking-[0.1em] text-muted-foreground">
        {String(clue.index).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">{clue.label}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{clue.text}</p>
        {clue.imageFile && (
          <div className="mt-3">
            <Portrait person={{ name: "?", image: clue.imageFile }} size="lg" showAttribution />
          </div>
        )}
      </div>
    </li>
  );
}
