import { useEffect, useRef, useState } from "react";

/**
 * Brief, skippable beat shown when a normal (non-legend) career ends:
 * an empty plaque whose engraving never finishes. Purely presentational.
 */
export function NoStarScreen({ onDone }: { onDone: () => void }) {
  const [copy, setCopy] = useState(false);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t1 = window.setTimeout(() => setCopy(true), reduced ? 200 : 1400);
    const t2 = window.setTimeout(finish, reduced ? 1200 : 2900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Skip"
      onClick={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") finish();
      }}
      className="anim-fade-in fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-background px-6"
    >
      <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
        <div className="absolute inset-0 rotate-45 border border-border/70 bg-card/60" />
        <div className="absolute inset-6 rotate-45 border border-border/40" />
        <div className="relative z-10 h-px w-16 bg-gold/50" />
      </div>

      <p className="anim-engrave mt-10 overflow-hidden whitespace-nowrap font-display text-[clamp(1.1rem,4.5vw,1.6rem)] uppercase tracking-[0.35em] text-foreground">
        THE DIRECTOR
      </p>

      <div className={copy ? "anim-fade-up mt-8 text-center" : "mt-8 text-center opacity-0"}>
        <p className="font-display text-[clamp(1.6rem,6vw,2.4rem)] uppercase tracking-[0.2em] text-foreground">
          Not this time.
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          No star on the pavement.
        </p>
      </div>

      <p className="absolute bottom-8 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">
        Tap to continue
      </p>
    </div>
  );
}
