import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Check, ListOrdered, Share2, TrendingUp, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getDailyConnect, type DailyConnectPayload } from "@/lib/connect.functions";
import { getTop10Today } from "@/lib/top10.functions";
import { prettyDate } from "@/games/core/components/DailyChrome";
import { completedToday, type DailyGameId } from "@/games/core/globalStreak";
import { resultFor, todayUTC, type DailyResult } from "@/games/core/dailyStats";
import type { Top10Prompt } from "@/games/top10/types";

type Accent = "connect" | "top10" | "person" | "timeline";

const TINT: Record<Accent, string> = {
  connect: "bg-connect/10 text-connect",
  top10: "bg-top10/10 text-top10",
  person: "bg-person/10 text-person",
  timeline: "bg-foreground/10 text-foreground",
};

const LABEL: Record<Accent, string> = {
  connect: "text-connect",
  top10: "text-top10",
  person: "text-person",
  timeline: "text-foreground",
};

const RULE: Record<Accent, string> = {
  connect: "bg-connect/60",
  top10: "bg-top10/60",
  person: "bg-person/60",
  timeline: "bg-foreground/60",
};

/**
 * The three live dailies as one compact module. Only real local state is
 * shown: a finished puzzle reports its actual result instead of a fake replay.
 */
export function TodaysChallenges() {
  const fetchDaily = useServerFn(getDailyConnect);
  const fetchTop10 = useServerFn(getTop10Today);
  const [today] = useState(() => todayUTC());
  const [done, setDone] = useState<Record<DailyGameId, boolean>>(() => ({
    connect: false,
    top10: false,
    person: false,
    timeline: false,
    updown: false,
  }));
  const [results, setResults] = useState<Record<DailyGameId, DailyResult | null>>(() => ({
    connect: null,
    top10: null,
    person: null,
    timeline: null,
    updown: null,
  }));
  const [connect, setConnect] = useState<DailyConnectPayload | null>(null);
  const [top10, setTop10] = useState<Top10Prompt | null>(null);

  useEffect(() => {
    setDone(completedToday(today));
    setResults({
      connect: resultFor("connect", today),
      top10: resultFor("top10", today),
      person: resultFor("person", today),
      timeline: resultFor("timeline", today),
      updown: resultFor("updown", today),
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
    <section
      aria-labelledby="todays-challenges"
      className="w-full overflow-hidden rounded-md border border-border bg-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
        <h2
          id="todays-challenges"
          className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-foreground"
        >
          Today at Nircosi
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="tracking-[0.08em]">{prettyDate(today)}</span>
          <span aria-hidden className="h-3 w-px bg-border" />
          <span className="tabular-nums">{played}/5 played</span>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x lg:grid-cols-5 sm:divide-y-0">
        <ChallengeCell
          to="/connect/daily"
          accent="connect"
          icon={<Share2 className="h-3.5 w-3.5" />}
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
        <ChallengeCell
          to="/daily/top-10"
          accent="top10"
          icon={<ListOrdered className="h-3.5 w-3.5" />}
          name={`Top 10${top10 ? ` #${top10.number}` : ""}`}
          headline={top10?.title ?? "One ranked list. Ten blanks."}
          done={done.top10}
          resultText={
            results.top10
              ? `Score: ${results.top10.score ?? 0}/${results.top10.total ?? 10}`
              : null
          }
        />
        <ChallengeCell
          to="/daily/person"
          accent="person"
          icon={<UserRound className="h-3.5 w-3.5" />}
          name="Person"
          headline="Six clues. One hidden actor."
          done={done.person}
          resultText={
            results.person
              ? results.person.gaveUp
                ? "Gave up"
                : `Solved in: ${results.person.clues ?? 0} clues`
              : null
          }
        />
        <ChallengeCell
          to="/daily/timeline"
          accent="timeline"
          icon={<CalendarClock className="h-3.5 w-3.5" />}
          name="Timeline"
          headline="Six films, oldest to newest."
          done={done.timeline}
          resultText={
            results.timeline
              ? `Score: ${results.timeline.score ?? 0}/${results.timeline.total ?? 6}`
              : null
          }
        />
        <ChallengeCell
          to="/daily/up-down"
          accent="top10"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          name="Up & Down"
          headline="More or less at the box office."
          done={done.updown}
          resultText={
            results.updown
              ? `Score: ${results.updown.score ?? 0}/${results.updown.total ?? 10}`
              : null
          }
        />
      </div>
    </section>
  );
}

function ChallengeCell({
  to,
  accent,
  icon,
  name,
  headline,
  done,
  resultText,
}: {
  to:
    | "/connect/daily"
    | "/daily/top-10"
    | "/daily/person"
    | "/daily/timeline"
    | "/daily/up-down";
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
      className="group relative flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-accent/50 sm:flex-col sm:items-stretch sm:gap-0"
    >
      <span aria-hidden className={`absolute inset-x-0 top-0 h-px ${RULE[accent]}`} />

      <span
        aria-hidden
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-sm ${TINT[accent]} sm:mb-2.5`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
            {name}
          </span>
          {done && <Check className="h-3.5 w-3.5 shrink-0 text-top10" aria-hidden />}
        </span>
        <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-foreground">
          {headline}
        </span>
        <span
          className={`mt-1 block truncate text-[11px] ${done ? LABEL[accent] : "text-muted-foreground"}`}
        >
          {done ? (resultText ?? "Completed") : "Not played yet"}
        </span>
      </span>

      <span className="shrink-0 self-center rounded-full bg-foreground px-3.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-background transition-opacity group-hover:opacity-85 sm:mt-3 sm:self-start">
        {done ? "Review" : "Play"}
      </span>
    </Link>
  );
}
