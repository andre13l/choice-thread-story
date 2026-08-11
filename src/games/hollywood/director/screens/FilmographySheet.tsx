import { X } from "lucide-react";
import { formatMoney } from "../../scoring";
import { VERDICT_LABEL } from "../resolve";
import type { FilmResult } from "../types";

/** Compact filmography. What you've actually built, at a glance. */
export function FilmographySheet({
  films,
  onClose,
}: {
  films: FilmResult[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Filmography · {films.length}
        </p>
        <button
          onClick={onClose}
          aria-label="Close filmography"
          className="border border-border/70 p-1.5 text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3">
          {[...films].reverse().map((f) => (
            <div key={f.id} className="border border-border/70 bg-card/50 px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate font-display text-lg text-foreground">{f.title}</p>
                <p className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {f.year}
                </p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>{f.genre}</span>
                <span className="text-muted-foreground/40">/</span>
                <span>{VERDICT_LABEL[f.verdict]}</span>
                {f.oscars > 0 && <span className="text-gold">{f.oscars} won</span>}
                {f.nominations > 0 && f.oscars === 0 && (
                  <span className="text-gold/70">{f.nominations} nom</span>
                )}
                {f.cult && <span className="text-foreground/70">Cult</span>}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Cell label="Budget" value={formatMoney(f.budget)} />
                <Cell
                  label={f.theatrical === false ? "Revenue" : "Worldwide"}
                  value={formatMoney(f.worldwide)}
                  tone={f.studioResult > 0 ? "good" : "bad"}
                />
                <Cell label="Critics" value={String(f.critics)} />
                <Cell label="Audience" value={String(f.audience)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="border border-border/50 bg-background/40 px-1 py-2">
      <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-[13px] ${
          tone === "good" ? "text-foreground" : tone === "bad" ? "text-danger" : "text-foreground/90"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
