import { Check } from "lucide-react";
import { useState } from "react";
import type { PickItem } from "../types";

/**
 * PICK — visually select one object/person/opportunity from several.
 *
 * Materially different from Quick Choice: rich cards with trait chips,
 * a committed selection state, then an explicit confirm. Used by the
 * movie chain for screenplays and casting.
 */
export function PickInteraction({
  place,
  kicker,
  prompt,
  items,
  confirmVerb = "Choose",
  onConfirm,
}: {
  place?: string | undefined;
  kicker: string;
  prompt: string;
  items: PickItem[];
  confirmVerb?: string | undefined;
  onConfirm: (item: PickItem) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const columns =
    items.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-5 py-10 sm:px-6 sm:py-12">
      <div className="w-full max-w-3xl">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold/80">
            {kicker}
          </p>
          {place && (
            <p className="shrink-0 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {place}
            </p>
          )}
        </div>
        <p className="mt-5 max-w-xl font-serif text-[clamp(1.35rem,3.2vw,1.8rem)] leading-snug text-foreground">
          {prompt}
        </p>

        <div className={`mt-10 grid gap-3 ${columns}`} role="radiogroup" aria-label={prompt}>
          {items.map((item, idx) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedId(item.id)}
                className={`group relative flex flex-col border p-5 text-left transition-all duration-200 ${
                  active
                    ? "border-gold bg-card shadow-[0_0_45px_-14px] shadow-gold/30"
                    : "border-border/80 bg-card/50 hover:border-foreground/50 hover:bg-card"
                } ${selectedId && !active ? "opacity-55" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-serif text-xs italic text-muted-foreground/70">
                    No. {idx + 1}
                  </span>
                  {active && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-gold-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-serif text-xl leading-tight text-foreground">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {item.subtitle}
                  </p>
                )}
                {item.description && (
                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {item.traits && item.traits.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.traits.map((t, i2) => (
                      <span
                        key={i2}
                        className={`border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] ${
                          t.tone === "gold"
                            ? "border-gold/40 text-gold"
                            : t.tone === "bad"
                              ? "border-danger/40 text-danger"
                              : t.tone === "good"
                                ? "border-foreground/30 text-foreground/80"
                                : "border-border text-muted-foreground"
                        }`}
                      >
                        {t.label} · {t.value}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
            className="border border-foreground bg-foreground px-10 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] text-primary-foreground transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-foreground disabled:hover:text-primary-foreground"
          >
            {selected ? `${confirmVerb} “${selected.title}”` : "Select one"}
          </button>
        </div>
      </div>
    </div>
  );
}
