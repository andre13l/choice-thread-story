import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy — ${SITE.name}` },
      {
        name: "description",
        content: "How PATHS handles your data: your games live on your own device. No accounts, no trackers.",
      },
      { property: "og:title", content: `Privacy — ${SITE.name}` },
      {
        property: "og:description",
        content: "How PATHS handles your data: your games live on your own device. No accounts, no trackers.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <StaticPage eyebrow={SITE.name} title="PRIVACY">
      <p>
        {SITE.name} is local-first. Your careers, scores, streaks and settings are stored
        in your browser's local storage on your own device. They are not uploaded, synced
        or sold, because they never leave the browser.
      </p>
      <p>
        There are no accounts and no sign-ins, so there is no personal profile to hold.
        We do not run advertising trackers or third-party analytics on these pages.
      </p>
      <p>
        Clearing your browser's site data permanently deletes your saved paths and
        personal bests. There is no backup — that is the price and the point of keeping
        everything local.
      </p>
      <p>
        If a future feature ever needs server-side storage (for example, global
        leaderboards), it will be opt-in, clearly labeled, and this page will be updated
        before it ships.
      </p>
    </StaticPage>
  );
}
