import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { formatMoney } from "../../scoring";
import { castCost, minCastShare } from "../resolve";
import type { Actor, Allocation, Project } from "../types";

const SEGMENTS = [
  { id: "cast", label: "Cast", color: "bg-gold/85", hint: "Salaries. Underpay and they walk through it." },
  { id: "production", label: "Production", color: "bg-foreground/80", hint: "Days, crew, what ends up on screen." },
  { id: "marketing", label: "Marketing", color: "bg-muted-foreground/70", hint: "Whether anyone knows it exists." },
] as const;

/** BUDGET — a hard total. Everything you add, you take from something else. */
export function BudgetScreen({
  project,
  cast,
  onConfirm,
  onBack,
}: {
  project: Project;
  cast: Actor[];
  onConfirm: (alloc: Allocation) => void;
  onBack: () => void;
}) {
  const minCast = useMemo(() => minCastShare(project, cast), [project, cast]);
  const mins: Record<string, number> = { cast: minCast, production: 15, marketing: 8 };
  const start = useMemo(() => {
    const rest = 100 - minCast - 8;
    return {
      cast: minCast,
      production: Math.max(15, Math.round(rest * 0.62)),
      marketing: 100 - minCast - Math.max(15, Math.round(rest * 0.62)),
    };
  }, [minCast]);

  const [values, setValues] = useState<Record<string, number>>(start);
  const sum = SEGMENTS.reduce((a, s) => a + (values[s.id] ?? 0), 0);
  const remaining = 100 - sum;
  const belowMin = SEGMENTS.some((s) => (values[s.id] ?? 0) < (mins[s.id] ?? 0));

  const setValue = (id: string, raw: number) => {
    const min = mins[id] ?? 0;
    const others = SEGMENTS.reduce((a, s) => (s.id === id ? a : a + (values[s.id] ?? 0)), 0);
    const max = Math.max(min, 100 - others);
    setValues((prev) => ({ ...prev, [id]: Math.max(min, Math.min(max, Math.round(raw))) }));
  };

  const ready = remaining === 0 && !belowMin;

  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-12">
      <div className="w-full max-w-xl">
        <div className="flex items-baseline justify-between gap-4">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
            {project.title}
          </p>
          <button
            onClick={onBack}
            className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Recast
          </button>
        </div>
        <h2 className="mt-4 font-display text-[clamp(1.5rem,3.8vw,2.1rem)] leading-tight text-foreground">
          Spend the budget.
        </h2>

        <div className="mt-8 border border-border/80 bg-card/50 px-5 py-5 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {project.selfFinanced ? "Your money" : "Studio budget"}
            </p>
            <p className="font-display text-3xl leading-none text-foreground">
              {formatMoney(project.budget)}
            </p>
          </div>
          <div className="mt-5 flex h-2 w-full overflow-hidden bg-secondary/70">
            {SEGMENTS.map((s) => (
              <div
                key={s.id}
                className={`h-full transition-all duration-200 ${s.color}`}
                style={{ width: `${values[s.id] ?? 0}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <p
              className={`text-[10px] font-medium uppercase tracking-[0.18em] ${
                remaining === 0 ? "text-muted-foreground" : "text-gold"
              }`}
            >
              {remaining === 0
                ? "Fully allocated"
                : `${remaining}% — ${formatMoney((project.budget * remaining) / 100)} unassigned`}
            </p>
            <button
              onClick={() => setValues(start)}
              className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
          <p className="mt-3 border-t border-border/50 pt-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
            Cast contracted at {formatMoney(castCost(cast))} — min {minCast}%
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {SEGMENTS.map((s) => {
            const pct = values[s.id] ?? 0;
            return (
              <div key={s.id} className="border border-border/60 bg-card/40 px-5 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-baseline gap-3">
                    <span className={`h-2 w-2 shrink-0 ${s.color}`} />
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground">
                      {s.label}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-lg text-foreground">
                    {formatMoney((project.budget * pct) / 100)}
                    <span className="ml-2 text-[11px] tracking-[0.12em] text-muted-foreground">
                      {pct}%
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{s.hint}</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => setValue(s.id, Number(e.target.value))}
                  className="alloc-slider mt-2"
                  aria-label={`${s.label} share`}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-9 flex justify-center">
          <button
            disabled={!ready}
            onClick={() =>
              onConfirm({
                cast: values["cast"] ?? 0,
                production: values["production"] ?? 0,
                marketing: values["marketing"] ?? 0,
              })
            }
            className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] text-primary-foreground transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-foreground disabled:hover:text-primary-foreground"
          >
            {ready ? "Start shooting" : "Allocate everything"}
          </button>
        </div>
      </div>
    </div>
  );
}
