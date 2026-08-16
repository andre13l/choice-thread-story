import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ListOrdered, Share2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getDailyConnect, type DailyConnectPayload } from "@/lib/connect.functions";
import { getTop10Today } from "@/lib/top10.functions";
import { prettyDate } from "@/games/core/components/DailyChrome";
import { completedToday, type DailyGameId } from "@/games/core/globalStreak";
import { resultFor, todayUTC, type DailyResult } from "@/games/core/dailyStats";
import type { Top10Prompt } from "@/games/top10/types";

type Accent = "connect" | "top10" | "person";

const TINT: Record<Accent, string> = {
  connect: "bg-connect/10 text-connect",
  top10: "bg-top10/10 text-top10",
  person: "bg-person/10 text-person",
};

const LABEL: Record<Accent, string> = {
  connect: "text-connect",
  top10: "text-top10",
  person: "text-person",
};

/**
 * The three live dailies as a compact dashboard row. Only real local state is
 * shown: a finished puzzle reports its actual result instead of a fake replay.
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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h2
            id="todays-challenges"
            className="text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground"
          >
            Today&apos;s challenges
          </h2>
          <p className="mt-1 truncate font-display text-[clamp(1.25rem,5vw,1.75rem)] font-semibold uppercase tracking-[0.06em] text-foreground">
            {prettyDate(today)}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-[11px] font-medium tabular-nums text-muted-foreground">
          {played}/3 completed
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ChallengeCard
          to="/connect/daily"
          accent="connect"
          icon={<Share2 className="h-4 w-4" />}
          name={`Connect${connect ? ` #${connect.number}` : ""}`}
          headline={
            connect?.start && connect.target
              ? `${connect.start.name} → ${connect.target.name}`
              : "Link two actors through their films."
          }
          done={done.connect}
          resultText={
            results.connect
              ? results.connect.gaveUp
                ? "Gave up"
                : `Best: ${results.connect.clicks} connections`
              : null
          }
        />
        <ChallengeCard
          to="/daily/top-10"
          accent="top10"
          icon={<ListOrdered className="h-4 w-4" />}
          name={`Top 10${top10 ? ` #${top10.number}` : ""}`}
          headline={top10?.title ?? "One ranked list. Ten blanks."}
          done={done.top10}
          resultText={
            results.top10
              ? `Score: ${results.top10.score ?? 0}/${results.top10.total ?? 10}`
              : null
          }
        />
        <ChallengeCard
          to="/daily/person"
          accent="person"
          icon={<UserRound className="h-4 w-4" />}
          name="Person"
          headline="Can you guess the actor today?"
          done={done.person}
          resultText={
            results.person
              ? results.person.gaveUp
                ? "Gave up"
                : `Solved in: ${results.person.clues ?? 0} clues`
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
  icon,
  name,
  headline,
  done,
  resultText,
}: {
  to: "/connect/daily" | "/daily/top-10" | "/daily/person";
  accent: Accent;
  icon: ReactNode;
  name: string;
  headline: string;
  done: boolean;
  resultText: string | null;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-md border border-border bg-card p-4 transition-colors duration-200 hover:border-foreground/30"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${TINT[accent]}`}
        >
          {icon}
        </span>
        <span
          className={`min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground`}
        >
          {name}
        </span>
        {done && (
          <Check className="h-4 w-4 shrink-0 text-top10" aria-hidden />
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-[13px] leading-snug text-foreground">{headline}</p>

      <p className={`mt-2 text-[12px] ${done ? LABEL[accent] : "text-muted-foreground"}`}>
        {done ? (resultText ?? "Completed") : "Not played yet"}
      </p>

      <span className="mt-3 inline-flex w-fit items-center rounded-full bg-foreground px-4 py-1.5 text-[11px] font-medium text-background transition-opacity group-hover:opacity-85">
        {done ? "Review" : "Play"}
      </span>
    </Link>
  );
}
