import { createFileRoute } from "@tanstack/react-router";
import { HigherLowerGame } from "@/games/higherlower/HigherLowerGame";

const title = "Movie Higher or Lower — Box Office Game | Nircosi";
const description =
  "Which film made more? Guess higher or lower on worldwide box office, production budget, runtime and release year across 1,500 films — and build a streak.";

export const Route = createFileRoute("/higher-lower")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nircosi.com/higher-lower" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://nircosi.com/higher-lower" }],
  }),
  component: HigherLowerPage,
});

function HigherLowerPage() {
  return <HigherLowerGame />;
}
