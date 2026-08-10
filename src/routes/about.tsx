import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${SITE.name}` },
      {
        name: "description",
        content: "What PATHS is: a collection of short, replayable cinema and pop-culture games where every decision changes the path.",
      },
      { property: "og:title", content: `About — ${SITE.name}` },
      {
        property: "og:description",
        content: "What PATHS is: a collection of short, replayable cinema and pop-culture games where every decision changes the path.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <StaticPage eyebrow={SITE.name} title="ABOUT">
      <p>
        {SITE.name} is a collection of short, highly replayable games about cinema and the
        culture around it. Each one drops you into a stream of decisions — a career, a
        comparison, a hunch — and lets probability do the rest.
      </p>
      <p>
        The flagship is <span className="text-foreground">HOLLYWOOD</span>: a full acting
        career compressed into minutes, from extra work to whatever comes after fame.
        Alongside it, <span className="text-foreground">HIGHER / LOWER</span> is the
        thirty-second game — box office, budgets, ratings, and a streak that always feels
        one guess away from greatness.
      </p>
      <p>
        There are no accounts, no installs and no waiting. Your paths live on your own
        device, and every run is meant to be different from the last.
      </p>
      <p className="text-[13px] text-muted-foreground/70">
        All people, studios, productions and events inside HOLLYWOOD are fictional. Any
        resemblance to real careers is the point of the genre, not a reference.
      </p>
    </StaticPage>
  );
}
