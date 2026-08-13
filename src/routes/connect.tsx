import { createFileRoute } from "@tanstack/react-router";
import { ConnectGame } from "@/games/connect/ConnectGame";

const title = "Connect Actors Through Movies — Movie Connection Game | Nircosi";
const description =
  "Two actors who never shared a film. Hop through movies and casts to link them in as few clicks as possible, then see the shortest route that existed.";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://nircosi.com/connect" },
    ],
    links: [{ rel: "canonical", href: "https://nircosi.com/connect" }],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  return <ConnectGame />;
}
