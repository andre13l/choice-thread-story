import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms — ${SITE.name}` },
      {
        name: "description",
        content: "The terms of use for NIRCOSI: entertainment only, fictional content, provided as-is.",
      },
      { property: "og:title", content: `Terms — ${SITE.name}` },
      {
        property: "og:description",
        content: "The terms of use for NIRCOSI: entertainment only, fictional content, provided as-is.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <StaticPage eyebrow={SITE.name} title="TERMS">
      <p>
        {SITE.name} is an entertainment product. By playing you agree to a few simple
        ground rules.
      </p>
      <p>
        <span className="text-foreground">Fictional content.</span> Every person, studio,
        production, brand and event inside HOLLYWOOD is invented. Figures shown in
        HIGHER / LOWER are approximate values drawn from public reporting and are meant
        for play, not reference.
      </p>
      <p>
        <span className="text-foreground">No stakes.</span> There is no wagering, no
        prizes and nothing of monetary value to win. Scores and streaks are for your own
        amusement.
      </p>
      <p>
        <span className="text-foreground">As-is.</span> The games are provided as-is and
        as-available. Because progress is stored locally on your device, we cannot
        recover lost saves, streaks or careers.
      </p>
      <p>
        These terms may evolve as the platform grows; the current version always lives on
        this page.
      </p>
    </StaticPage>
  );
}
