import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hollywood-hero-wide.jpg";
import { GAMES } from "@/config/games";
import { SITE } from "@/config/site";
import { RecentActivity, StreakStrip } from "@/components/StreakStrip";
import { TodaysChallenges } from "@/components/TodaysChallenges";
import { loadBest, loadCount, loadCurrentCareer } from "@/games/hollywood/storage";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nircosi — Free Movie Games" },
      {
        name: "description",
        content:
          "Free movie games you can play in a minute: three daily film puzzles, a Hollywood career simulator, and endless Connect and Higher or Lower rounds.",
      },
      { property: "og:title", content: "Nircosi — Free Movie Games" },
      {
        property: "og:description",
        content:
          "Three daily film puzzles plus a Hollywood career simulator. Free movie games for people who love cinema.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nircosi.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://nircosi.com/" }],
  }),
  component: Index,
});

function Index() {
  const [best, setBest] = useState<number | null>(null);
  const [lived, setLived] = useState(0);
  const [hasOngoing, setHasOngoing] = useState(false);

  useEffect(() => {
    const b = loadBest();
    setBest(b ? b.score : null);
    setLived(loadCount());
    setHasOngoing(loadCurrentCareer() !== null);
  }, []);

  const flagship = GAMES.find((g) => g.flagship && g.status === "playable");
  const playable = GAMES.filter((g) => g.status === "playable" && !g.flagship && g.id !== "daily");
  const upcoming = GAMES.filter((g) => g.status === "soon");

  return (
    <div className="anim-fade-up mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
      <h1 className="sr-only">{SITE.name} — free movie games</h1>

      {/* Hollywood editorial hero — the acquisition surface. */}
      {flagship?.to && (
        <section aria-labelledby="hollywood-hero">
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="grid sm:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="order-2 p-5 sm:order-none sm:p-8">
                <span className="text-[10px] font-medium uppercase tracking-[0.34em] text-muted-foreground">
                  Hollywood · Career simulator
                </span>
                <h2
                  id="hollywood-hero"
                  className="mt-3 font-display text-[clamp(1.7rem,6.2vw,2.9rem)] font-semibold uppercase leading-[1.02] tracking-[0.01em] text-foreground"
                >
                  Build your legacy.
                  <br />
                  <span className="text-muted-foreground">Or watch it crumble.</span>
                </h2>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                  Start with nothing. Make movies. Build your reputation. Chase awards. Survive
                  Hollywood.
                </p>

                <Link
                  to={flagship.to}
                  className="group mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
                >
                  Start your career
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>

                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <li className="tabular-nums">$186M box office</li>
                  <li className="text-gold">Best director</li>
                  <li>Studio wars</li>
                </ul>

                {(best !== null || hasOngoing) && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {hasOngoing ? "A career is already in progress" : null}
                    {hasOngoing && best !== null ? " · " : null}
                    {best !== null
                      ? `Personal best ${best.toLocaleString("en-US")}${lived > 1 ? ` · ${lived} careers` : ""}`
                      : null}
                  </p>
                )}
              </div>

              <div className="relative order-1 h-40 sm:order-none sm:h-auto sm:min-h-[19rem]">
                <img
                  src={heroImage}
                  alt="An empty director's chair, film reels and a clapperboard on a sunlit backlot"
                  width={1600}
                  height={1008}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent sm:bg-gradient-to-r sm:via-card/15" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Retention layer — the three dailies. */}
      <div className="mt-6">
        <TodaysChallenges />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <StreakStrip />
        <RecentActivity />
      </div>


      <section aria-labelledby="all-dailies" className="mt-8">
        <h2
          id="all-dailies"
          className="text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground"
        >
          The daily set
        </h2>
        <Link
          to="/daily"
          className="group mt-3 flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3.5 transition-colors duration-200 hover:border-foreground/30"
        >
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
              All five dailies
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
              Connect, Top 10, Person, Timeline and Up &amp; Down — new every midnight UTC.
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </section>
    </div>
  );
}

