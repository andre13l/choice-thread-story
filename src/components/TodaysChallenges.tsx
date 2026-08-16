import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getDailyConnect, type DailyConnectPayload } from "@/lib/connect.functions";
import { getTop10Today } from "@/lib/top10.functions";
import { prettyDate } from "@/games/core/components/DailyChrome";
import { completedToday, type DailyGameId } from "@/games/core/globalStreak";
import { resultFor, todayUTC, type DailyResult } from "@/games/core/dailyStats";
import type { Top10Prompt } from "@/games/top10/types";

type Accent = "connect" | "top10" | "person";

const RULE: Record<Accent, string> = {
  connect: "bg-connect",
  top10: "bg-top10",
  person: "bg-person",
};

const LABEL: Record<Accent, string> = {
  connect: "text-connect",
  top10: "text-top10",
  person: "text-person",
};

/**
 * The three live dailies. Only real local state is shown: a finished puzzle
 * reports its actual result instead of another Play button.
 */
export function TodaysChallenges() {
  const fetchDaily = useServerFn(getDailyConnect);
  const fetchTop10 = useServerFn(getTop10Today);
  const [today] = useState(() => todayUTC());
  const [done, setDone] = useState<Record<DailyGameId, boolean>>({
    connect: false,
    top10: false,
    person: false,
  });
  const [results, setResults] = useState<Record<DailyGameId, DailyResult | null>>({
    connect: null,
    top10: null,
    person: null,
  });
  const [connect, setConnect] = useState<DailyConnectPayload | null>(null);
  const [top10, setTop10] = useState<Top10Prompt | null>(null);

  useEffect(() => {
    setDone(completedToday(today));
    setResults({
      connect: resultFor("connect", today),
      top10: resultFor("top10", today),
      person: resultFor("person", today),
    });
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    void fetchDaily({ data: { date: today } })
      .then((p) => !cancelled && setConnect(p))
      .catch(() => undefined);
    void fetchTop10({ data: { date: today } })
      .then((p) => !cancelled && setTop10(p))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [fetchDaily, fetchTop10, today]);

  const played = Object.values(done).filter(Boolean).length;

  return (
    <section aria-labelledby="todays-challenges" className="w-full">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
        <div className="min-w-0">
          <h2
            id="todays-challenges"
            className="font-display text-[13px] font-semibold uppercase tracking-[0.28em] text-foreground"
          >
            Today&apos;s challenges
          </h2>
          <p className="mt-2 text-[12px] text-muted-foreground">{prettyDate(today)}</p>
        </div>
        <span className="shrink-0 rounded-sm border border-border px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
          {played}/3
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChallengeCard
          to="/connect/daily"
          accent="connect"
          name={`Daily Connect${connect ? ` #${connect.number}` : ""}`}
          headline={
            connect?.start && connect.target
              ? `${connect.start.name} → ${connect.target.name}`
              : "Link two actors through their films."
          }
          blurb="Hop through movies and casts in as few clicks as you can."
          done={done.connect}
          resultText={
            results.connect
              ? results.connect.gaveUp
                ? "Gave up"
                : `${results.connect.clicks} connections`
              : null
          }
        />
        <ChallengeCard
          to="/daily/top-10"
          accent="top10"
          name={`Daily Top 10${top10 ? ` #${top10.number}` : ""}`}
          headline={top10?.title ?? "One ranked list. Ten blanks."}
          blurb="Name every entry. No multiple choice."
          done={done.top10}
          resultText={
            results.top10 ? `${results.top10.score ?? 0}/${results.top10.total ?? 10} named` : null
          }
        />
        <ChallengeCard
          to="/daily/person"
          accent="person"
          name="Daily Person"
          headline="Six clues, worst first."
          blurb="Deduce the hidden actor before the face appears."
          done={done.person}
          resultText={
            results.person
              ? results.person.gaveUp
                ? "Gave up"
                : `${results.person.clues ?? 0} clues used`
              : null
          }
        />
      </div>
    </section>
  );
}

function ChallengeCard({
  to,
  accent,
  name,
  headline,
  blurb,
  done,
  resultText,
}: {
  to: "/connect/daily" | "/daily/top-10" | "/daily/person";
  accent: Accent;
  name: string;
  headline: string;
  blurb: string;
  done: boolean;
  resultText: string | null;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-sm border border-border bg-card p-6 transition-colors duration-200 hover:border-foreground/35"
    >
      <span className={`h-0.5 w-8 ${RULE[accent]}`} aria-hidden />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <span
          className={`min-w-0 text-[10px] font-medium uppercase tracking-[0.24em] ${LABEL[accent]}`}
        >
          {name}
        </span>
        {done && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <Check className="h-3.5 w-3.5" aria-hidden />
            Done
          </span>
        )}
      </div>

      <p className="mt-3 text-[15px] leading-snug text-foreground">{headline}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{blurb}</p>

      <span className="mt-6 flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-[10px] font-medium uppercase tracking-[0.22em]">
        {done ? (
          <>
            <span className="text-foreground">{resultText ?? "Completed"}</span>
            <span className="text-muted-foreground transition-colors group-hover:text-foreground">
              Review
            </span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">Not played</span>
            <span className="text-foreground">Play →</span>
          </>
        )}
      </span>
    </Link>
  );
}
