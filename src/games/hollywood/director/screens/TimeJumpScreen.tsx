import { useEffect } from "react";
import { formatSpan, type TimeJump } from "../pacing";

/**
 * The passage of time as a beat, not prose. One line, two years,
 * then back to work.
 */
export function TimeJumpScreen({ jump, onDone }: { jump: TimeJump; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);

  const accent =
    jump.tone === "down" ? "text-danger" : jump.tone === "up" ? "text-gold" : "text-foreground";

  return (
    <div
      className="anim-fade-in flex flex-1 cursor-pointer flex-col items-center justify-center px-6 py-24 text-center"
      onClick={onDone}
    >
      <p
        className={`font-display text-[clamp(1.5rem,6vw,2.6rem)] uppercase leading-tight tracking-[0.06em] ${accent}`}
      >
        {jump.headline}
      </p>
      <div className="mt-8 h-px w-16 bg-border" />
      <p className="mt-8 text-[12px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        {formatSpan(jump.months)}
      </p>
      {jump.toYear > jump.fromYear && (
        <p className="mt-4 font-display text-[clamp(1.8rem,7vw,3rem)] leading-none text-foreground/80">
          {jump.fromYear} <span className="text-muted-foreground/40">→</span> {jump.toYear}
        </p>
      )}
      <p className="mt-14 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/40">
        Tap to continue
      </p>
    </div>
  );
}
