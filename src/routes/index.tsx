import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { loadBest, loadCount, loadCurrentCareer } from "@/game/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PATHS — Every choice changes your path" },
      {
        name: "description",
        content:
          "PATHS is a collection of short, highly replayable life and career simulations where every decision changes your path. How far can you make it?",
      },
      { property: "og:title", content: "PATHS — Every choice changes your path" },
      {
        property: "og:description",
        content:
          "Short, highly replayable life and career simulations. Every decision changes your path. How far can you make it?",
      },
    ],
  }),
  component: Index,
});

const COMING_SOON = ["MUSIC", "FOOTBALL", "BUSINESS", "RACING"];

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="anim-fade-up flex w-full max-w-xl flex-col items-center text-center">
        <h1 className="font-serif text-[clamp(4.5rem,16vw,9rem)] leading-none tracking-[0.08em] text-foreground">
          PATHS
        </h1>
        <p className="mt-5 text-sm tracking-wide text-muted-foreground">
          Every choice changes your path.
        </p>

        <div className="mt-20 w-full">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Choose a path
          </p>

          <Link
            to="/hollywood"
            className="group mt-6 block border border-border bg-card px-8 py-8 text-left transition-all duration-300 hover:border-foreground hover:shadow-[0_14px_40px_-18px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xl" aria-hidden>
                🎬
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground transition-colors group-hover:text-foreground">
                Start
              </span>
            </div>
            <h2 className="mt-5 font-serif text-4xl tracking-[0.06em] text-foreground">
              HOLLYWOOD
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">How far can you make it?</p>
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

          <div className="mt-4 grid grid-cols-2 gap-4">
            {COMING_SOON.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between border border-border/70 px-5 py-4 opacity-45"
              >
                <span className="font-serif text-lg tracking-[0.08em] text-muted-foreground">
                  {name}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-24 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
        Paths
      </footer>
    </main>
  );
}
