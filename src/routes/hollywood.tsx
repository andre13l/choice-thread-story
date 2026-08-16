import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TEST_MODE } from "@/games/hollywood/config";
import { PRESETS } from "@/games/hollywood/director/dev";
import { AwardsScreen } from "@/games/hollywood/director/screens/AwardsScreen";
import { BudgetScreen } from "@/games/hollywood/director/screens/BudgetScreen";
import { CareerEndScreen } from "@/games/hollywood/director/screens/CareerEndScreen";
import { CastingScreen } from "@/games/hollywood/director/screens/CastingScreen";
import { DirectorHeader } from "@/games/hollywood/director/screens/DirectorHeader";
import { DirectorIntro } from "@/games/hollywood/director/screens/DirectorIntro";
import { EventScreen } from "@/games/hollywood/director/screens/EventScreen";
import { DirectorLegend } from "@/games/hollywood/director/screens/DirectorLegend";
import { FilmographySheet } from "@/games/hollywood/director/screens/FilmographySheet";
import { NoStarScreen } from "@/games/hollywood/director/screens/NoStarScreen";
import { OffersScreen } from "@/games/hollywood/director/screens/OffersScreen";
import { PremiereScreen } from "@/games/hollywood/director/screens/PremiereScreen";
import { TimeJumpScreen } from "@/games/hollywood/director/screens/TimeJumpScreen";
import { useDirectorGame } from "@/games/hollywood/director/useDirectorGame";

export const Route = createFileRoute("/hollywood")({
  head: () => ({
    meta: [
      { title: "Hollywood Director Game — Build a Movie Career | Nircosi" },
      {
        name: "description",
        content:
          "Direct your way through Hollywood. Choose the project, cast it, spend the budget, then watch the premiere fill — or empty. A short, endlessly replayable career simulation.",
      },
      { property: "og:title", content: "Hollywood Director Game — Build a Movie Career | Nircosi" },
      {
        property: "og:description",
        content: "Pick the film. Cast it. Spend the money. Then watch the room fill.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://nircosi.com/hollywood" },
    ],
    links: [{ rel: "canonical", href: "https://nircosi.com/hollywood" }],
  }),
  component: HollywoodPage,
});

function HollywoodPage() {
  const { state, dispatch } = useDirectorGame();
  const [filmographyOpen, setFilmographyOpen] = useState(false);
  const [noStarSeen, setNoStarSeen] = useState(false);

  useEffect(() => {
    if (state.phase !== "ending") setNoStarSeen(false);
  }, [state.phase]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [state.phase, state.career.cycle]);

  const inRun = state.phase !== "intro" && state.phase !== "ending" && state.phase !== "legend";

  return (
    <main className="stage flex min-h-screen flex-col">
      {state.phase === "intro" && <DirectorIntro onBegin={() => dispatch({ type: "begin" })} resumed={state.resumed} />}

      {inRun && <DirectorHeader career={state.career} onOpenFilmography={() => setFilmographyOpen(true)} />}

      {state.phase === "transition" && state.jump && (
        <TimeJumpScreen jump={state.jump} onDone={() => dispatch({ type: "transition_done" })} />
      )}

      {state.phase === "event" && state.event && (
        <EventScreen
          key={state.event.id}
          event={state.event}
          outcome={state.eventOutcome}
          onChoose={(choice) => dispatch({ type: "choose_event", choice })}
          onDone={() => dispatch({ type: "event_done" })}
        />
      )}

      {state.phase === "offers" && (
        <OffersScreen
          career={state.career}
          offers={state.offers}
          onSelect={(project) => dispatch({ type: "select_project", project })}
          onPass={() => dispatch({ type: "pass" })}
        />
      )}

      {state.phase === "casting" && state.project && (
        <CastingScreen
          project={state.project}
          pool={state.pool}
          onConfirm={(cast) => dispatch({ type: "confirm_cast", cast })}
          onBack={() => dispatch({ type: "back_to_offers" })}
        />
      )}

      {state.phase === "budget" && state.project && (
        <BudgetScreen
          project={state.project}
          cast={state.cast}
          onConfirm={(alloc) => dispatch({ type: "confirm_budget", alloc })}
          onBack={() => dispatch({ type: "select_project", project: state.project! })}
        />
      )}

      {state.phase === "premiere" && state.pending && (
        <PremiereScreen
          key={state.pending.film.id}
          film={state.pending.film}
          effects={state.pending.effects}
          onDone={() => dispatch({ type: "premiere_done" })}
        />
      )}

      {state.phase === "awards" && state.pending?.awards && (
        <AwardsScreen awards={state.pending.awards} onDone={() => dispatch({ type: "awards_done" })} />
      )}

      {state.phase === "ending" && state.snapshot && !noStarSeen && <NoStarScreen onDone={() => setNoStarSeen(true)} />}
      {state.phase === "ending" && state.snapshot && noStarSeen && (
        <CareerEndScreen snapshot={state.snapshot} onRestart={() => dispatch({ type: "restart" })} />
      )}

      {state.phase === "legend" && state.snapshot && (
        <DirectorLegend snapshot={state.snapshot} onRestart={() => dispatch({ type: "restart" })} />
      )}

      {filmographyOpen && <FilmographySheet films={state.career.films} onClose={() => setFilmographyOpen(false)} />}

      {/* TEST_MODE-only inspection controls: jump straight to a career tier,
          or force an ending. Never rendered in production. */}
      {TEST_MODE && inRun && (
        <div className="fixed bottom-3 left-3 z-40 flex max-w-[45vw] flex-wrap items-start gap-1">
          <p className="w-full px-1 text-[8px] font-medium uppercase tracking-[0.24em] text-muted-foreground/40">dev</p>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => dispatch({ type: "dev_preset", preset: p.id })}
              className="border border-border/40 bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50 backdrop-blur-sm transition-colors hover:text-muted-foreground"
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: "dev_end" })}
            className="border border-border/40 bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50 backdrop-blur-sm transition-colors hover:text-muted-foreground"
          >
            end career
          </button>
          <button
            onClick={() => dispatch({ type: "dev_legend" })}
            className="border border-border/40 bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50 backdrop-blur-sm transition-colors hover:text-muted-foreground"
          >
            legend
          </button>
        </div>
      )}
    </main>
  );
}
