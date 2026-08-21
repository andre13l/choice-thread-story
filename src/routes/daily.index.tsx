import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { dailyNumber } from "@/games/core/daily";
import { prettyDate } from "@/games/core/components/DailyChrome";
import { completedToday, globalStreak, type DailyGameId } from "@/games/core/globalStreak";
import { todayUTC } from "@/games/core/dailyStats";

export const Route = createFileRoute("/daily/")({
  component: DailyHubPage,
  head: () => ({
    meta: [
      { title: `Today's dailies — five film puzzles a day | ${SITE.name}` },
      {
        name: "description",
        content:
          "Five short film puzzles, refreshed every midnight UTC: link two actors, name a ranked top ten, deduce a hidden actor, sort six films by year, and call the box office.",
      },
      { property: "og:title", content: `Today's dailies | ${SITE.name}` },
      {
        property: "og:description",
        content: "Connect, Top 10, Person, Timeline and Up & Down — five film puzzles, one a day each.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

interface DailyCard {
  id: DailyGameId;
  name: string;
  tagline: string;
  to:
    | "/connect/daily"
    | "/daily/top-10"
    | "/daily/person"
    | "/daily/timeline"
    | "/daily/up-down";
  accent: string;
  border: string;
}

const CARDS: DailyCard[] = [
  {
    id: "connect",
    name: "Daily Connect",
    tagline: "Link two actors through the films they made.",
    to: "/connect/daily",
    accent: "text-link",
    border: "hover:border-link/70",
  },
  {
    id: "top10",
    name: "Daily Top 10",
    tagline: "One ranked list. Ten blanks. No multiple choice.",
    to: "/daily/top-10",
    accent: "text-gold",
    border: "hover:border-gold/70",
  },
  {
    id: "person",
    name: "Daily Person",
    tagline: "Six clues, worst first. Guess as early as you dare.",
    to: "/daily/person",
    accent: "text-foreground",
    border: "hover:border-foreground/60",
  },
  {
    id: "timeline",
    name: "Daily Timeline",
    tagline: "Six films. Put them in release order, oldest to newest.",
    to: "/daily/timeline",
    accent: "text-foreground",
    border: "hover:border-foreground/60",
  },
  {
    id: "updown",
    name: "Daily Up & Down",
    tagline: "Box Office Rush — how far can you go? One mistake ends your run.",
    to: "/daily/up-down",
    accent: "text-gold",
    border: "hover:border-gold/70",
  },
];

function DailyHubPage() {
  const [today] = useState(() => todayUTC());
  const [done, setDone] = useState<Record<DailyGameId, boolean>>(() => ({
    connect: false,
    top10: false,
    person: false,
    timeline: false,
    updown: false,
  }));
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setDone(completedToday(today));
    setStreak(globalStreak(today));
  }, [today]);

  const number = dailyNumber(today);
  const finished = Object.values(done).filter(Boolean).length;

  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center px-5 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {SITE.name} #{number}
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.2rem,9vw,3.8rem)] leading-none tracking-[0.08em] text-foreground">
            TODAY
          </h1>
          <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {prettyDate(today)}
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            {finished}/{CARDS.length} played today
            {streak > 0 ? ` · 🔥 ${streak} day streak` : ""}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4">
          {CARDS.map((card) => (
            <Link
              key={card.id}
              to={card.to}
              className={`group block border border-border/70 px-6 py-6 transition-colors duration-300 ${card.border}`}
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`text-[10px] font-medium uppercase tracking-[0.26em] ${card.accent}`}
                >
                  {card.name} #{number}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-foreground">
                  {done[card.id] ? "Completed" : "Play"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.tagline}</p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          All five reset at midnight UTC · same puzzles for everyone
        </p>

        <div className="mt-8 text-center">
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
