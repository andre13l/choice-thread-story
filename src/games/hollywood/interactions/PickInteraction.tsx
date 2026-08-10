import { useState } from "react";
import type { PickItem } from "../types";

/**
 * PICK — visually select one object/person/opportunity from a small set.
 *
 * Two treatments, same interaction: "cards" (cinematic selection grid with
 * a confirm button) and "contract" (deal memos — clicking a memo signs it
 * immediately). Used for screenplays, cast, and deal choices.
 */
export function PickInteraction({
  place,
  kicker,
  prompt,
  items,
  confirmVerb,
  variant,
  onConfirm,
}: {
  place?: string;
  kicker: string;
  prompt: string;
  items: PickItem[];
  confirmVerb?: string;
  variant?: "cards" | "contract";
  onConfirm: (item: PickItem) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const isContract = variant === "contract";

  const choose = (item: PickItem) => {
    if (leaving) return;
    setSelected(item.id);
    setLeaving(true);
    setTimeout(() => onConfirm(item), 280);
  };

  const gridCls = isContract
    ? "mt-12 grid grid-cols-1 gap-4 md:grid-cols-3"
    : items.length <= 3
      ? "mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
      : "mt-12 grid grid-cols-2 gap-4";

  return (
    <div className="anim-fade-up flex flex-1 flex-col items-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-3xl">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {place ? `${place} · ` : ""}
          {kicker}
        </p>
        <h2 className="mt-6 text-center font-display text-[clamp(1.4rem,3.4vw,2rem)] leading-snug text-foreground">
          {prompt}
        </h2>

        <div className={gridCls}>
          {items.map((item) =>
            isContract ? (
              <ContractCard
                key={item.id}
                item={item}
                chosen={leaving && selected === item.id}
                dimmed={leaving && selected !== item.id}
                onSign={() => choose(item)}
              />
            ) : (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                disabled={leaving}
                className={`group flex flex-col border p-5 text-left transition-all duration-300 ${
                  selected === item.id
                    ? "border-gold/60 bg-card/80 shadow-[0_18px_50px_-24px] shadow-gold/25"
                    : "border-border/80 bg-card/40 hover:border-foreground/40 hover:bg-card/60"
                } ${leaving && selected !== item.id ? "opacity-35" : ""}`}
              >
                {item.subtitle && (
                  <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    {item.subtitle}
                  </span>
                )}
                <span className="mt-2 font-display text-xl leading-snug text-foreground">
                  {item.title}
                </span>
                {item.description && (
                  <span className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {item.description}
                  </span>
                )}
                {item.traits && item.traits.length > 0 && (
                  <span className="mt-4 flex flex-wrap gap-1.5">
                    {item.traits.map((t) => (
                      <span
                        key={t.label}
                        className={`border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                          t.tone === "gold"
                            ? "border-gold/40 text-gold"
                            : t.tone === "good"
                              ? "border-foreground/30 text-foreground/80"
                              : t.tone === "bad"
                                ? "border-danger/40 text-danger"
                                : "border-border/80 text-muted-foreground"
                        }`}
                      >
                        {t.label} — {t.value}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        {!isContract && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => {
                const item = items.find((i) => i.id === selected);
                if (item) choose(item);
              }}
              disabled={!selected || leaving}
              className={`border px-10 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] transition-all duration-300 ${
                selected
                  ? "border-foreground bg-foreground text-primary-foreground hover:bg-transparent hover:text-foreground"
                  : "cursor-not-allowed border-border/60 text-muted-foreground/50"
              }`}
            >
              {confirmVerb ?? "Confirm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A signable deal memo. Studio header, terms as hairline rows, fee
 * emphasized; clicking the memo signs it.
 */
function ContractCard({
  item,
  chosen,
  dimmed,
  onSign,
}: {
  item: PickItem;
  chosen: boolean;
  dimmed: boolean;
  onSign: () => void;
}) {
  return (
    <button
      onClick={onSign}
      disabled={chosen || dimmed}
      className={`group flex flex-col border text-left transition-all duration-300 ${
        chosen
          ? "border-gold/70 bg-card/80 shadow-[0_18px_50px_-24px] shadow-gold/25"
          : "border-border/80 bg-card/50 hover:border-foreground/50 hover:bg-card/70"
      } ${dimmed ? "opacity-35" : ""}`}
    >
      <span className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Deal memo
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-foreground/70">
          {item.subtitle}
        </span>
      </span>

      <span className="px-5 pt-4 font-display text-xl leading-snug text-foreground">
        {item.title}
      </span>

      {item.traits && item.traits.length > 0 && (
        <span className="mt-4 flex flex-col px-5">
          {item.traits.map((t) => (
            <span
              key={t.label}
              className="flex items-baseline justify-between border-b border-border/40 py-2 last:border-b-0"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t.label}
              </span>
              <span
                className={`text-[13px] font-medium ${
                  t.tone === "gold" ? "font-display text-gold" : "text-foreground/85"
                }`}
              >
                {t.value}
              </span>
            </span>
          ))}
        </span>
      )}

      {item.description && (
        <span className="mt-3 px-5 text-[11px] leading-relaxed text-muted-foreground/70">
          {item.description}
        </span>
      )}

      <span className="mt-auto px-5 pb-5 pt-6">
        <span
          className={`block border px-4 py-3 text-center text-[11px] font-medium uppercase tracking-[0.28em] transition-colors duration-300 ${
            chosen
              ? "border-gold/60 text-gold"
              : "border-foreground/60 text-foreground group-hover:bg-foreground group-hover:text-primary-foreground"
          }`}
        >
          {chosen ? "Signed" : "Sign"}
        </span>
      </span>
    </button>
  );
}
