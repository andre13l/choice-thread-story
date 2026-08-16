import { useState } from "react";
import { attributionUrl, initials, portraitUrl } from "../images";
import type { Person } from "../data/dataset";

type Size = "sm" | "md" | "lg";

const BOX: Record<Size, string> = {
  sm: "h-11 w-11 text-[11px]",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 sm:h-28 sm:w-28 text-2xl",
};

const PIXELS: Record<Size, number> = { sm: 96, md: 160, lg: 320 };

/**
 * Actor portrait sourced from Wikimedia Commons (Wikidata P18).
 *
 * Files are hot-linked from Commons rather than copied, and each one keeps a
 * discreet link back to its Commons file page, where the author and licence
 * for that specific file live — licences vary file by file.
 */
export function Portrait({
  person,
  size = "sm",
  accent,
  showAttribution,
}: {
  person: Pick<Person, "name" | "image">;
  size?: Size;
  accent?: boolean;
  showAttribution?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : portraitUrl(person.image, PIXELS[size]);
  const credit = attributionUrl(person.image);

  return (
    <div className="relative shrink-0">
      <div
        className={[
          BOX[size],
          "flex items-center justify-center overflow-hidden border font-display font-bold tracking-[0.06em]",
          accent
            ? "border-link/50 bg-link/10 text-link"
            : "border-border/70 bg-card/50 text-muted-foreground",
        ].join(" ")}
      >
        {src ? (
          <img
            src={src}
            alt={person.name}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-top grayscale-[0.35] contrast-[1.02]"
          />
        ) : (
          <span aria-hidden>{initials(person.name)}</span>
        )}
      </div>
      {showAttribution && src && credit && (
        <a
          href={credit}
          target="_blank"
          rel="noreferrer noopener"
          title={`Photo of ${person.name} — source, author and licence on Wikimedia Commons`}
          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center border border-border/70 bg-background/90 text-[8px] font-medium text-muted-foreground transition-colors hover:text-link"
        >
          i
        </a>
      )}
    </div>
  );
}
