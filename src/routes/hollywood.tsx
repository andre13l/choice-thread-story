import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/config/site";
import { useHollywoodGame } from "@/games/hollywood/useHollywoodGame";
import { CharacterIntro } from "@/games/hollywood/screens/CharacterIntro";
import { EndingScreen } from "@/games/hollywood/screens/EndingScreen";
import { EventScreen } from "@/games/hollywood/screens/EventScreen";
import { Intro } from "@/games/hollywood/screens/Intro";
import { LegendSequence } from "@/games/hollywood/screens/LegendSequence";
import { RevealScreen } from "@/games/hollywood/screens/RevealScreen";

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

  return (
    <main className="min-h-screen">
      {state.phase === "intro" && <Intro onBegin={() => dispatch({ type: "begin" })} />}
      {state.phase === "character" && state.game && (
        <CharacterIntro game={state.game} onContinue={() => dispatch({ type: "character_ok" })} />
      )}
      {state.phase === "event" && state.game && state.event && (
        <EventScreen
          key={state.game.turn}
          game={state.game}
          event={state.event}
          onChoose={(index) => dispatch({ type: "choose", index })}
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
