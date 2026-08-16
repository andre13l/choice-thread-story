import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ChevronRight, Lock, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hollywood-hero.jpg";
import { GAMES } from "@/config/games";
import { SITE } from "@/config/site";
import { RecentActivity, StreakStrip } from "@/components/StreakStrip";
import { TodaysChallenges } from "@/components/TodaysChallenges";
import { loadBest, loadCount, loadCurrentCareer } from "@/games/hollywood/storage";

/** Per-game tile identity so the non-daily games never read alike. */
const TILE_META: Record<string, { label: string; icon: ReactNode }> = {
  "higher-lower": {
    label: "30-second arcade",
    icon: (
      <>
        <ArrowUp className="h-4 w-4" />
        <ArrowDown className="-ml-1.5 h-4 w-4" />
      </>
    ),
  },
  connect: {
    label: "Path puzzle",
    icon: <Share2 className="h-4 w-4" />,
  },
};

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
    <div className="anim-fade-up mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="sr-only">{SITE.name} — free daily movie games</h1>

      <TodaysChallenges />

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <StreakStrip />
        <RecentActivity />
      </div>

      {/* Hollywood editorial hero */}
      {flagship?.to && (
        <section aria-labelledby="hollywood-hero" className="mt-8">
          <Link
            to={flagship.to}
            className="group grid overflow-hidden rounded-md border border-border bg-card sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]"
          >
            <div className="p-5 sm:p-7">
              <span className="text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
                Hollywood
              </span>
              <h2
                id="hollywood-hero"
                className="mt-3 font-display text-[clamp(1.35rem,4vw,2rem)] font-semibold leading-[1.15] tracking-[0.02em] text-foreground"
              >
                Build your legacy.
                <br />
                Or watch it crumble.
              </h2>
              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                Make movies, manage studios, chase awards and survive Hollywood.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[11px] font-medium text-background transition-opacity group-hover:opacity-85">
                Play {flagship.name}
              </span>
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
            <div className="relative order-first h-28 sm:order-none sm:h-auto sm:min-h-40">
              <img
                src={heroImage}
                alt=""
                loading="lazy"
                width={1600}
                height={912}
                className="h-full w-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent sm:bg-gradient-to-r sm:via-card/40" />
            </div>
          </Link>
        </section>
      )}

      {/* More games */}
      <section aria-labelledby="more-games" className="mt-8">
        <h2
          id="more-games"
          className="text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground"
        >
          More games
        </h2>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playable.map((game) => {
            const meta = TILE_META[game.id] ?? { label: "Play", icon: null };
            return (
              <Link
                key={game.id}
                to={game.to!}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-card px-4 py-3.5 transition-colors duration-200 hover:border-foreground/30"
              >
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent text-muted-foreground"
                >
                  {meta.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
                    {game.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                    {game.tagline}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            );
          })}

          {upcoming.map((game) => (
            <div
              key={game.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-dashed border-border px-4 py-3.5"
            >
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground/70"
              >
                <Lock className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {game.name}
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted-foreground/80">
                  {game.tagline}
                </span>
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                Soon
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

