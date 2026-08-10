import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/site/StaticPage";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${SITE.name}` },
      { name: "description", content: `Get in touch with the ${SITE.name} team.` },
      { property: "og:title", content: `Contact — ${SITE.name}` },
      { property: "og:description", content: `Get in touch with the ${SITE.name} team.` },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <StaticPage eyebrow={SITE.name} title="CONTACT">
      {SITE.contactEmail ? (
        <p>
          For feedback, press and everything else:{" "}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            {SITE.contactEmail}
          </a>
        </p>
      ) : (
        <>
          <p>
            We're still setting up a public contact channel — the platform is young, and
            we'd rather open one inbox and answer it than list five we won't.
          </p>
          <p>
            Until then, the best way to reach us is through the place you first found{" "}
            {SITE.name}.
          </p>
        </>
      )}
    </StaticPage>
  );
}
