import {
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GAMES } from "@/config/games";
import appCss from "../styles.css?url";

/**
 * Full-screen game routes render without site chrome (nav/footer) so play
 * stays cinematic and free of competing sticky headers. Derived from the
 * games registry: every playable game route opts out automatically.
 */
const CHROMELESS_ROUTES = new Set(
  GAMES.filter((g) => g.status === "playable" && g.to).map((g) => g.to as string),
);

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
        <RootChrome>{children}</RootChrome>
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Platform shell: header + content + footer on browsable pages; bare
 * full-screen rendering on game routes. The content column is intentionally
 * narrower than the viewport ceiling so desktop layouts reserve calm side
 * space (future non-intrusive side content) without touching the games.
 */
function RootChrome({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (CHROMELESS_ROUTES.has(pathname)) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1">
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
