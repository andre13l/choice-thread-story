import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ChevronRight, Clapperboard, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { GAMES } from "@/config/games";
import { SITE } from "@/config/site";
import { loadBest, loadCount, loadCurrentCareer } from "@/games/hollywood/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "description", content: SITE.description },
      { property: "og:title", content: `${SITE.name} — ${SITE.tagline}` },
      { property: "og:description", content: SITE.description },
      { property: "og:type", content: "website" },
    ],
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
  const playable = GAMES.filter((g) => g.status === "playable" && !g.flagship);
  const upcoming = GAMES.filter((g) => g.status === "soon");

  return (
    <div className="stage flex flex-1 flex-col items-center justify-center px-6 py-14 sm:py-20">
      <div className="anim-fade-up flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="font-display text-[clamp(3.6rem,14vw,7.5rem)] font-bold leading-none tracking-[0.1em] text-foreground">
          {SITE.name}
        </h1>
        <p className="mt-5 text-sm tracking-wide text-muted-foreground">{SITE.tagline}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground/60">
          A collection of cinema games
        </p>

        <div className="mt-16 w-full">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Choose a game
          </p>

          {/* Flagship */}
          {flagship?.to && (
            <Link
              to={flagship.to}
              className="group mt-6 block border border-border bg-card/60 px-8 py-8 text-left backdrop-blur-sm transition-all duration-300 hover:border-gold/50 hover:shadow-[0_18px_50px_-20px] hover:shadow-gold/20"
            >
              <div className="flex items-baseline justify-between">
                <span aria-hidden>
                  <Clapperboard className="h-6 w-6 text-gold" />
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground transition-colors group-hover:text-foreground">
                  Start
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <h2 className="mt-5 font-display text-4xl font-semibold tracking-[0.06em] text-foreground">
                {flagship.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{flagship.tagline}</p>
              {best !== null && (
                <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Personal best — {best.toLocaleString("en-US")}
                  {lived > 1 ? ` · ${lived} paths lived` : ""}
                </p>
              )}
              {hasOngoing && (
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  A path is already in progress
                </p>
              )}
            </Link>
          )}

          {/* Fast games */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {playable.map((game) => (
              <Link
                key={game.id}
                to={game.to!}
                className="group flex flex-col justify-between border border-border/80 bg-card/40 px-6 py-5 text-left backdrop-blur-sm transition-all duration-300 hover:border-foreground/40 hover:bg-card/60"
              >
                <div className="flex items-center justify-between">
                  <span aria-hidden className="flex items-center gap-0.5 text-foreground/70">
                    <ArrowUp className="h-4 w-4" />
                    <ArrowDown className="h-4 w-4 -ml-1.5" />
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-foreground">
                    30-second game
                  </span>
                </div>
                <div className="mt-4">
                  <span className="font-display text-2xl font-semibold tracking-[0.05em] text-foreground">
                    {game.name}
                  </span>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">{game.tagline}</p>
                </div>
              </Link>
            ))}

            {upcoming.map((game) => (
              <div
                key={game.id}
                className="flex flex-col justify-between border border-border/70 bg-card/30 px-6 py-5 opacity-45"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-semibold tracking-[0.06em] text-muted-foreground">
                    {game.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Soon
                  </span>
                </div>
                <p className="mt-3 text-left text-[11px] leading-relaxed text-muted-foreground">
                  {game.tagline}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
