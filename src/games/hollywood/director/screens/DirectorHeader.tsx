import { Film } from "lucide-react";
import { formatMoney } from "../../scoring";
import { directorTier } from "../offers";
import type { DirectorCareer } from "../types";

/**
 * Career HUD. Numbers, not sentences: year, money, output, awards and
 * how the town currently reads you.
 */
export function DirectorHeader({
  career,
  onOpenFilmography,
}: {
  career: DirectorCareer;
  onOpenFilmography: () => void;
}) {
  const tier = directorTier(career);
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:px-6 sm:text-[11px]">
        <span className="shrink-0">
          <span className="text-foreground/90">Film #{career.films.length + 1}</span>{" "}
          <span className="text-muted-foreground/50">
            · {career.year} · {career.age}
          </span>
        </span>

        <span className={career.money < 0 ? "text-danger" : "text-foreground/90"}>
          {formatMoney(career.money)}
        </span>
        <span className="flex min-w-0 items-center gap-3 sm:gap-4">
          {career.oscars > 0 && (
            <span className="shrink-0 text-gold">
              {career.oscars} {career.oscars === 1 ? "Oscar" : "Oscars"}
            </span>
          )}
          <span className="hidden truncate text-gold/80 sm:inline">{tier}</span>
          <button
            onClick={onOpenFilmography}
            disabled={career.films.length === 0}
            className="flex shrink-0 items-center gap-1.5 border border-border/70 px-2.5 py-1 text-[10px] tracking-[0.18em] transition-colors hover:border-foreground/60 hover:text-foreground disabled:opacity-30"
          >
            <Film className="h-3 w-3" />
            {career.films.length}
          </button>
        </span>
      </div>
    </header>
  );
}
