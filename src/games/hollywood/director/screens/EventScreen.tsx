import { formatMoney } from "../../scoring";
import type { EventOutcome } from "../career";
import type { CareerEvent, EventChoice, EventEffects } from "../events";

/**
 * CAREER EVENT — the turn between films. One headline, one situation,
 * two or three consequential answers, then the consequence itself.
 */
export function EventScreen({
  event,
  outcome,
  onChoose,
  onDone,
}: {
  event: CareerEvent;
  outcome: EventOutcome | null;
  onChoose: (choice: EventChoice) => void;
  onDone: () => void;
}) {
  const danger = event.kind === "crisis";
  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-xl">
        <p
          className={`text-[10px] font-medium uppercase tracking-[0.3em] ${
            danger ? "text-danger" : "text-gold/80"
          }`}
        >
          {event.kind === "opportunity" ? "Opportunity" : event.kind === "life" ? "Off the lot" : "Trouble"} ·{" "}
          {event.tag}
        </p>

        <h2 className="mt-4 font-display text-[clamp(1.7rem,6vw,2.6rem)] leading-[1.08] tracking-[0.01em] text-foreground">
          {event.headline}
        </h2>
        <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted-foreground">{event.situation}</p>

        <div
          className={`mt-6 h-px w-full ${danger ? "bg-danger/40" : "bg-border/70"}`}
          aria-hidden
        />

        {!outcome && (
          <div className="mt-6 flex flex-col gap-3">
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onChoose(choice)}
                className={`group border bg-card/40 px-5 py-4 text-left transition-colors ${
                  choice.tone === "danger"
                    ? "border-danger/40 hover:border-danger"
                    : choice.tone === "bold"
                      ? "border-gold/35 hover:border-gold"
                      : "border-border/70 hover:border-foreground/60"
                }`}
              >
                <p className="font-display text-[15px] leading-tight tracking-[0.01em] text-foreground">
                  {choice.label}
                </p>
                <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">{choice.detail}</p>
                {choice.risk != null && (
                  <p
                    className={`mt-2 text-[9px] uppercase tracking-[0.22em] ${
                      choice.risk >= 0.5 ? "text-danger/80" : "text-muted-foreground/60"
                    }`}
                  >
                    {choice.risk >= 0.5 ? "Could go badly" : "Some risk"}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {outcome && (
          <div className="anim-fade-up mt-6">
            <p
              className={`text-[10px] uppercase tracking-[0.26em] ${
                outcome.failed ? "text-danger" : "text-gold/80"
              }`}
            >
              {outcome.failed ? "It goes wrong" : "How it lands"}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{outcome.text}</p>

            <EffectStrip effects={outcome.effects} />

            <div className="mt-9 flex justify-center">
              <button
                onClick={onDone}
                className="border border-foreground bg-foreground px-12 py-3.5 text-[12px] font-medium uppercase tracking-[0.28em] text-primary-foreground transition-colors duration-300 hover:bg-transparent hover:text-foreground"
              >
                Back to work
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EffectStrip({ effects }: { effects: EventEffects }) {
  const rows: { label: string; value: string; good: boolean }[] = [];
  const push = (label: string, n: number | undefined, fmt?: (v: number) => string) => {
    if (!n) return;
    rows.push({
      label,
      value: fmt ? fmt(n) : `${n > 0 ? "+" : ""}${Math.round(n)}`,
      good: n > 0,
    });
  };
  push("Net worth", effects.money, (v) => `${v > 0 ? "+" : "−"}${formatMoney(Math.abs(v))}`);
  push("Respect", effects.reputation);
  push("Recognition", effects.recognition);
  push("Studio trust", effects.studioTrust);
  push("Awards standing", effects.prestige);
  if (effects.months) rows.push({ label: "Time", value: `${effects.months} mo`, good: false });

  if (rows.length === 0) return null;
  return (
    <div className="mt-6 grid grid-cols-2 gap-px border border-border/70 bg-border/40 sm:grid-cols-3">
      {rows.map((r) => (
        <div key={r.label} className="bg-card/60 px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{r.label}</p>
          <p className={`mt-1 font-display text-base ${r.good ? "text-foreground" : "text-danger"}`}>{r.value}</p>
        </div>
      ))}
    </div>
  );
}
