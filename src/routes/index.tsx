import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Lock, Share2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hollywood-hero.jpg";
import { GAMES } from "@/config/games";
import { SITE } from "@/config/site";
import { StreakStrip } from "@/components/StreakStrip";
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
    <div className="anim-fade-up mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="sr-only">{SITE.name} — free daily movie games</h1>

      <TodaysChallenges />

      <div className="mt-8">
        <StreakStrip />
      </div>

      {/* Hollywood editorial hero */}
      {flagship?.to && (
        <section aria-labelledby="hollywood-hero" className="mt-16 sm:mt-24">
          <Link
            to={flagship.to}
            className="group block overflow-hidden rounded-sm border border-border bg-ink text-ink-foreground"
          >
            <div className="relative">
              <img
                src={heroImage}
                alt=""
                loading="lazy"
                width={1600}
                height={912}
                className="h-56 w-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-85 sm:h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-ink-foreground/70">
                  Flagship · Career simulator
                </span>
                <h2
                  id="hollywood-hero"
                  className="mt-4 font-display text-[clamp(2rem,6vw,3.4rem)] font-semibold leading-[1.05] tracking-[0.04em]"
                >
                  Build your legacy.
                  <br />
                  Or watch it crumble.
                </h2>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-foreground/75">
                  Direct film after film: pick the project, cast it, spend the money, then watch the
                  premiere fill — or empty.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 border border-ink-foreground/50 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] transition-colors group-hover:bg-ink-foreground group-hover:text-ink">
                  Play {flagship.name}
                  <span aria-hidden>→</span>
                </span>
                {(best !== null || hasOngoing) && (
                  <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ink-foreground/60">
                    {hasOngoing ? "A career is already in progress" : null}
                    {hasOngoing && best !== null ? " · " : null}
                    {best !== null
                      ? `Personal best ${best.toLocaleString("en-US")}${lived > 1 ? ` · ${lived} careers` : ""}`
                      : null}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* More games */}
      <section aria-labelledby="more-games" className="mt-16 sm:mt-24">
        <h2
          id="more-games"
          className="font-display text-[13px] font-semibold uppercase tracking-[0.28em] text-foreground"
        >
          More games
        </h2>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Play as many rounds as you like — no daily limit.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {playable.map((game) => {
            const meta = TILE_META[game.id] ?? { label: "Play", icon: null };
            return (
              <Link
                key={game.id}
                to={game.to!}
                className="group flex flex-col justify-between rounded-sm border border-border bg-card px-6 py-6 transition-colors duration-200 hover:border-foreground/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <span aria-hidden className="flex items-center gap-0.5 text-muted-foreground">
                    {meta.icon}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    {meta.label}
                  </span>
                </div>
                <div className="mt-6">
                  <span className="font-display text-xl font-semibold tracking-[0.05em] text-foreground">
                    {game.name}
                  </span>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {game.tagline}
                  </p>
                </div>
                <span className="mt-6 border-t border-border/70 pt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-foreground">
                  Play →
                </span>
              </Link>
            );
          })}

          {upcoming.map((game) => (
            <div
              key={game.id}
              className="flex flex-col justify-between rounded-sm border border-dashed border-border px-6 py-6"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-lg font-semibold tracking-[0.06em] text-muted-foreground">
                  {game.name}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                  <Lock className="h-3 w-3" />
                  Soon
                </span>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground/80">
                {game.tagline}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
