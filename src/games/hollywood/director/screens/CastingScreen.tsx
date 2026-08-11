import { useState } from "react";
import { formatMoney } from "../../scoring";
import { CAST_SLOTS } from "../casting";
import { initials, portraitHue } from "../names";
import type { Actor, Project } from "../types";

/** CASTING — two roles, six candidates, one visible trade-off per card. */
export function CastingScreen({
  project,
  pool,
  onConfirm,
  onBack,
}: {
  project: Project;
  pool: Actor[];
  onConfirm: (cast: Actor[]) => void;
  onBack: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (id: string) => {
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length >= CAST_SLOTS
          ? [prev[1]!, id]
          : [...prev, id],
    );
  };

  const chosen = picked.map((id) => pool.find((a) => a.id === id)!).filter(Boolean);
  const total = chosen.reduce((a, c) => a + c.cost, 0);
  const share = Math.round((total / Math.max(1, project.budget)) * 100);
  const ready = chosen.length === CAST_SLOTS;

  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-12">
      <div className="w-full max-w-4xl">
        <div className="flex items-baseline justify-between gap-4">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
            {project.title} · {project.genre}
          </p>
          <button
            onClick={onBack}
            className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Back
          </button>
        </div>
        <h2 className="mt-4 font-display text-[clamp(1.5rem,3.8vw,2.1rem)] leading-tight text-foreground">
          Cast the two leads.
        </h2>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pool.map((a) => {
            const index = picked.indexOf(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className={`group flex flex-col border p-3 text-left transition-all duration-300 ${
                  index >= 0
                    ? "border-gold/60 bg-card/80"
                    : "border-border/80 bg-card/40 hover:border-foreground/40"
                }`}
              >
                <span className="relative block aspect-[4/5] w-full overflow-hidden">
                  <span
                    className="absolute inset-0 block"
                    style={{
                      background: `linear-gradient(150deg, hsl(${portraitHue(a.name)} 24% 30%), hsl(${(portraitHue(a.name) + 40) % 360} 18% 12%))`,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-display text-3xl tracking-[0.1em] text-foreground/60">
                    {initials(a.name)}
                  </span>
                  {index >= 0 && (
                    <span className="absolute left-2 top-2 border border-gold/70 bg-background/80 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.18em] text-gold">
                      {index === 0 ? "Lead" : "Second"}
                    </span>
                  )}
                </span>

                <span className="mt-3 block truncate font-display text-[15px] text-foreground">
                  {a.name}
                </span>
                <span className="mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {a.status}
                </span>
                <span className="mt-2 block font-display text-base text-foreground/85">
                  {formatMoney(a.cost)}
                </span>

                <span className="mt-2.5 flex flex-col gap-1.5">
                  <Bar label="Draw" value={a.draw} tone="fg" />
                  <Bar label="Craft" value={a.talent} tone="gold" />
                  <Bar label="Fit" value={a.fit} tone="fg" />
                  {a.volatility >= 60 && (
                    <span className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-danger/80">
                      Volatile
                    </span>
                  )}
                </span>

                <span className="mt-2 block text-[10px] leading-snug text-muted-foreground/80">
                  {a.note}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Salaries {formatMoney(total)}
            <span className={share > 55 ? "ml-2 text-danger" : "ml-2 text-muted-foreground/60"}>
              {share}% of budget
            </span>
          </p>
          <button
            disabled={!ready}
            onClick={() => onConfirm(chosen)}
            className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] text-primary-foreground transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-foreground disabled:hover:text-primary-foreground"
          >
            {ready ? "Lock the cast" : `Choose ${CAST_SLOTS - chosen.length} more`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: "gold" | "fg" }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="h-[3px] flex-1 bg-secondary/80">
        <span
          className={`block h-full ${tone === "gold" ? "bg-gold/80" : "bg-foreground/70"}`}
          style={{ width: `${Math.max(3, value)}%` }}
        />
      </span>
    </span>
  );
}
