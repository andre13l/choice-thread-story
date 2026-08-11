import { AlertTriangle, Wallet } from "lucide-react";
import { formatMoney } from "../../scoring";
import { directorTier } from "../offers";
import type { DirectorCareer, Project } from "../types";

/**
 * PROJECT OFFERS — the career's real narrator. Three cards; what they
 * are worth and who is sending them says everything.
 */
export function OffersScreen({
  career,
  offers,
  onSelect,
  onPass,
}: {
  career: DirectorCareer;
  offers: Project[];
  onSelect: (p: Project) => void;
  onPass: () => void;
}) {
  const tier = directorTier(career);
  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14">
      <div className="w-full max-w-5xl">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {career.year} · On your desk
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold/80">{tier}</p>
        </div>
        <h2 className="mt-4 font-display text-[clamp(1.6rem,4.2vw,2.4rem)] leading-tight text-foreground">
          What do you direct next?
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {offers.map((p) => (
            <OfferCard key={p.id} project={p} onSelect={() => onSelect(p)} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onPass}
            className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Take the year off
          </button>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: "gold" | "fg" | "danger" }) {
  const bar =
    tone === "gold" ? "bg-gold/80" : tone === "danger" ? "bg-danger/70" : "bg-foreground/70";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 h-[3px] w-full bg-secondary/80">
        <div className={`h-full ${bar}`} style={{ width: `${Math.max(3, value)}%` }} />
      </div>
    </div>
  );
}

function OfferCard({ project, onSelect }: { project: Project; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col border bg-card/45 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-card/70 ${
        project.selfFinanced
          ? "border-danger/40 hover:border-danger/70"
          : project.franchise
            ? "border-gold/40 hover:border-gold/70"
            : "border-border/80 hover:border-foreground/50"
      }`}
    >
      <span className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <span className="truncate text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {project.studio}
        </span>
        <span
          className={`shrink-0 text-[9px] font-medium uppercase tracking-[0.2em] ${
            project.lowStatus ? "text-muted-foreground/60" : "text-foreground/70"
          }`}
        >
          {project.studioTier}
        </span>
      </span>

      <span className="px-4 pt-4">
        <span className="block font-display text-[1.35rem] leading-tight text-foreground">
          {project.title}
        </span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          <span className="border border-border/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            {project.genre}
          </span>
          {project.franchise && (
            <span className="border border-gold/50 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">
              Franchise
            </span>
          )}
          {project.selfFinanced && (
            <span className="flex items-center gap-1 border border-danger/50 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-danger">
              <Wallet className="h-2.5 w-2.5" /> Your money
            </span>
          )}
        </span>
      </span>

      <span className="mt-4 flex items-end justify-between px-4">
        <span>
          <span className="block text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            {project.selfFinanced ? "Your stake" : "Budget"}
          </span>
          <span className="font-display text-2xl leading-none text-foreground">
            {formatMoney(project.budget)}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-[8px] uppercase tracking-[0.2em] text-muted-foreground">Fee</span>
          <span className="font-display text-lg leading-none text-foreground/80">
            {project.fee > 0 ? formatMoney(project.fee) : "—"}
          </span>
        </span>
      </span>

      <span className="mt-4 grid grid-cols-3 gap-2 px-4">
        <Meter label="Reach" value={project.commercial} tone="fg" />
        <Meter label="Prestige" value={project.prestige} tone="gold" />
        <Meter label="Risk" value={project.risk} tone="danger" />
      </span>

      <span className="mt-4 px-4 text-[11px] leading-snug text-muted-foreground">
        {project.logline}
      </span>

      {project.requirement && (
        <span className="mt-3 flex items-start gap-1.5 px-4 text-[10px] leading-snug text-gold/70">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {project.requirement}
        </span>
      )}

      <span className="mt-auto px-4 pb-4 pt-5">
        <span className="block border border-foreground/50 px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.26em] text-foreground transition-colors duration-300 group-hover:bg-foreground group-hover:text-primary-foreground">
          Direct it
        </span>
        <span className="mt-2 block text-center text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
          {project.statusLabel}
        </span>
      </span>
    </button>
  );
}
