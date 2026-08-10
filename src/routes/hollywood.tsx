import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SITE } from "@/config/site";
import { useHollywoodGame } from "@/games/hollywood/useHollywoodGame";
import { CharacterIntro } from "@/games/hollywood/screens/CharacterIntro";
import { EndingScreen } from "@/games/hollywood/screens/EndingScreen";
import { EventScreen } from "@/games/hollywood/screens/EventScreen";
import { Intro } from "@/games/hollywood/screens/Intro";
import { LegendSequence } from "@/games/hollywood/screens/LegendSequence";
import { RevealScreen } from "@/games/hollywood/screens/RevealScreen";
import { SequenceScreen } from "@/games/hollywood/screens/SequenceScreen";

export const Route = createFileRoute("/hollywood")({
  head: () => ({
    meta: [
      { title: `HOLLYWOOD — ${SITE.name}` },
      {
        name: "description",
        content:
          "Everyone comes to Hollywood wanting to make it. A short, replayable career simulation where every choice changes your path. How far can you make it?",
      },
      { property: "og:title", content: `HOLLYWOOD — ${SITE.name}` },
      {
        property: "og:description",
        content: "Everyone comes here wanting to make it. Let's see what happens to you.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HollywoodPage,
});

function HollywoodPage() {
  const { state, dispatch } = useHollywoodGame();
  const event = state.event;

  return (
    <main className="min-h-screen">
      {state.phase === "intro" && <Intro onBegin={() => dispatch({ type: "begin" })} />}
      {state.phase === "character" && state.game && (
        <CharacterIntro game={state.game} onContinue={() => dispatch({ type: "character_ok" })} />
      )}
      {state.phase === "event" && state.game && event && !event.sequence && (
        <EventScreen
          key={state.game.turn}
          game={state.game}
          event={event}
          onChoose={(index) => dispatch({ type: "choose", index })}
        />
      )}
      {state.phase === "event" && state.game && event?.sequence && state.seq && (
        <SequenceScreen
          key={`${state.game.turn}-${state.seq.stepIndex}`}
          game={state.game}
          event={event}
          stepIndex={state.seq.stepIndex}
          ctx={state.seq.ctx}
          onPick={(item) => dispatch({ type: "seq_pick", item })}
          onAlloc={(values) => dispatch({ type: "seq_alloc", values })}
        />
      )}
      {state.phase === "reveal" && state.game && state.outcome && (
        <RevealScreen
          game={state.game}
          outcome={state.outcome}
          onContinue={() => dispatch({ type: "continue" })}
        />
      )}
      {state.phase === "ending" && state.summary && (
        <EndingScreen summary={state.summary} onRestart={() => dispatch({ type: "restart" })} />
      )}
      {state.phase === "legend" && state.summary && (
        <LegendSequence summary={state.summary} onRestart={() => dispatch({ type: "restart" })} />
      )}
    </main>
  );
}
