import { createFileRoute } from "@tanstack/react-router";
import { CONNECT } from "@/config/connect";
import { SITE } from "@/config/site";
import { ConnectGame } from "@/games/connect/ConnectGame";

const title = `${CONNECT.name} — ${CONNECT.kicker} | ${SITE.name}`;
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
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  return <ConnectGame />;
}
