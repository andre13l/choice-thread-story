import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/site/AppShell";
import appCss from "../styles.css?url";



export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "google-site-verification",
        content: "-7zSBAFdG-IBLX9YOCNmyb3mBvmO_hxbGHHMg7D-GF8",
      },
      {
        name: "description",
        content:
          "A collection of short, highly replayable cinema and pop-culture games. Every choice changes your path.",
      },
      {
        property: "og:description",
        content:
          "A collection of short, highly replayable cinema and pop-culture games. Every choice changes your path.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Nircosi" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://nircosi.com/#organization",
              name: "Nircosi",
              url: "https://nircosi.com/",
              description:
                "Nircosi makes short, highly replayable cinema and pop-culture games.",
            },
            {
              "@type": "WebSite",
              "@id": "https://nircosi.com/#website",
              name: "Nircosi",
              url: "https://nircosi.com/",
              publisher: { "@id": "https://nircosi.com/#organization" },
              description:
                "Free movie games: direct a Hollywood career, guess box office in Higher / Lower, and link actors through films in Connect.",
            },
          ],
        }),
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <Scripts />
      </body>
    </html>
  );
}

