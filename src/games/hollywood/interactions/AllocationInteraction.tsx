import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "../scoring";
import type { AllocationCategory } from "../types";

const SEGMENT_COLORS = ["bg-gold/90", "bg-foreground/85", "bg-muted-foreground/60"];

function initialValues(categories: AllocationCategory[]): Record<string, number> {
  const per = Math.floor(100 / categories.length);
  const init: Record<string, number> = {};
  categories.forEach((c, i) => {
    init[c.id] = i === 0 ? 100 - per * (categories.length - 1) : per;
  });
  return init;
}

/**
 * ALLOCATION — distribute a finite resource across categories.
 *
 * Percent-based sliders over a hard total: increasing one category is
 * clamped by what the others already hold, so trade-offs are physical.
 * The step only completes when every percent is assigned.
 */
export function AllocationInteraction({
  place,
  kicker,
  prompt,
  note,
  total,
  categories,
  onConfirm,
}: {
  place?: string | undefined;
  kicker: string;
  prompt: string;
  note?: string | undefined;
  /** Finite resource total, in dollars. */
  total: number;
  categories: AllocationCategory[];
  /** Receives categoryId -> percent, guaranteed to sum to 100. */
  onConfirm: (values: Record<string, number>) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>(() => initialValues(categories));

  const sum = categories.reduce((acc, c) => acc + (values[c.id] ?? 0), 0);
  const remaining = 100 - sum;

  const setValue = (id: string, raw: number) => {
    const category = categories.find((c) => c.id === id);
    const min = category?.min ?? 0;
    const others = categories.reduce((acc, c) => (c.id === id ? acc : acc + (values[c.id] ?? 0)), 0);
    const max = Math.max(min, 100 - others);
    const v = Math.max(min, Math.min(max, Math.round(raw)));
    setValues((prev) => ({ ...prev, [id]: v }));
  };

  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-5 py-10 sm:px-6 sm:py-12">
      <div className="w-full max-w-xl">
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
        <p className="mt-5 font-serif text-[clamp(1.35rem,3.2vw,1.8rem)] leading-snug text-foreground">
          {prompt}
        </p>
        {note && (
          <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {note}
          </p>
        )}

        {/* The pool */}
        <div className="mt-10 border border-border/80 bg-card/50 px-5 py-5 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              To allocate
            </p>
            <p className="font-serif text-3xl leading-none text-foreground">{formatMoney(total)}</p>
          </div>

          {/* Distribution bar */}
          <div className="mt-5 flex h-2 w-full overflow-hidden bg-secondary/70">
            {categories.map((c, i) => (
              <div
                key={c.id}
                className={`h-full transition-all duration-200 ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}
                style={{ width: `${values[c.id] ?? 0}%` }}
              />
            ))}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-4">
            <p
              className={`text-[11px] font-medium uppercase tracking-[0.2em] ${
                remaining === 0 ? "text-muted-foreground" : "text-gold"
              }`}
            >
              {remaining === 0
                ? "Fully allocated"
                : `${remaining}% — ${formatMoney((total * remaining) / 100)} unassigned`}
            </p>
            <button
              onClick={() => setValues(initialValues(categories))}
              className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Even split
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="mt-6 flex flex-col gap-5">
          {categories.map((c, i) => {
            const pct = values[c.id] ?? 0;
            return (
              <div key={c.id} className="border border-border/60 bg-card/40 px-5 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className={`h-2 w-2 shrink-0 ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`} />
                    <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-foreground">
                      {c.label}
                    </span>
                  </div>
                  <span className="shrink-0 font-serif text-lg text-foreground">
                    {formatMoney((total * pct) / 100)}
                    <span className="ml-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {pct}%
                    </span>
                  </span>
                </div>
                {c.description && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => setValue(c.id, Number(e.target.value))}
                  className="alloc-slider mt-3"
                  aria-label={`${c.label} share`}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            disabled={remaining !== 0}
            onClick={() => onConfirm(values)}
            className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] text-primary-foreground transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-foreground disabled:hover:text-primary-foreground"
          >
            {remaining === 0 ? "Lock the budget" : "Allocate everything"}
          </button>
        </div>
      </div>
    </div>
  );
}
