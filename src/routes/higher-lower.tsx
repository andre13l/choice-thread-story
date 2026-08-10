import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/config/site";
import { HigherLowerGame } from "@/games/higherlower/HigherLowerGame";

export const Route = createFileRoute("/higher-lower")({
  head: () => ({
    meta: [
      { title: `Higher / Lower — ${SITE.name}` },
      {
        name: "description",
        content:
          "Box office, budgets, ratings, runtimes and release years. Is the next film higher or lower? How long can your streak last?",
      },
      { property: "og:title", content: `Higher / Lower — ${SITE.name}` },
      {
        property: "og:description",
        content:
          "Box office, budgets, ratings, runtimes and release years. Is the next film higher or lower?",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HigherLowerPage,
});

function HigherLowerPage() {
  return <HigherLowerGame />;
}
