import type { ReactNode } from "react";

/** Shared shell for platform text pages (About, Privacy, Terms, Contact). */
export function StaticPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="stage flex flex-1 flex-col px-6 py-16 sm:py-24">
      <div className="anim-fade-up mx-auto w-full max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </p>
        <div className="mt-6 h-px w-16 bg-gold/70" />
        <h1 className="mt-6 font-display text-[clamp(2rem,6vw,3.2rem)] leading-tight tracking-[0.04em] text-foreground">
          {title}
        </h1>
        <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </main>
  );
}
