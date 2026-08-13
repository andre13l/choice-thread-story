import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { loadPublishedStars, type LegendRecord } from "@/games/hollywood/storage";
import { formatMoney } from "@/games/hollywood/scoring";

export const Route = createFileRoute("/walk-of-fame")({
  head: () => ({
    meta: [
      { title: `Walk of Fame — ${SITE.name}` },
      {
        name: "description",
        content:
          "Every path ends. Almost all of them are forgotten. The Walk of Fame is where the rarest careers are written down — permanently.",
      },
      { property: "og:title", content: `Walk of Fame — ${SITE.name}` },
      {
        property: "og:description",
        content:
          "Every path ends. Almost all of them are forgotten. The Walk of Fame is where the rarest careers are written down — permanently.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nircosi.com/walk-of-fame" },
    ],
    links: [{ rel: "canonical", href: "https://nircosi.com/walk-of-fame" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Walk of Fame — ${SITE.name}`,
          url: "https://nircosi.com/walk-of-fame",
          description:
            "A record of the rarest Hollywood careers — the only ones that escaped the usual ending.",
          isPartOf: { "@id": "https://nircosi.com/#website" },
        }),
      },
    ],
  }),
  component: WalkOfFamePage,
});

/** Placeholder stars for the empty pavement. Odd numbers photograph better. */
const EMPTY_STARS = 7;

function WalkOfFamePage() {
  const [legends, setLegends] = useState<LegendRecord[] | null>(null);

  useEffect(() => {
    // Only verified stars ever appear here. Nothing local qualifies yet.
    setLegends(loadPublishedStars());
  }, []);

  return (
    <div className="stage flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="anim-fade-up w-full max-w-3xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {SITE.name}
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-gold/70" />
        <h1 className="mt-6 font-display text-[clamp(2.4rem,8vw,4.5rem)] leading-none tracking-[0.06em] text-foreground">
          WALK OF FAME
        </h1>

        <div className="mx-auto mt-10 max-w-xl space-y-4 text-[15px] leading-relaxed text-muted-foreground">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
            How a name gets here
          </h2>
          <p>Every path ends. Almost all of them are forgotten.</p>
          <p>
            A very small number of careers refuse to end the usual way. When one
            does — and it has been verified, frame by frame — its name is set
            here. Permanently.
          </p>
          <p className="text-[13px] text-muted-foreground/70">
            There is no form to fill in. No amount of fame, money, or awards is
            enough on its own. It simply happens, or it doesn't.
          </p>
        </div>

        {/* Empty state renders by default (and during SSR/first paint) so the
            pavement never flashes names that aren't loaded yet. */}
        {(!legends || legends.length === 0) && (
          <div className="mt-16">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {Array.from({ length: EMPTY_STARS }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-20 w-20 items-center justify-center border border-border/40 bg-card/20 sm:h-24 sm:w-24"
                >
                  <Star className="h-6 w-6 text-muted-foreground/25" />
                </div>
              ))}
            </div>
            <h2 className="mt-10 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
              The pavement is still empty
            </h2>
            <p className="mt-3 text-[13px] text-muted-foreground/60">
              No name has earned it yet. Yours would be the first.
            </p>
          </div>
        )}

        {legends && legends.length > 0 && (
          <div className="mt-16">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
              Verified legends
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {legends.map((legend) => (
              <div
                key={legend.careerId}
                className="border border-gold/40 bg-card/50 px-6 py-6 text-left backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <Star className="h-5 w-5 fill-gold/80 text-gold" />
                  <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    {new Date(legend.date).getFullYear()}
                  </span>
                </div>
                <p className="mt-4 font-display text-2xl tracking-[0.14em] text-gold">
                  LEGEND
                </p>
                <div className="mt-4 space-y-1.5 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                  <p>Career score — {legend.score.toLocaleString("en-US")}</p>
                  <p>
                    {legend.movies} films · {legend.oscars}{" "}
                    {legend.oscars === 1 ? "Oscar" : "Oscars"} · Peak {formatMoney(legend.peakMoney)}
                  </p>
                  <p>Age {legend.age}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
