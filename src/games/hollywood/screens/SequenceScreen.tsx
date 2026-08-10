import { useEffect } from "react";
import { AllocationInteraction } from "../interactions/AllocationInteraction";
import { PickInteraction } from "../interactions/PickInteraction";
import type { GameEvent, GameState, PickItem, SequenceContext } from "../types";
import { ScreenShell } from "./ScreenShell";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

/**
 * Renders one step of a multi-step sequence event. New interaction
 * families register a branch here (and a SequenceStep variant in
 * types.ts) — the game loop itself never hard-codes a screen.
 */
export function SequenceScreen({
  game,
  event,
  stepIndex,
  ctx,
  onPick,
  onAlloc,
}: {
  game: GameState;
  event: GameEvent;
  stepIndex: number;
  ctx: SequenceContext;
  onPick: (item: PickItem) => void;
  onAlloc: (values: Record<string, number>) => void;
}) {
  const sequence = event.sequence;

  // Each step is a fresh "screen" — never inherit the previous step's scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [stepIndex]);

  if (!sequence) return null;
  const step = sequence.steps[stepIndex];
  if (!step) return null;

  const total = sequence.steps.length;
  const prompt = typeof step.prompt === "function" ? step.prompt(ctx) : step.prompt;
  const setup = typeof event.text === "function" ? event.text(game) : event.text;
  const kicker = `${step.kicker} · ${ROMAN[stepIndex] ?? stepIndex + 1} / ${ROMAN[total - 1] ?? total}`;

  return (
    <ScreenShell game={game}>
      <div className="flex flex-1 flex-col">
        {/* Reel progress */}
        <div className="mx-auto w-full max-w-3xl px-5 pt-8 sm:px-6">
          <div className="flex items-center gap-2">
            {sequence.steps.map((s, i) => (
              <span
                key={s.id}
                className={`h-0.5 flex-1 transition-colors duration-500 ${
                  i <= stepIndex ? "bg-gold/80" : "bg-border/60"
                }`}
              />
            ))}
          </div>
        </div>

        <div key={stepIndex} className="flex flex-1 flex-col">
          {stepIndex === 0 && (
            <p className="anim-fade-up mx-auto mt-8 w-full max-w-xl px-5 font-serif text-base italic leading-relaxed text-muted-foreground sm:px-6">
              {setup}
            </p>
          )}

          {step.kind === "pick" && (
            <PickInteraction
              place={step.place ?? event.place}
              kicker={kicker}
              prompt={prompt}
              items={step.items}
              confirmVerb={step.confirmVerb}
              onConfirm={onPick}
            />
          )}

          {step.kind === "allocation" && (
            <AllocationInteraction
              place={step.place ?? event.place}
              kicker={kicker}
              prompt={prompt}
              note={step.note?.(ctx)}
              total={step.total(ctx)}
              categories={step.categories}
              onConfirm={onAlloc}
            />
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
