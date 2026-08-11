import { Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

export function DirectorIntro({ onBegin, resumed }: { onBegin: () => void; resumed: boolean }) {
  return (
    <div className="stage anim-fade-up flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        {SITE.name}
      </p>
      <div className="mt-8 h-px w-16 bg-gold/70" />
      <h1 className="mt-6 font-display text-[clamp(3.2rem,12vw,7rem)] leading-none tracking-[0.08em] text-foreground">
        HOLLYWOOD
      </h1>
      <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-gold/80">Direct</p>
      <p className="mt-8 max-w-sm text-base leading-relaxed text-muted-foreground">
        Pick the film. Cast it. Spend the money.
        <br />
        Then watch the room fill.
      </p>
      <button
        onClick={onBegin}
        className="mt-14 border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
      >
        {resumed ? "Continue" : "Begin"}
      </button>
      <Link
        to="/"
        className="mt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        All games
      </Link>
    </div>
  );
}
